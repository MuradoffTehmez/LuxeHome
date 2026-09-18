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
  return [
    {
      id: "searchConsole",
      ready: searchConsole.configured,
      optional: true,
      missing: searchConsole.missing,
      credentialMode: searchConsole.mode,
    },
    envHealth("cloudflareAnalytics", ["CLOUDFLARE_ANALYTICS_TOKEN", "CF_ZONE_ID"]),
    envHealth("email", ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "NOTIFICATION_EMAIL"]),
    envHealth("emailWebhook", ["RESEND_WEBHOOK_SECRET"], true),
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
    envHealth(
      "push",
      ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
      true,
    ),
  ];
}
