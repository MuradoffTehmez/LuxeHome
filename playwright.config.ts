import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E konfiqurasiyası.
 *
 * **Hədəf mühit `E2E_BASE_URL` ilə seçilir** və defolt staging-dir. Səbəb:
 * `next dev` bu layihədə etibarlı E2E hədəfi deyil — Prisma-nın wasm engine-i
 * dev serverində yüklənmir və D1-dən oxuyan hər səhifə 500 qaytarır. Production
 * ilə eyni davranışı yalnız workerd verir, ona görə lokal işlətmə üçün də
 * `npm run preview` (OpenNext bundle) tövsiyə olunur:
 *
 *   npm run preview                                  # ayrıca terminalda
 *   E2E_BASE_URL=http://localhost:8787 npm run e2e
 *
 * CI-də testlər staging yayımından **sonra** canlı staging worker-inə qarşı
 * işləyir və uğursuz olarsa production deploy-u dayandırır.
 *
 * Testlər məzmun sayından asılı yazılıb: staging-də nümunə məzmun açıqdır
 * (300+ elan), production-da isə yalnız real qeydlər var. Çoxlu məzmun tələb
 * edən hallar (səhifələmə kimi) `test.skip()` ilə şərtlidir.
 */

const baseURL = (
  process.env.E2E_BASE_URL || "https://luxehomeestate-staging.amiyevbahadur.workers.dev"
).replace(/\/$/, "");

const isCI = Boolean(process.env.CI);

/**
 * Cloudflare bot qoruması standart avtomatlaşdırma User-Agent-lərinə 403 verir.
 * Real Chrome sətri göndərilir — test brauzeri onsuz da Chromium-dur, ona görə
 * bu, davranışı saxtalaşdırmır, yalnız bot filtrindən keçirir.
 */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  // Workers cold start + D1 sorğusu bəzən yavaş olur; lokal preview isə sürətlidir.
  timeout: 60_000,
  expect: { timeout: 15_000 },

  fullyParallel: true,
  // Uzaq mühitə qarşı işləyəndə paralellik məhdudlaşır: 300 elanlıq kataloq
  // sorğusu D1-ə düşür və eyni anda onlarla sorğu rate limitə dəyə bilər.
  workers: isCI ? 4 : 6,

  // Şəbəkə səbəbli tək-tük uğursuzluq real reqressiya deyil; lokalda təkrar yoxdur
  // ki, sınıq test dərhal görünsün.
  retries: isCI ? 2 : 0,

  forbidOnly: isCI,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    userAgent: USER_AGENT,

    /**
     * Eyni User-Agent başlıq kimi də verilir.
     *
     * `use.userAgent` yalnız `page` kontekstinə tətbiq olunur; `request`
     * fixture-u (APIRequestContext) onu görmür və standart Playwright UA ilə
     * gedir. Production-da Cloudflare bot qoruması belə sorğulara 403 verir —
     * nəticədə API və sitemap testləri saytda problem olmadığı halda sınırdı.
     */
    extraHTTPHeaders: { "user-agent": USER_AGENT },

    /**
     * Reveal animasiyası söndürülür.
     *
     * `[data-reveal]` elementləri scroll zamanı `opacity: 0 → 1` keçidi edir.
     * Keçidin ortasında tutulan element yarı-şəffaf olur və axe onu fonla
     * qarışmış rəngdə ölçür — nəticədə mövcud olmayan kontrast pozuntuları
     * hesabata düşür (məsələn `#aa8754` qızıl fon `#bca077` kimi görünür).
     * `globals.css`-dəki `prefers-reduced-motion: reduce` bloku həmin
     * elementləri dərhal `opacity: 1` edir, ona görə emulyasiya problemi
     * kökündən həll edir və eyni zamanda testləri sürətləndirir.
     *
     * Parametr `contextOptions` altındadır: `reducedMotion` brauzer kontekstinin
     * seçimidir, `use` səviyyəsində birbaşa qəbul edilmir.
     */
    contextOptions: { reducedMotion: "reduce" },
    // İlk uğursuzluqdan sonrakı təkrarda iz saxlanılır — CI-də debug üçün kifayətdir.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: isCI ? "on-first-retry" : "off",
    navigationTimeout: 45_000,
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], userAgent: USER_AGENT },
      // Mobil spec dar ekrana xas davranışı yoxlayır (çekmece, bottom-sheet,
      // toxunma hədəfi) — desktop viewport-da mənasızdır və yalançı uğursuzluq verir.
      testIgnore: ["**/mobile.spec.ts"],
    },
    {
      // Mobil axın ayrıca layihədir: bottom-sheet filtrlər, çekmece naviqasiyası
      // və sticky CTA-lar yalnız dar ekranda görünür.
      name: "mobile",
      use: { ...devices["Pixel 7"], userAgent: USER_AGENT },
      testMatch: ["**/mobile.spec.ts", "**/smoke.spec.ts"],
    },
  ],
});
