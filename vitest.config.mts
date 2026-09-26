import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * Domen testləri workerd runtime-ında işləyir — Web Crypto davranışı production ilə eynidir.
 * React SSR komponent testləri isə Next.js-in Node modulları ilə uyğunluq üçün ayrıca Node
 * layihəsində işləyir. Hər iki layihə eyni `npm test` əmrinə daxildir.
 *
 * Wrangler konfiqurasiyası qəsdən qoşulmayıb: domen testləri saf funksiyaları yoxlayır,
 * D1/R2 binding-lərinə ehtiyac duymur və onları qaldırmaq testləri yalnız yavaşladardı.
 */
export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  /**
   * Testlərdə PostCSS söndürülür.
   *
   * Komponentlərdən biri (`components/map/leaflet-map.tsx`) Leaflet-in öz CSS
   * faylını idxal edir. Vite həmin faylı emal edərkən layihənin
   * `postcss.config.mjs`-ini oxuyur və Tailwind v4 plagini Vitest-in Node
   * mühitində yüklənmir. Testlər CSS-ə baxmır — boş plagin siyahısı ilə fayl
   * sadəcə keçir.
   */
  css: {
    postcss: { plugins: [] },
  },
  // `@/*` alias-ı tsconfig-dədir, Vite onu avtomatik oxumur
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          cloudflareTest({
            miniflare: {
              compatibilityDate: "2026-08-20",
              compatibilityFlags: ["nodejs_compat"],
            },
          }),
        ],
        test: {
          name: "workerd",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/components/**/*.test.{ts,tsx}", "src/**/*.integration.test.ts"],
        },
      },
      {
        extends: true,
        /**
         * Real D1-ə qarşı integration testləri (#85).
         *
         * Saf funksiya testləri Prisma sorğularının D1-dəki davranışını görmür:
         * 100 bound-parametr həddi yalnız workerd D1-də tətbiq olunur və #68 məhz
         * bu boşluqdan keçib production-u bloklamışdı. Burada hər test faylı
         * `migrations/` tətbiq olunmuş təzə miniflare D1 alır və sorğular
         * `@/lib/prisma` üzərindən, production-dakı kimi işləyir.
         */
        plugins: [
          cloudflareTest(async () => ({
            miniflare: {
              compatibilityDate: "2026-08-20",
              compatibilityFlags: ["nodejs_compat"],
              d1Databases: ["DB"],
              bindings: { TEST_MIGRATIONS: await readD1Migrations(fileURLToPath(new URL("./migrations", import.meta.url))) },
            },
          })),
        ],
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
          // Real D1 sorğuları və 700 sətirlik fixture-lar tam dəst paralel işləyəndə
          // (xüsusən CI runner-də) defolt 5 saniyəni aşa bilir.
          testTimeout: 30_000,
          hookTimeout: 30_000,
          setupFiles: ["./src/test/setup-d1.ts"],
        },
      },
      {
        extends: true,
        test: {
          /**
           * Repo fayllarını (miqrasiya, generasiya olunan SQL) oxuyan testlər.
           * workerd sandbox-ında `node:fs` layihə qovluğunu görmür, ona görə
           * onlar ayrıca Node layihəsindədir.
           */
          name: "repo-node",
          environment: "node",
          include: ["prisma/**/*.test.ts", "scripts/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui-node",
          environment: "node",
          include: ["src/components/**/*.test.{ts,tsx}"],
          setupFiles: ["./src/test/setup-ui.ts"],
        },
      },
    ],
  },
});
