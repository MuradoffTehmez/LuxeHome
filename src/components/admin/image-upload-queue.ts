/**
 * Şəkil yükləmə növbəsinin saf məntiqi — `ImageDropzone`-dan ayrıdır ki, DOM-suz
 * test olunsun.
 *
 * Niyə növbə: dropzone əvvəl seçilən bütün faylları eyni anda göndərirdi. Hər
 * `/api/*\/media` sorğusu faylı Worker yaddaşında saxlayır və Cloudflare Images-ə
 * üç əməliyyat edir; paralel sorğular eyni izolyatın 128 MB yaddaşını paylaşır.
 * Tək şəkil sığırdı, 6–10 telefon şəkli isə resurs limitini aşırdı və Cloudflare
 * JSON əvəzinə HTML xəta səhifəsi qaytarırdı (#79).
 */

/** Eyni anda gedən yükləmə sayı. 2 — həm sürətli, həm də yaddaş üçün təhlükəsiz. */
export const UPLOAD_CONCURRENCY = 2;

/** Bir fayl üçün ən çox cəhd sayı (ilk cəhd daxil). */
export const UPLOAD_MAX_ATTEMPTS = 3;

/** Təkrar cəhdlər arasındakı gözləmə — keçici limitin sönməsinə vaxt verir. */
export const UPLOAD_RETRY_DELAYS_MS = [1_000, 3_000] as const;

export type UploadFailureKind =
  | "network"
  | "rateLimited"
  | "tooLarge"
  | "server"
  | "rejected";

export type UploadResponse =
  | { ok: true; url: string }
  | { ok: false; kind: UploadFailureKind; message?: string };

/**
 * Serverin cavabını təhlükəsiz oxuyur.
 *
 * Worker resurs limitinə dəyəndə Cloudflare öz HTML səhifəsini qaytarır;
 * `response.json()` birbaşa çağırılsaydı istifadəçi «Unexpected token '<'»
 * görərdi. Burada status koduna görə təsnif olunur, server mesajı isə yalnız
 * JSON-da gəlibsə götürülür.
 */
export async function readUploadResponse(response: Response): Promise<UploadResponse> {
  let payload: { url?: unknown; error?: unknown } | null = null;
  try {
    payload = (await response.json()) as { url?: unknown; error?: unknown };
  } catch {
    payload = null;
  }

  if (response.ok && payload && typeof payload.url === "string" && payload.url) {
    return { ok: true, url: payload.url };
  }

  const message = payload && typeof payload.error === "string" ? payload.error : undefined;
  if (response.status === 429) return { ok: false, kind: "rateLimited", message };
  if (response.status === 413) return { ok: false, kind: "tooLarge", message };
  if (response.status >= 500 || !payload) return { ok: false, kind: "server", message };
  return { ok: false, kind: "rejected", message };
}

/** Keçici xətalar təkrar cəhd olunur; 400/403 kimi qəti imtina olunmur. */
export function isRetryable(kind: UploadFailureKind): boolean {
  return kind === "network" || kind === "rateLimited" || kind === "server";
}

type Sleep = (ms: number) => Promise<void>;

const defaultSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Bir faylı retry siyasəti ilə göndərir.
 *
 * `send` hər cəhddə yeni sorğu qurmalıdır (`FormData` gövdəsi təkrar
 * istifadə oluna bilər, `Response` isə yox).
 */
export async function uploadWithRetry(
  send: () => Promise<Response>,
  { sleep = defaultSleep, maxAttempts = UPLOAD_MAX_ATTEMPTS }: { sleep?: Sleep; maxAttempts?: number } = {},
): Promise<UploadResponse> {
  let last: UploadResponse = { ok: false, kind: "network" };
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      last = await readUploadResponse(await send());
    } catch {
      last = { ok: false, kind: "network" };
    }
    if (last.ok || !isRetryable(last.kind) || attempt === maxAttempts) return last;
    await sleep(UPLOAD_RETRY_DELAYS_MS[Math.min(attempt - 1, UPLOAD_RETRY_DELAYS_MS.length - 1)]);
  }
  return last;
}

/**
 * Paylaşılan paralellik limiti (semafor).
 *
 * Komponent başına bir dəfə yaradılır: istifadəçi yükləmə davam edərkən yeni
 * fayl əlavə etsə də, ümumi paralel sorğu sayı `limit`-i aşmır. Bir tapşırığın
 * xətası növbəni dayandırmır — hər şəkil öz statusunu alır.
 */
export function createUploadLimiter(limit = UPLOAD_CONCURRENCY) {
  let active = 0;
  const waiting: Array<() => void> = [];

  // Slot boşalanda sayğac azaldılmır, birbaşa növbədəkinə ötürülür — əks halda
  // gözləyən oyanana qədər yeni çağırış slotu tutub limiti bir aşa bilərdi.
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= Math.max(1, limit)) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    } else {
      active += 1;
    }
    try {
      return await task();
    } finally {
      release();
    }
  };
}
