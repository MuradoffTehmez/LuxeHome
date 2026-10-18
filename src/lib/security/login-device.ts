/**
 * Girişin cihaz qiymətləndirməsi (#264, PRD 23.1 «Şübhəli giriş xəbərdarlıqları») — saf modul, Prisma-sız.
 *
 * Cihaz brauzer ailəsi + əməliyyat sistemi ilə tanınır (versiya nəzərə alınmır — brauzer yenilənməsi xəbərdarlıq
 * verməsin). Giriş yalnız həm cihaz, həm IP tanınmış qeydlərin heç birinə uyğun gəlmədikdə «yeni» sayılır;
 * ilk giriş (tarixçə yoxdur) xəbərdarlıq vermir. Tarixçə `KnownLoginDevice`-dadır — sessiya sətirləri təmizlənir.
 */

/** «Tanınmış» sayılan dövr. */
export const KNOWN_DEVICE_WINDOW_DAYS = 90;
/** Tanınmış cihaz qeydlərinin saxlanma müddəti — pəncərədən uzundur ki, uzun fasilədən sonrakı giriş «ilk» sayılmasın. */
export const KNOWN_DEVICE_RETENTION_DAYS = 365;

const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/YaBrowser\//, "Yandex"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/CriOS\/|Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

/** «Chrome · Windows» kimi oxunaqlı etiket; tanınmayan agent «Naməlum cihaz» deyil, `null` qaytarır. */
export function deviceLabel(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (!browser && !system) return null;
  return [browser ?? "?", system ?? "?"].join(" · ");
}

export type KnownLoginHistory = {
  /** İstifadəçinin heç olmasa bir tanınmış qeydi varmı (pəncərədən asılı olmayaraq). Yoxdursa — ilk giriş. */
  hasHistory: boolean;
  /** Son `KNOWN_DEVICE_WINDOW_DAYS` gündə görülmüş cihaz etiketləri və IP heşləri. */
  devices: string[];
  ipHashes: string[];
};

/**
 * Bu giriş tanınmayan cihaz və şəbəkədəndirmi. İlk giriş (tarixçə yoxdur) xəbərdarlıq vermir; tarixçə var, amma
 * pəncərədə heç nə yoxdursa (uzun fasilə) giriş yeni sayılır — fasilədən sonrakı yad giriş səssiz keçməməlidir.
 */
export function isNewDeviceLogin(current: { device: string | null; ipHash: string | null }, history: KnownLoginHistory): boolean {
  if (!history.hasHistory) return false;
  const knownIp = current.ipHash !== null && history.ipHashes.includes(current.ipHash);
  const knownDevice = current.device !== null && history.devices.includes(current.device);
  return !knownIp && !knownDevice;
}
