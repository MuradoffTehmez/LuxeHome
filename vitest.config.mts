import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * Testlər workerd runtime-ında işləyir — Web Crypto davranışı production ilə eynidir.
 * Node-un `crypto` modulu ilə yoxlamaq yanıltıcı olardı: Workers-də bəzi alqoritmlər
 * fərqli davranır və ya ümumiyyətlə mövcud deyil.
 *
 * Wrangler konfiqurasiyası qəsdən qoşulmayıb: bu testlər saf funksiyaları yoxlayır,
 * D1/R2 binding-lərinə ehtiyac duymur və onları qaldırmaq testləri yalnız yavaşladardı.
 */
export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2026-08-20",
        compatibilityFlags: ["nodejs_compat"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
