import { afterEach, describe, expect, it } from "vitest";
import { getIntegrationHealth } from "@/lib/integration-health";

const ENV_KEYS = [
  "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON",
  "CLOUDFLARE_ANALYTICS_TOKEN",
  "CF_ZONE_ID",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NOTIFICATION_EMAIL",
  "RESEND_WEBHOOK_SECRET",
  "GEOAPIFY_API_KEY",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET",
  "TURNSTILE_SECRET_KEY",
  "TURNSTILE_HOSTNAMES",
  "CRON_SECRET",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
] as const;

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("inteqrasiya sağlamlığı", () => {
  it("secret dəyəri əvəzinə yalnız çatışmayan açar adlarını qaytarır", () => {
    process.env.CF_ZONE_ID = "d401a9f612bc47ed88e1c14e658141d1";
    const analytics = getIntegrationHealth().find(
      (item) => item.id === "cloudflareAnalytics",
    );

    expect(analytics).toMatchObject({
      ready: false,
      optional: false,
      missing: ["CLOUDFLARE_ANALYTICS_TOKEN"],
    });
  });

  it("alternativ Turnstile secret adını qəbul edir", () => {
    process.env.TURNSTILE_SITE_KEY = "0x4AAAAAAEfhXUNNmS0Ka_DO";
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    process.env.TURNSTILE_HOSTNAMES = "luxehomeestate.az,www.luxehomeestate.az";
    const turnstile = getIntegrationHealth().find((item) => item.id === "turnstile");

    expect(turnstile).toMatchObject({ ready: true, missing: [] });
  });
});
