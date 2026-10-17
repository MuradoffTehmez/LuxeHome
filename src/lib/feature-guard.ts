import { getTranslations } from "next-intl/server";
import { type ActionState, failure } from "@/lib/admin/action-state";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { FeatureFlag } from "@/lib/feature-flags-policy";

/**
 * İctimai/kabinet action-u üçün (#242): modul söndürülübsə hazır xəta, açıqdırsa `null`.
 * `feature-flags.ts`-dən ayrıdır ki, domen modulları (risk, bildiriş) next-intl yükləməsin.
 */
export async function featureDisabledFailure(flag: FeatureFlag): Promise<ActionState | null> {
  if (await isFeatureEnabled(flag)) return null;
  const t = await getTranslations("common");
  return failure(t("featureDisabled"));
}
