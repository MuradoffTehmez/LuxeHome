import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Web App Manifest (#103). Sayt telefonda «Ana ekrana əlavə et» ilə tətbiq kimi
 * quraşdırılır; iOS-da web push yalnız quraşdırılmış PWA-da işlədiyi üçün mövcud
 * `push-sw.js` axınının iPhone-da işləməsi də bundan asılıdır.
 *
 * `start_url` locale prefiksi daşımır — middleware istifadəçinin dil cookie-sinə görə
 * yönləndirir. Rənglər `globals.css`-dəki açıq tema tokenləri ilə eynidir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: "Luxe Home",
    description: siteConfig.description,
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f3ec",
    theme_color: "#17202b",
    lang: "az",
    categories: ["business", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Əmlaklar", url: "/az/emlaklar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Favoritlər", url: "/az/favoritler", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Əlaqə", url: "/az/elaqe", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
