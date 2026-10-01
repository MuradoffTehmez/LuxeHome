"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LEAD_SOURCES, LEAD_STATUSES, PROPERTY_STATUSES } from "@/lib/constants";
import { formatLocalizedDateTime } from "@/i18n/date";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { checkContactLimit, clientIp } from "@/lib/auth/rate-limit";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/spam";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { isSystemWriteBlocked } from "@/lib/system-mode";
import { notifyLeadOnTelegram } from "@/lib/telegram";
import { slotAvailability } from "@/lib/open-house-availability";
import { reserveOpenHouseSeat } from "@/lib/open-house";

/**
 * Açıq qapı gününə qeydiyyat (#109). Əlaqə forması ilə eyni spam qapısı: honeypot →
 * mənbə → sistem rejimi → sürət limiti → Turnstile. Qeydiyyat CRM müraciəti də yaradır.
 */

export type OpenHouseState = { status: "idle" | "success" | "error"; message?: string };

const schema = z.object({
  openHouseId: z.string().min(1).max(40),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().max(200).email().optional().or(z.literal("")),
});

export async function registerForOpenHouse(_prev: OpenHouseState, formData: FormData): Promise<OpenHouseState> {
  const t = await getTranslations("property.openHouse");
  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) return { status: "success", message: t("registered") };
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return { status: "error", message: t("rejected") };
    throw error;
  }
  if (await isSystemWriteBlocked()) return { status: "error", message: t("rejected") };
  const ip = clientIp(await headers());
  if (!(await checkContactLimit(ip))) return { status: "error", message: t("rateLimited") };
  if (!(await verifyTurnstile(formData, "open_house", ip))) return { status: "error", message: t("rejected") };

  const parsed = schema.safeParse({
    openHouseId: formData.get("openHouseId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
  });
  if (!parsed.success) return { status: "error", message: t("invalid") };

  try {
    const slot = await prisma.openHouse.findUnique({
      where: { id: parsed.data.openHouseId },
      select: {
        id: true,
        startsAt: true,
        capacity: true,
        property: { select: { id: true, title: true, status: true, deletedAt: true } },
        _count: { select: { registrations: true } },
      },
    });
    if (!slot || slot.property.deletedAt || slot.property.status !== PROPERTY_STATUSES.PUBLISHED) {
      return { status: "error", message: t("unavailable") };
    }
    const availability = slotAvailability({ startsAt: slot.startsAt, capacity: slot.capacity, registered: slot._count.registrations });
    if (availability !== "open") return { status: "error", message: availability === "full" ? t("full") : t("closed") };

    // Yer atomar ayrılır — yuxarıdakı yoxlama yalnız tez rədd üçündür, tutumu qorumur.
    const seat = await reserveOpenHouseSeat({
      openHouseId: slot.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
    });
    if (seat.status === "duplicate") return { status: "success", message: t("alreadyRegistered") };
    if (seat.status === "full") return { status: "error", message: t("full") };

    const when = formatLocalizedDateTime(slot.startsAt, "az", "short") ?? "";
    let lead;
    try {
      lead = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        subject: `Açıq qapı: ${when}`,
        message: `«${slot.property.title}» elanının açıq qapı gününə qeydiyyat (${when}).`,
        source: LEAD_SOURCES.PROPERTY,
        status: LEAD_STATUSES.NEW,
        propertyId: slot.property.id,
      },
      select: { id: true },
      });
    } catch (error) {
      // Kompensasiya: müraciət yazılmayıbsa ayrılmış yer boşaldılır, ziyarətçi yenidən cəhd edə bilər.
      await prisma.openHouseRegistration.delete({ where: { id: seat.registrationId } }).catch(() => undefined);
      throw error;
    }
    await prisma.openHouseRegistration.update({ where: { id: seat.registrationId }, data: { leadId: lead.id } });
    await notifyLeadOnTelegram({
      kind: "reservation",
      id: lead.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      propertyTitle: slot.property.title,
      requestedFor: slot.startsAt,
      subject: "Açıq qapı",
    });
    return { status: "success", message: t("registered") };
  } catch (error) {
    console.error("[open-house] qeydiyyat alınmadı:", error);
    return { status: "error", message: t("unexpected") };
  }
}
