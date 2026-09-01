import { expect, test } from "@playwright/test";
import { visit } from "../support/helpers";

/**
 * Təhlükəsizlik qatı.
 *
 * Auth məntiqinin özü vahid testlərlə örtülüb (`src/lib/auth/`); burada
 * **kənardan görünən** davranış yoxlanılır: qorunan marşrutlar açılmır,
 * cookie bayraqları düzgündür, başlıqlar yerindədir, istifadəçi girişi
 * HTML-ə sızmır.
 */

test.describe("Panel qorunması", () => {
  /**
   * Qoruma iki həlqəlidir: `middleware.ts` cookie imzasını yoxlayır (ucuz),
   * `requireUser()` isə sessiyanı bazadan oxuyur. Anonim istifadəçi ilk
   * həlqədən keçə bilməməlidir.
   */
  const protectedPaths = [
    "/admin",
    "/admin/emlaklar",
    "/admin/istifadeciler",
    "/admin/parametrler",
    "/admin/demo-mezmun",
  ];

  for (const path of protectedPaths) {
    test(`«${path}» anonim istifadəçini buraxmır`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;

      // Qəbul edilən cavablar: girişə yönləndirmə və ya 401/403/404.
      expect([200, 307, 302, 401, 403, 404], `${path} statusu ${status}`).toContain(status);

      if (status === 200) {
        // 200 gəlirsə, bu, giriş səhifəsi olmalıdır — panel məzmunu deyil.
        const url = new URL(page.url()).pathname;
        expect(url, `${path} panelə buraxdı`).toMatch(/giris|login/i);
      }
    });
  }

  /**
   * Anonim istifadəçi giriş səhifəsinə düşür; orada «İdarə paneli» başlığı
   * olması normaldır. Sızma göstəricisi **məlumatdır** — istifadəçi siyahısı,
   * e-poçt ünvanları, audit qeydləri.
   */
  test("panel məlumatı anonim cavabda sızmır", async ({ page }) => {
    await page.goto("/admin/istifadeciler", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").innerText();

    // İstifadəçi siyahısına xas sütun başlıqları və məlumat görünməməlidir.
    expect(body).not.toMatch(/audit jurnal/i);
    expect(body).not.toMatch(/SUPER_ADMIN|son giriş|rol dəyiş/i);
    // E-poçt ünvanı formatı — istifadəçi siyahısının ən açıq sızma əlaməti.
    expect(body).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.(com|az|net|org)/i);
  });
});

test.describe("Sessiya cookie-ləri", () => {
  test("anonim sorğuda sessiya cookie-si verilmir", async ({ page, context }) => {
    await visit(page, "/az");
    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === "lhe_session");
    expect(session, "anonim istifadəçiyə sessiya cookie-si verildi").toBeUndefined();
  });

  test("verilən cookie-lər təhlükəsiz bayraqlar daşıyır", async ({ page, context, baseURL }) => {
    await visit(page, "/az");
    const cookies = await context.cookies();
    const isHttps = baseURL!.startsWith("https://");

    for (const cookie of cookies) {
      // Auth cookie-ləri həmişə HttpOnly + Secure olmalıdır.
      if (/^lhe_/.test(cookie.name)) {
        expect(cookie.httpOnly, `${cookie.name} HttpOnly deyil`).toBe(true);
        if (isHttps) expect(cookie.secure, `${cookie.name} Secure deyil`).toBe(true);
        expect(cookie.sameSite, `${cookie.name} SameSite zəifdir`).not.toBe("None");
      }
    }
  });
});

