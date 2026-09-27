"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { cancelOrder, createCabinetOrder, formatPackageOrderTelegram, type OrderFailure } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

const PATH = "/kabinet/paketler";

const FAILURE_KEYS: Record<OrderFailure, "packageUnavailable" | "propertyUnavailable" | "tooManyPending" | "duplicatePending" | "unavailable"> = {
  "package-inactive": "packageUnavailable",
  "property-unavailable": "propertyUnavailable",
  "too-many-pending": "tooManyPending",
  "duplicate-pending": "duplicatePending",
  "not-found": "unavailable",
  "invalid-status": "unavailable",
};

const requestSchema = z.object({ propertyId: z.string().min(1), packageId: z.string().min(1) });

/**
 * Premium paket sifarişi (#109). Ödəniş burada alınmır — sifariş menecerə düşür,
 * o əlaqə saxlayır və ödəniş təsdiqlənəndə premium aktivləşir.
 */
export async function requestPackage(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.packages");
  let user;
  try {
    user = await requirePublicAction("property", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(t("choosePrompt"));

  try {
    const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } });
    const result = await createCabinetOrder({
      user: { id: user.id, name: user.name, phone: profile?.phone ?? null },
      propertyId: parsed.data.propertyId,
      packageId: parsed.data.packageId,
    });
    if (!result.ok) return failure(t(`errors.${FAILURE_KEYS[result.reason]}`));

    await sendTelegramMessage(formatPackageOrderTelegram({
      packageName: result.packageName,
      amountMinor: result.amountMinor,
      propertyTitle: result.propertyTitle,
      customerName: user.name,
      customerPhone: profile?.phone ?? null,
    })).catch(() => undefined);
  } catch (error) {
    return unexpected("paket sifarişi yaradılmadı", error, t("errors.unavailable"));
  }

  revalidatePath(localizePath(PATH, locale));
  return success(t("requested"));
}

export async function cancelMyPackageOrder(id: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.packages");
  let user;
  try {
    user = await requirePublicAction("property", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const result = await cancelOrder(id, user.id);
    if (!result.ok) return failure(t("errors.unavailable"));
  } catch (error) {
    return unexpected("paket sifarişi ləğv edilmədi", error, t("errors.unavailable"));
  }
  revalidatePath(localizePath(PATH, locale));
  return success(t("cancelled"));
}
