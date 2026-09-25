type MediaRecordWriter<T> = {
  createRecord(): Promise<T>;
  deleteImage(url: string): Promise<void>;
  logCleanupFailure(error: unknown): void;
};

/** D1 Media sətri yazılmazsa artıq R2 obyektini ən yaxşı cəhdlə geri silir. */
export async function createMediaRecordWithRollback<T>(
  writer: MediaRecordWriter<T>,
  url: string,
): Promise<T> {
  try {
    return await writer.createRecord();
  } catch (error) {
    await writer.deleteImage(url).catch((cleanupError: unknown) => {
      writer.logCleanupFailure(cleanupError);
    });
    throw error;
  }
}

/**
 * Client-in göndərdiyi idempotentlik açarı (#79).
 *
 * Dropzone hər fayl üçün `crypto.randomUUID()` yaradır və təkrar cəhdlərdə eyni
 * açarı göndərir. Format uyğun deyilsə açar nəzərə alınmır — yükləmə açarsız,
 * əvvəlki kimi işlənir.
 */
export function parseClientUploadId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[A-Za-z0-9-]{8,64}$/.test(trimmed) ? trimmed : null;
}

/** Prisma unikal indeks toqquşması — `queries.ts`-dəki kimi `code` üzrə yoxlanır. */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

/**
 * Sətri yazır; eyni idempotentlik açarlı paralel sorğu artıq yazıbsa, öz R2
 * obyektini geri silib mövcud sətri qaytarır.
 *
 * Adi təkrar cəhd route-da `findExisting()` ilə hələ şəkil emal olunmadan tutulur;
 * bu yol yalnız iki eyni sorğunun eyni anda çatdığı nadir halı örtür.
 */
export async function createMediaRecordOnce<T>(
  writer: MediaRecordWriter<T> & { findExisting(): Promise<T | null> },
  url: string,
): Promise<T> {
  try {
    return await createMediaRecordWithRollback(writer, url);
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await writer.findExisting();
      if (existing) return existing;
    }
    throw error;
  }
}