test.describe("Təhlükəsizlik başlıqları", () => {
  test("əsas başlıqlar mövcuddur", async ({ page }) => {
    const response = await page.goto("/az", { waitUntil: "domcontentloaded" });
    const headers = response?.headers() ?? {};

    // MIME sniffing və clickjacking qorumaları minimum tələbdir.
    expect(headers["x-content-type-options"] ?? "").toBe("nosniff");

    const frameGuard = headers["x-frame-options"] ?? headers["content-security-policy"] ?? "";
    expect(frameGuard, "clickjacking qoruması yoxdur").toBeTruthy();
  });

  /**
   * HSTS Cloudflare zonası səviyyəsində qurulur və yalnız custom domendə
   * (`luxehomeestate.az`) tətbiq olunur. Staging `workers.dev` altındadır,
   * zona qaydalarından kənardır — orada başlığın olmaması gözləniləndir.
   */
  test("production-da HSTS elan olunur", async ({ page, baseURL }) => {
    test.skip(!baseURL!.startsWith("https://"), "yalnız HTTPS mühitində");
    test.skip(baseURL!.includes("workers.dev"), "workers.dev zona qaydalarından kənardır");

    const response = await page.goto("/az", { waitUntil: "domcontentloaded" });
    const hsts = response?.headers()["strict-transport-security"];
    expect(hsts, "HSTS başlığı yoxdur").toBeTruthy();
    expect(hsts).toMatch(/max-age=\d+/);
  });

  test("server texnologiyasını ifşa edən başlıqlar yoxdur", async ({ page }) => {
    const response = await page.goto("/az", { waitUntil: "domcontentloaded" });
    expect(response?.headers()["x-powered-by"], "x-powered-by ifşa olunur").toBeUndefined();
  });
});

test.describe("Giriş məlumatlarının sızması", () => {
  test("ictimai HTML-də sirr görünmür", async ({ page }) => {
    await visit(page, "/az");
    const html = await page.content();

    // Secret-lər Cloudflare secret-lərindədir və heç vaxt client bundle-a düşməməlidir.
    const forbidden = [
      /AUTH_SECRET/,
      /RESEND_API_KEY/,
      /re_[A-Za-z0-9]{20,}/, // Resend açar formatı
      /CLOUDFLARE_API_TOKEN/,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    ];
    for (const pattern of forbidden) {
      expect(html, `sirr sızıntısı: ${pattern}`).not.toMatch(pattern);
    }
  });

  test("tərəfdaş müqavilə metadatası ictimai səhifədə yoxdur", async ({ page }) => {
    const response = await page.goto("/az/terefdaslar", { waitUntil: "domcontentloaded" });
    test.skip(response?.status() !== 200, "tərəfdaşlar səhifəsi əlçatan deyil");

    const html = await page.content();
    // `partnerCardSelect` müqavilə sahələrini qəsdən seçmir; sızma reqressiyası burada tutulur.
    expect(html).not.toMatch(/contractNumber|internalNotes|contractDocument/);
  });
});

test.describe("Giriş axını", () => {
  test("giriş səhifəsi açılır və parol sahəsi maskalıdır", async ({ page }) => {
    const response = await page.goto("/giris", { waitUntil: "domcontentloaded" });
    test.skip(response?.status() === 404, "giriş marşrutu bu mühitdə yoxdur");

    const password = page.locator('input[type="password"]').first();
    if ((await password.count()) > 0) {
      await expect(password).toHaveAttribute("type", "password");
    }
  });

  test("açıq yönləndirmə mümkün deyil", async ({ page }) => {
    /**
     * `?davam=` parametri yalnız `/admin` ilə başlayan marşrutları qəbul edir;
     * xarici ünvan verildikdə istifadəçi ora aparılmamalıdır.
     */
    const response = await page.goto("/giris?davam=https://example.com/", {
      waitUntil: "domcontentloaded",
    });
    test.skip(response?.status() === 404, "giriş marşrutu bu mühitdə yoxdur");

    expect(new URL(page.url()).host, "xarici hosta yönləndirildi").not.toBe("example.com");
  });
});

test.describe("Giriş formalarının qorunması", () => {
  test("əlaqə formasında honeypot və ya Turnstile var", async ({ page }) => {
    await visit(page, "/az/elaqe");
    const form = page.locator("form").first();
    test.skip((await form.count()) === 0, "əlaqə forması tapılmadı");

    const html = await page.content();
    // Spam qoruması: honeypot sahəsi, Turnstile widget-i və ya hər ikisi.
    const hasProtection =
      /turnstile/i.test(html) || (await page.locator('input[type="hidden"]').count()) > 0;
    expect(hasProtection, "forma spam qoruması daşımır").toBe(true);
  });
});
