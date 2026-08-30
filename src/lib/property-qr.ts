import QRCode from "qrcode-svg";

import { siteUrl } from "@/config/site";

/**
 * Əmlakın canonical URL-ini daşıyan QR kodu (PRD bölmə 61-63).
 *
 * QR **server tərəfdə** çəkilir və heç bir kənar servisə sorğu getmir — eyni yanaşma
 * 2FA qurulumunda da işlədilir (`src/lib/auth/totp.ts`). Kənar QR generatoru
 * işlədilsəydi, elanın ünvanı üçüncü tərəfin loglarına düşərdi və CSP-də əlavə
 * mənbəyə icazə vermək lazım gələrdi.
 *
 * `siteUrl()` runtime-da `SITE_URL`-dən oxuyur, ona görə eyni build həm production,
 * həm staging worker-ində düzgün ünvanı daşıyan QR verir.
 */
export function propertyQrSvg(path: string, size = 240): string {
  return new QRCode({
    content: siteUrl(path),
    padding: 1,
    width: size,
    height: size,
    // Çap materialında (bolme 62) kod qismən zədələnə bilər — «M» səviyyəsi
    // təxminən 15% itkini bərpa edir və ölçünü həddindən artıq böyütmür.
    ecl: "M",
    color: "#14181c",
    background: "#ffffff",
  }).svg();
}
