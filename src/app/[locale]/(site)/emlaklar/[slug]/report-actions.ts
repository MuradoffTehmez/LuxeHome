"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { type ActionState, failure, success } from "@/lib/admin/action-state";
import { AUTH_KINDS, REPORT_MESSAGE_MAX, REPORT_REASONS, isReportReason } from "@/lib/constants";
import { checkReportLimit, clientIp } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { getOptionalUser } from "@/lib/auth/guard";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/spam";
import { isSystemWriteBlocked } from "@/lib/system-mode";
import { submitListingReport } from "@/lib/listing-reports";

/**
 * «Elanı şikayət et» (#159). Əlaqə forması ilə eyni qoruma: honeypot, same-origin,
 * yazma rejimi, IP limiti, Turnstile. Eyni şəxsin eyni elana 24 saatda ikinci şikayəti
 * yeni qeyd yaratmır, amma ziyarətçiyə yenə uğur göstərilir (təkrar göndərməyə ehtiyac yoxdur).
 */
export async function reportListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("property.report");
  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) return success(t("thanks"));

  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return failure(t("errors.generic"));
    throw error;
  }
  if (await isSystemWriteBlocked()) return failure(t("errors.generic"));

  const ip = clientIp(await headers());
  if (!(await checkReportLimit(ip))) return failure(t("errors.rateLimited"));

  const reason = formData.get("reason");
  const message = String(formData.get("message") ?? "").trim().replace(/\s+/g, " ").slice(0, REPORT_MESSAGE_MAX);
  if (!isReportReason(reason)) return failure(t("errors.reason"), { reason: t("errors.reason") });
  if (reason === REPORT_REASONS.OTHER && message.length < 10) {
    return failure(t("errors.messageRequired"), { message: t("errors.messageRequired") });
  }
  if (!(await verifyTurnstile(formData, "listing_report", ip))) return failure(t("errors.security"));

  const propertyId = String(formData.get("propertyId") ?? "");
  const user = await getOptionalUser(AUTH_KINDS.PUBLIC);
  const result = await submitListingReport({
    propertyId: propertyId.slice(0, 40),
    reason,
    message: message || null,
    ip,
    userId: user?.id ?? null,
  });
  if (result === "notFound") return failure(t("errors.generic"));
  return success(t("thanks"));
}
