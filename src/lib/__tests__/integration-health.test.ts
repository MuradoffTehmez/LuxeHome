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

  it("e-poçt ünvanlarının tətbiq fallback-larını hazır hesab edir", () => {
    process.env.RESEND_API_KEY = "resend-key";
    const email = getIntegrationHealth().find((item) => item.id === "email");

    expect(email).toMatchObject({ ready: true, missing: [] });
  });

  it("webhook üçün Resend API açarını da tələb edir", () => {
    process.env.RESEND_WEBHOOK_SECRET = "webhook-secret";
    const webhook = getIntegrationHealth().find((item) => item.id === "emailWebhook");

    expect(webhook).toMatchObject({
      ready: false,
      optional: true,
      missing: ["RESEND_API_KEY"],
    });
  });

  it("push açıq açarını build-time literal, gizli dəyərləri runtime kimi oxuyur", () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public-key";
    process.env.VAPID_PRIVATE_KEY = "private-key";
    process.env.VAPID_SUBJECT = "mailto:info@luxehomeestate.az";

    const push = getIntegrationHealth().find((item) => item.id === "push");

    expect(push).toMatchObject({ ready: true, optional: true, missing: [] });
  });

  it("push açıq açarı build-də yoxdursa runtime secret-ləri hazır olsa da çatışmır", () => {
    process.env.VAPID_PRIVATE_KEY = "private-key";
    process.env.VAPID_SUBJECT = "mailto:info@luxehomeestate.az";

    const push = getIntegrationHealth().find((item) => item.id === "push");

    expect(push).toMatchObject({
      ready: false,
      optional: true,
      missing: ["NEXT_PUBLIC_VAPID_PUBLIC_KEY"],
    });
  });
});
