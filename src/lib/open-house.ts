import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/email-html";

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

/** Gündəlik iş: sabah başlayan slotun e-poçtlu iştirakçılarına xatırlatma (idempotent). */
export async function sendOpenHouseReminders(now = new Date()) {
  const due = await prisma.openHouseRegistration.findMany({
    where: {
      reminderSentAt: null,
      email: { not: null },
      openHouse: { startsAt: { gt: now, lte: new Date(now.getTime() + REMINDER_WINDOW_MS) } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      openHouse: { select: { startsAt: true, property: { select: { title: true, address: true } } } },
    },
    take: 200,
  });
  for (const registration of due) {
    const when = new Intl.DateTimeFormat("az-AZ", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Baku" }).format(registration.openHouse.startsAt);
    const place = [registration.openHouse.property.title, registration.openHouse.property.address].filter(Boolean).join(" — ");
    await sendEmail({
      to: registration.email as string,
      subject: `Açıq qapı xatırlatması — ${registration.openHouse.property.title}`,
      html: `<p>${escapeHtml(registration.name)}, sizi gözləyirik.</p><p><strong>${escapeHtml(when)}</strong><br>${escapeHtml(place)}</p>`,
    }).catch(() => undefined);
    await prisma.openHouseRegistration.update({ where: { id: registration.id }, data: { reminderSentAt: now } });
  }
  return due.length;
}
