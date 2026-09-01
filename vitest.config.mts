import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
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
          exclude: ["src/components/**/*.test.{ts,tsx}"],
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
