import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Layihə qovluğu iş sahəsinin kökü kimi qeyd olunur —
  // yuxarı qovluqdakı lockfile-ın səhvən seçilməsinin qarşısını alır.
  outputFileTracingRoot: import.meta.dirname,

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

export default nextConfig;
