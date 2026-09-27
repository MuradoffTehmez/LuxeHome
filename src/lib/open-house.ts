import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/email-html";
import { findManyInChunks } from "@/lib/d1-chunks";

/**
 * Açıq qapı günləri (#109) — elanın ümumi baxış pəncərəsi və qeydiyyat.
 *
 * Qeydiyyat eyni zamanda CRM müraciəti yaradır ki, satış komandası iştirakçıları
 * lövhədə görsün; telefon üzrə təkrar qeydiyyat unikal indekslə bağlanır.
 */

/** Saytda göstərilən ən çox slot sayı. */
export const MAX_PUBLIC_SLOTS = 6;
export async function getUpcomingOpenHouses(propertyId: string, now = new Date()) {
  const slots = await prisma.openHouse.findMany({
    where: { propertyId, endsAt: { gt: now } },
    orderBy: { startsAt: "asc" },
    take: MAX_PUBLIC_SLOTS,
    select: { id: true, startsAt: true, endsAt: true, capacity: true, note: true, _count: { select: { registrations: true } } },
  });
  return slots.map(({ _count, ...slot }) => ({ ...slot, registered: _count.registrations }));
}

export type OpenHouseSlot = Awaited<ReturnType<typeof getUpcomingOpenHouses>>[number];

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const REMINDER_BATCH = 200;

export type SeatReservation = { status: "reserved"; registrationId: string } | { status: "duplicate" } | { status: "full" };

/**
 * Qeydiyyat yerini **tək SQL ifadəsi** ilə ayırır (#109). D1-də tranzaksiya olmadığı üçün
 * «say oxu → yoxla → yaz» ardıcıllığı iki eyni anda gələn sorğuda sonuncu yeri iki dəfə
 * verərdi. `INSERT … SELECT … WHERE COUNT(*) < capacity` sayı və yazını bir ifadədə edir;
 * SQLite yazıları ardıcıllaşdırdığı üçün tutum aşılmır. Eyni telefon unikal indekslə
 * (`ON CONFLICT DO NOTHING`) ikinci dəfə yazılmır.
 */
export async function reserveOpenHouseSeat(input: {
  openHouseId: string;
  name: string;
  phone: string;
  email: string | null;
  now?: Date;
}): Promise<SeatReservation> {
  const id = crypto.randomUUID();
  const createdAt = (input.now ?? new Date()).toISOString();
  const inserted = await prisma.$executeRaw`
    INSERT INTO "OpenHouseRegistration" ("id", "openHouseId", "name", "phone", "email", "createdAt")
    SELECT ${id}, ${input.openHouseId}, ${input.name}, ${input.phone}, ${input.email}, ${createdAt}
     WHERE EXISTS (
       SELECT 1 FROM "OpenHouse" AS "slot"
        WHERE "slot"."id" = ${input.openHouseId}
          AND ("slot"."capacity" IS NULL
               OR (SELECT COUNT(*) FROM "OpenHouseRegistration" AS "r" WHERE "r"."openHouseId" = "slot"."id") < "slot"."capacity")
     )
    ON CONFLICT ("openHouseId", "phone") DO NOTHING`;
  if (inserted > 0) return { status: "reserved", registrationId: id };
  const existing = await prisma.openHouseRegistration.findUnique({
    where: { openHouseId_phone: { openHouseId: input.openHouseId, phone: input.phone } },
    select: { id: true },
  });
  return existing ? { status: "duplicate" } : { status: "full" };
}

/**
 * Gündəlik iş: sabah başlayan slotun e-poçtlu iştirakçılarına xatırlatma (idempotent).
 *
 * Slot və elan məlumatı nested əlaqə ilə deyil, ayrıca və hissə-hissə oxunur: 98-dən çox
 * valideynli əlaqə yüklənməsi D1-in 100 parametr həddini aşır və sorğunu ilişdirir.
 */
export async function sendOpenHouseReminders(now = new Date()) {
  const slots = await prisma.openHouse.findMany({
    where: { startsAt: { gt: now, lte: new Date(now.getTime() + REMINDER_WINDOW_MS) } },
    select: { id: true, startsAt: true, propertyId: true },
  });
  if (slots.length === 0) return 0;
  const properties = await findManyInChunks(
    [...new Set(slots.map((slot) => slot.propertyId))],
    0,
    (ids) => prisma.property.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, address: true } }),
  );
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));

  const due = await findManyInChunks(
    slots.map((slot) => slot.id),
    2,
    (ids) => prisma.openHouseRegistration.findMany({
      where: { openHouseId: { in: ids }, reminderSentAt: null, email: { not: null } },
      select: { id: true, name: true, email: true, openHouseId: true },
      take: REMINDER_BATCH,
    }),
  );
  let sent = 0;
  for (const registration of due.slice(0, REMINDER_BATCH)) {
    const slot = slotById.get(registration.openHouseId);
    const property = slot ? propertyById.get(slot.propertyId) : undefined;
    if (!slot || !property) continue;
    const when = new Intl.DateTimeFormat("az-AZ", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Baku" }).format(slot.startsAt);
    const place = [property.title, property.address].filter(Boolean).join(" — ");
    await sendEmail({
      to: registration.email as string,
      subject: `Açıq qapı xatırlatması — ${property.title}`,
      html: `<p>${escapeHtml(registration.name)}, sizi gözləyirik.</p><p><strong>${escapeHtml(when)}</strong><br>${escapeHtml(place)}</p>`,
    }).catch(() => undefined);
    await prisma.openHouseRegistration.update({ where: { id: registration.id }, data: { reminderSentAt: now } });
    sent += 1;
  }
  return sent;
}
