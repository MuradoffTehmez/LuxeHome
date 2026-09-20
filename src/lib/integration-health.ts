import {
  getSearchConsoleCredentialStatus,
  type SearchConsoleCredentialMode,
} from "@/lib/google-search-console";
import { hasRuntimeEnv } from "@/lib/runtime-env";

export type IntegrationHealthId =
  | "searchConsole"
  | "cloudflareAnalytics"
  | "email"
  | "emailWebhook"
  | "geocoding"
  | "turnstile"
  | "savedSearchCron"
  | "push";

export type IntegrationHealthItem = {
  id: IntegrationHealthId;
  ready: boolean;
  optional: boolean;
  missing: string[];
  credentialMode?: SearchConsoleCredentialMode;
};

function envHealth(
  id: IntegrationHealthId,
  keys: string[],
  optional = false,
): IntegrationHealthItem {
  return {
    id,
    ready: keys.every(hasRuntimeEnv),
    optional,
    missing: keys.filter((key) => !hasRuntimeEnv(key)),
  };
}

/** Secret dəyərlərini qaytarmadan production inteqrasiyalarının hazırlığını göstərir. */
export function getIntegrationHealth(): IntegrationHealthItem[] {
  const searchConsole = getSearchConsoleCredentialStatus();
  // `NEXT_PUBLIC_*` dəyərləri Next.js tərəfindən build vaxtı yalnız literal
  // `process.env.NEXT_PUBLIC_...` oxunuşlarına yazılır. `runtimeEnv(name)`-dəki
  // dinamik indeks həmin əvəzləməni görmür və açar Worker binding-i olmadığı üçün
  // düzgün qurulmuş push inteqrasiyasını yanlış olaraq «çatışmır» göstərərdi.
  const hasVapidPublicKey = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
  const hasVapidPrivateKey = hasRuntimeEnv("VAPID_PRIVATE_KEY");
  const hasVapidSubject = hasRuntimeEnv("VAPID_SUBJECT");
  return [
    {
      id: "searchConsole",
      ready: searchConsole.configured,
      optional: true,
      missing: searchConsole.missing,
      credentialMode: searchConsole.mode,
    },
    envHealth("cloudflareAnalytics", ["CLOUDFLARE_ANALYTICS_TOKEN", "CF_ZONE_ID"]),
    // Göndərən və bildiriş ünvanları tətbiq daxilində təhlükəsiz fallback-lara malikdir.
    envHealth("email", ["RESEND_API_KEY"]),
    // Webhook imzasını yoxlamaq üçün həm Resend klienti, həm də webhook sirri lazımdır.
    envHealth("emailWebhook", ["RESEND_API_KEY", "RESEND_WEBHOOK_SECRET"], true),
    envHealth("geocoding", ["GEOAPIFY_API_KEY"]),
    {
      id: "turnstile",
      ready:
        hasRuntimeEnv("TURNSTILE_SITE_KEY") &&
        (hasRuntimeEnv("TURNSTILE_SECRET") || hasRuntimeEnv("TURNSTILE_SECRET_KEY")) &&
        hasRuntimeEnv("TURNSTILE_HOSTNAMES"),
      optional: false,
      missing: [
        ...(!hasRuntimeEnv("TURNSTILE_SITE_KEY") ? ["TURNSTILE_SITE_KEY"] : []),
        ...(!hasRuntimeEnv("TURNSTILE_SECRET") && !hasRuntimeEnv("TURNSTILE_SECRET_KEY")
          ? ["TURNSTILE_SECRET"]
          : []),
        ...(!hasRuntimeEnv("TURNSTILE_HOSTNAMES") ? ["TURNSTILE_HOSTNAMES"] : []),
      ],
    },
    envHealth("savedSearchCron", ["CRON_SECRET"]),
    {
      id: "push",
      ready: hasVapidPublicKey && hasVapidPrivateKey && hasVapidSubject,
      optional: true,
      missing: [
        ...(!hasVapidPublicKey ? ["NEXT_PUBLIC_VAPID_PUBLIC_KEY"] : []),
        ...(!hasVapidPrivateKey ? ["VAPID_PRIVATE_KEY"] : []),
        ...(!hasVapidSubject ? ["VAPID_SUBJECT"] : []),
      ],
    },
  ];
}
