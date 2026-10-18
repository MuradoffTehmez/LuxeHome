/**
 * Girişin cihaz qiymətləndirməsi (#264, PRD 23.1 «Şübhəli giriş xəbərdarlıqları») — saf modul, Prisma-sız.
 *
 * Cihaz brauzer ailəsi + əməliyyat sistemi ilə tanınır (versiya nəzərə alınmır — brauzer yenilənməsi xəbərdarlıq
 * verməsin). Giriş yalnız həm cihaz, həm IP əvvəlki sessiyaların heç birinə uyğun gəlmədikdə «yeni» sayılır;
 * ilk giriş (əvvəlki sessiya yoxdur) xəbərdarlıq vermir.
 */

/** Əvvəlki sessiyalara baxılan dövr. */
export const KNOWN_DEVICE_WINDOW_DAYS = 90;

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

export type SessionFingerprint = { ip: string | null; userAgent: string | null };

/** Bu giriş əvvəlki sessiyalara görə yeni cihaz/şəbəkədəndirmi. */
export function isNewDeviceLogin(current: SessionFingerprint, previous: SessionFingerprint[]): boolean {
  if (previous.length === 0) return false;
  const device = deviceLabel(current.userAgent);
  const knownIp = current.ip !== null && current.ip !== "unknown" && previous.some((row) => row.ip === current.ip);
  const knownDevice = device !== null && previous.some((row) => deviceLabel(row.userAgent) === device);
  return !knownIp && !knownDevice;
}
