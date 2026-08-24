import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Layihə qovluğu iş sahəsinin kökü kimi qeyd olunur —
  // yuxarı qovluqdakı lockfile-ın səhvən seçilməsinin qarşısını alır.
  outputFileTracingRoot: import.meta.dirname,

  experimental: {
    // `forbidden()` və `unauthorized()` naviqasiya kəsiciləri bu bayraq olmadan işləmir.
    // İcazəsi olmayan istifadəçiyə 403 göstərmək üçün `src/lib/auth/guard.ts` onlardan asılıdır.
    authInterrupts: true,

    serverActions: {
      /**
       * Server Action-ların mənbə yoxlaması.
       *
       * Next `Origin` başlığını proxy-dən gələn host ilə tutuşdurur. Cloudflare
       * Workers-də sorğu bir neçə qatdan keçir və host başlığı həmişə üst-üstə
       * düşmür — nəticədə etibarlı forma göndərişi 403 ilə rədd edilir və
       * istifadəçi «Gözlənilməz xəta» səhifəsini görür.
       *
       * Siyahı **yalnız bizim domenlərdən** ibarətdir; kənar sayt əlavə edilməməlidir,
       * əks halda CSRF müdafiəsi zəifləyər.
       */
      allowedOrigins: [
        "luxehomeestate.az",
        "www.luxehomeestate.az",
        "luxehomeestate-staging.amiyevbahadur.workers.dev",
        "localhost:3000",
        "127.0.0.1:8787",
      ],
    },
  },

  images: {
    // Müasir formatlar — WebP/AVIF avtomatik seçilir
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1600, 1920, 2048],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        // Demo mərhələsində istifadə olunan lisenziyalı Unsplash şəkilləri.
        // TODO: Şirkətin öz foto arxivi hazır olduqda bu qayda silinə bilər.
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // R2 media bucket-in public custom domain-i
        protocol: "https",
        hostname: "media.luxehomeestate.az",
      },
    ],
  },

  // Cavab başlıqları — təhlükəsizlik
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        // Yüklənmiş media uzunmüddətli keşlənir (fayl adları unikaldır)
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  poweredByHeader: false,
};

export default withNextIntl(nextConfig);

// `next dev` zamanı Cloudflare binding-lərini (D1, R2) lokal miniflare üzərindən açır,
// beləliklə development production ilə eyni kod yolunu işlədir.
initOpenNextCloudflareForDev();
