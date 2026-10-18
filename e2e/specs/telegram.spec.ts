import { expect, test } from "@playwright/test";
import { visit } from "../support/helpers";
import { authFixturesEnabled, signInAsLister } from "../support/auth";

/**
 * Telegram inteqrasiyası və sosial giriş — kənardan görünən davranış. Mühitdə açarlar olmaya da bilər (lokal stack,
 * staging), ona görə testlər **ardıcıllığı** yoxlayır: düymə görünürsə marşrut işləyir, görünmürsə marşrut 404 verir;
 * webhook secret-siz heç vaxt 200 qaytarmır. Telegram API-yə heç bir real sorğu getmir.
 */

const PROVIDERS = [
  { name: "telegram", testId: "telegram-sign-in" },
  { name: "apple", testId: "apple-sign-in" },
  { name: "facebook", testId: "facebook-sign-in" },
] as const;

test.describe("Sosial giriş düymələri", () => {
  for (const provider of PROVIDERS) {
    test(`${provider.name}: düymə ilə marşrut uyğundur`, async ({ page, request }) => {
      await visit(page, "/az/daxil-ol");
      const button = page.getByTestId(provider.testId);
      const visible = await button.isVisible();
      const response = await request.get(`/api/auth/${provider.name}/start?l=az`, { maxRedirects: 0 });
      if (visible) {
        await expect(button).toHaveAttribute("href", new RegExp(`^/api/auth/${provider.name}/start\\?`));
        expect([303, 302]).toContain(response.status());
      } else {
        expect(response.status(), "konfiqurasiya yoxdursa marşrut gizlidir").toBe(404);
      }
    });
  }

  test("`davam` parametri kənar ünvana yönləndirmir", async ({ page }) => {
    await visit(page, "/az/daxil-ol?davam=//evil.example");
    for (const provider of PROVIDERS) {
      const button = page.getByTestId(provider.testId);
      if (await button.isVisible()) expect(await button.getAttribute("href")).not.toContain("evil.example");
    }
  });

  test("Telegram qeydiyyat səhifəsi kimliksiz açılanda müddət bitmiş vəziyyəti göstərir", async ({ page }) => {
    await visit(page, "/az/qeydiyyat/telegram");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
  });

  test("etibarsız təsdiq linki hesab yaratmır", async ({ page }) => {
    await visit(page, `/az/hesab/telegram-tesdiqi?token=${"x".repeat(43)}`);
    await expect(page.locator('button[type="submit"]')).toHaveCount(0);
    await visit(page, `/az/hesab/sosial-tesdiq?token=${"x".repeat(43)}`);
    await expect(page.locator('button[type="submit"]')).toHaveCount(0);
  });
});

test.describe("Telegram webhook", () => {
  test("secret başlığı olmadan update qəbul olunmur", async ({ request }) => {
    const response = await request.post("/api/telegram/webhook", { data: { update_id: 1, message: { message_id: 1, chat: { id: 1, type: "private" }, text: "/start" } } });
    expect([401, 404]).toContain(response.status());
  });

  test("səhv secret ilə update qəbul olunmur", async ({ request }) => {
    const response = await request.post("/api/telegram/webhook", {
      headers: { "x-telegram-bot-api-secret-token": "wrong_secret_wrong_secret" },
      data: { update_id: 2 },
    });
    expect([401, 404]).toContain(response.status());
  });
});

test.describe("Kabinet: Telegram bölməsi", () => {
  test.skip(!authFixturesEnabled, "auth fixture-ları yoxdur");

  test("bölmə görünür, mobil ekranda üfüqi daşma yoxdur", async ({ page, context, baseURL }) => {
    await signInAsLister(context, baseURL!);
    await page.setViewportSize({ width: 375, height: 812 });
    await visit(page, "/az/kabinet/bildirisler");
    const card = page.locator('section[aria-labelledby="telegram-card-title"]');
    await expect(card).toBeVisible();
    await expect(card.locator("h2")).toHaveText("Telegram");
    // Bildiriş mərkəzində Telegram sütunu aktivdir (artıq «tezliklə» deyil).
    await expect(page.locator('input[name="LEADS.telegram"]')).toBeEnabled();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
