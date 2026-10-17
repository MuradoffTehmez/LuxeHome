"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { type ActionState, failure, success } from "@/lib/admin/action-state";
import {
  AUTH_KINDS,
  REPORT_EVIDENCE_MAX_BYTES,
  REPORT_EVIDENCE_MAX_FILES,
  REPORT_MESSAGE_MAX,
  REPORT_REASONS,
  isReportReason,
  type ReportReason,
} from "@/lib/constants";
import { checkReportLimit, clientIp } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { getOptionalUser } from "@/lib/auth/guard";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/spam";
import { isSystemWriteBlocked } from "@/lib/system-mode";
import { submitListingReport } from "@/lib/listing-reports";
import { sniffImageType } from "@/lib/media/storage";
import { featureDisabledFailure } from "@/lib/feature-guard";

/**
 * «Elanı şikayət et» (#159, #195). Əlaqə forması ilə eyni qoruma: honeypot, same-origin,
 * yazma rejimi, IP limiti, Turnstile. Bir neçə səbəb seçilə bilər; sübut şəkli yalnız
 * daxil olmuş istifadəçidən qəbul olunur. Eyni şəxsin eyni elana 24 saatda ikinci şikayəti
 * yeni qeyd yaratmır, amma ziyarətçiyə yenə uğur göstərilir (təkrar göndərməyə ehtiyac yoxdur).
 */
export async function reportListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("property.report");
  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) return success(t("thanks"));
  const disabled = await featureDisabledFailure("REPORTS");
  if (disabled) return disabled;

  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return failure(t("errors.generic"));
    throw error;
  }
  if (await isSystemWriteBlocked()) return failure(t("errors.generic"));

  const ip = clientIp(await headers());
  if (!(await checkReportLimit(ip))) return failure(t("errors.rateLimited"));

  const reasons = [...new Set(formData.getAll("reason").filter(isReportReason))] as ReportReason[];
  const message = String(formData.get("message") ?? "").trim().replace(/\s+/g, " ").slice(0, REPORT_MESSAGE_MAX);
  if (reasons.length === 0) return failure(t("errors.reason"), { reason: t("errors.reason") });
  if (reasons.includes(REPORT_REASONS.OTHER) && message.length < 10) {
    return failure(t("errors.messageRequired"), { message: t("errors.messageRequired") });
  }

  const user = await getOptionalUser(AUTH_KINDS.PUBLIC);
  const evidence = formData.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
  const evidenceError = await checkEvidence(evidence, Boolean(user));
  if (evidenceError) return failure(t(`errors.${evidenceError}`), { evidence: t(`errors.${evidenceError}`) });

  if (!(await verifyTurnstile(formData, "listing_report", ip))) return failure(t("errors.security"));

  const propertyId = String(formData.get("propertyId") ?? "");
  const result = await submitListingReport({
    propertyId: propertyId.slice(0, 40),
    reasons,
    message: message || null,
    ip,
    userId: user?.id ?? null,
    evidence,
  });
  if (result === "notFound") return failure(t("errors.generic"));
  return success(t("thanks"));
}

type EvidenceError = "evidenceSignIn" | "evidenceCount" | "evidenceSize" | "evidenceType";

/**
 * Sübut faylları Turnstile-dan əvvəl ucuz yoxlanılır. Qonaq fayl göndərə bilməz (#195 qərarı):
 * forma ona sahəni göstərmir, amma birbaşa POST da rədd olunur. Növ bayt imzası ilə yoxlanılır —
 * `File.type` brauzerin yazdığıdır.
 */
async function checkEvidence(files: readonly File[], signedIn: boolean): Promise<EvidenceError | null> {
  if (files.length === 0) return null;
  if (!signedIn) return "evidenceSignIn";
  if (files.length > REPORT_EVIDENCE_MAX_FILES) return "evidenceCount";
  for (const file of files) {
    if (file.size > REPORT_EVIDENCE_MAX_BYTES) return "evidenceSize";
    if (!sniffImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()))) return "evidenceType";
  }
  return null;
}
