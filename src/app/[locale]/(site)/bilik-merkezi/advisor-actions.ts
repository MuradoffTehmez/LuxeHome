"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/constants";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { checkKnowledgeAdvisorLimit, clientIp } from "@/lib/auth/rate-limit";
import { ADVISOR_QUESTION_MAX, askKnowledgeAdvisor, type AdvisorResult } from "@/lib/knowledge-advisor";

export type AdvisorResponse = AdvisorResult | { status: "invalid" } | { status: "rateLimited" };

/**
 * Bilik Mərkəzi AI məsləhətçisi (#109). Anonim çağırışdır: mənbə yoxlaması,
 * honeypot və öz sürət limiti var; nəticə yalnız dərc olunmuş məzmundan qurulur.
 */
export async function askAdvisor(input: { question: string; website?: string }): Promise<AdvisorResponse> {
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return { status: "invalid" };
    throw error;
  }
  // Honeypot: insana görünməyən sahə doludursa bot sayılır — inference xərclənmir.
  if (input.website) return { status: "invalid" };
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (question.length < 5 || question.length > ADVISOR_QUESTION_MAX) return { status: "invalid" };
  if (!(await checkKnowledgeAdvisorLimit(clientIp(await headers())))) return { status: "rateLimited" };

  const locale = (await getLocale()) as Locale;
  return askKnowledgeAdvisor(question, locale);
}
