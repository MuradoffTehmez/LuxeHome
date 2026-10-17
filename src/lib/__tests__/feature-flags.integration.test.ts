import { env } from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";
import { getFeatureFlags, isFeatureEnabled } from "@/lib/feature-flags";
import { SETTING_KEYS } from "@/lib/settings";
import { refreshListingRisk } from "@/lib/moderation/listing-risk";
import { sendEmail } from "@/lib/email";

/** Funksiya bayraqları real D1-də (#242): parametrdən oxunma və avtomatik moderasiyanın söndürülməsi. */
const DB = (env as unknown as { DB: D1Database }).DB;

async function saveFlags(value: string) {
  await DB.prepare('INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value"')
    .bind(SETTING_KEYS.FEATURE_FLAGS, value).run();
}

afterEach(async () => {
  await DB.prepare('DELETE FROM "Setting" WHERE "key" = ?').bind(SETTING_KEYS.FEATURE_FLAGS).run();
});

describe("funksiya bayraqları", () => {
  it("parametr yoxdursa defolt, varsa saxlanmış dəyər və asılılıq qaydası işləyir", async () => {
    expect(await isFeatureEnabled("CRM")).toBe(true);
    expect(await isFeatureEnabled("PAYMENTS")).toBe(false);

    await saveFlags(JSON.stringify({ CRM: false, PAYMENT_CHECKOUT_ENABLED: true }));
    const flags = await getFeatureFlags();
    expect(flags.CRM).toBe(false);
    // Ödəniş modulu və monetizasiya bağlıdır — checkout effektiv olaraq söndürülü qalır.
    expect(flags.PAYMENT_CHECKOUT_ENABLED).toBe(false);
  });

  it("avtomatik moderasiya söndürüləndə nəticəsi bilinməyən yoxlama elanı saxlamır", async () => {
    // Mövcud olmayan elan: yazma alınmır və risk «bilinmir» (`hold`) qayıdır.
    expect((await refreshListingRisk("ff-missing")).level).toBe("hold");
    await saveFlags(JSON.stringify({ AUTO_MODERATION: false }));
    expect((await refreshListingRisk("ff-missing")).level).toBe("review");
  });

  it("e-poçt bildirişləri söndürüləndə bildiriş məktubu buraxılır, tranzaksion məktub yox", async () => {
    await saveFlags(JSON.stringify({ NOTIFICATIONS: false }));
    await expect(sendEmail({ to: "a@example.test", subject: "x", html: "x", notification: true })).resolves.toMatchObject({ success: true, skipped: true });
    // Tranzaksion məktub bayraqdan asılı deyil (testdə Resend açarı yoxdur — göndərmə cəhdi olur).
    await expect(sendEmail({ to: "a@example.test", subject: "x", html: "x" })).resolves.not.toHaveProperty("skipped");
  });
});
