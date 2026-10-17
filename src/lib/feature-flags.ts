import { cache } from "react";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { effectiveFeatureFlags, parseFeatureFlags, type FeatureFlag, type FeatureFlags } from "@/lib/feature-flags-policy";

/**
 * Funksiya bayraqlarının oxunması (#242). Sorğu başına bir dəfə oxunur (`cache`); oxuma xətası
 * defolta qayıdır (`getSetting` atmır). Söndürülmüş modulun server action-u və API-si də bunu
 * yoxlamalıdır — yalnız UI-ı gizlətmək kifayət deyil (PRD 16.6).
 */
export const getFeatureFlags = cache(async (): Promise<FeatureFlags> =>
  effectiveFeatureFlags(parseFeatureFlags(await getSetting(SETTING_KEYS.FEATURE_FLAGS))));

export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  return (await getFeatureFlags())[flag];
}
