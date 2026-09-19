import { mergeFavoriteIds, sanitizeFavoriteIds } from "@/lib/favorite-sync";

type Fetcher = typeof fetch;

/**
 * Favorit kartlarının hamısının paylaşdığı hesab sinxronu.
 *
 * Bir səhifədə çoxlu `FavoriteButton` ola bilər. Oxuma promise-i paylaşılır ki,
 * onların hamısı eyni anda ayrıca API sorğusu göndərməsin. Girişsiz istifadəçi
 * müəyyən ediləndən sonra PUT da göndərilmir; onun seçimi yalnız localStorage-dədir.
 */
export function createFavoriteAccountSync(fetcher: Fetcher = fetch) {
  let signedIn: boolean | null = null;
  let readPromise: Promise<string[] | null> | null = null;

  async function persist(ids: string[]): Promise<void> {
    if (signedIn !== true) return;

    const response = await fetcher("/api/hesab/favoritler", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error("Favoritlər saxlanılmadı");
  }

  async function read(local: string[]): Promise<string[] | null> {
    if (readPromise) return readPromise;

    const pendingRead = (async () => {
      try {
        const response = await fetcher("/api/hesab/favoritler", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Favorit sinxronu alınmadı");

        const payload = await response.json() as { ids?: unknown; signedIn?: unknown };
        signedIn = payload.signedIn === true;
        if (!signedIn) return null;

        const merged = mergeFavoriteIds(local, sanitizeFavoriteIds(payload.ids));
        await persist(merged);
        return merged;
      } catch {
        // Müvəqqəti şəbəkə xətası növbəti mount-da yenidən yoxlanıla bilsin.
        signedIn = null;
        return null;
      }
    })();

    readPromise = pendingRead;
    try {
      return await pendingRead;
    } finally {
      // Promise yalnız eyni anda mount olunan kartları birləşdirir. Nəticəni modul
      // ömrü boyu saxlamaq hesab dəyişəndə əvvəlki istifadəçinin favoritlərini
      // yeni hesaba yaza bilərdi; növbəti mount cari sessiyanı yenidən oxumalıdır.
      if (readPromise === pendingRead) readPromise = null;
    }
  }

  return { read, persist };
}

