import { SAVED_SEARCH_FREQUENCIES } from "@/lib/constants";

/**
 * «Gündəlik» və «Həftəlik» saxlanmış axtarış digest-i.
 *
 * Niyə ayrı mühərrik: `runSavedSearchMatching` elan dərc olunan **anda** işləyir
 * və yalnız `IMMEDIATE` tezliyi üçün məktub göndərir. `DAILY`/`WEEKLY` seçən
 * istifadəçiyə heç nə getmirdi — sütunlar (`lastNotifiedAt`, `lastCheckedAt`)
 * sxemdə var idi, amma heç yerdən yazılmırdı.
 *
 * İş prinsipi:
 *
 * 1. Uyğunluq dərc anında `SavedSearchMatch` sətri kimi qeyd olunur
 *    (`notifiedAt: null` = istifadəçi hələ xəbərdar deyil).
 * 2. Digest işi vaxtı çatmış axtarışları götürür, həmin sətirləri yığır və
 *    **tək məktubda** göndərir.
 * 3. Göndərişdən sonra sətirlər `notifiedAt` ilə möhürlənir.
 *
 * `notifiedAt` həm də kabinetdəki «yeni nəticə» nişanını sıfırlayır — istifadəçi
 * elanları paneldə artıq görübsə, təkrar məktub göndərmək mənasızdır. İki oxunuş
 * («gördü» və «xəbər verildi») qəsdən eyni sütunda birləşdirilib.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Bir məktubda göstərilən maksimum elan — qalanı kabinetdə görünür. */
export const DIGEST_ITEM_LIMIT = 10;

export type DigestSavedSearch = {
  id: string;
  userId: string;
  name: string;
  frequency: string;
  lastNotifiedAt: Date | null;
  user: {
    email: string;
    locale: string;
    /** PRD bölmə 57 — «Saved Search · Email» açarı. Sətir yoxdursa defolt `true`. */
    notificationPreference?: { savedSearchEmail: boolean } | null;
  };
};

export type DigestProperty = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  imageUrl: string | null;
};

export type DigestStore = {
  /** `enabled = true` və tezliyi DAILY/WEEKLY olan bütün axtarışlar. */
  findDigestSavedSearches(): Promise<DigestSavedSearch[]>;
  /** Bu axtarış üçün hələ bildirilməmiş uyğunluqlar. */
  findPendingMatches(savedSearchId: string, limit: number): Promise<DigestProperty[]>;
  /** Bildirilməmiş uyğunluqların ümumi sayı — məktubda «daha N elan» üçün. */
  countPendingMatches(savedSearchId: string): Promise<number>;
  sendDigestEmail(input: {
    email: string;
    locale: string;
    searchName: string;
    frequency: "DAILY" | "WEEKLY";
    properties: DigestProperty[];
    totalCount: number;
  }): Promise<void>;
  /** Göndərilmiş uyğunluqları möhürləyir və axtarışın vaxt damgalarını yeniləyir. */
  markNotified(savedSearchId: string, propertyIds: string[], at: Date): Promise<void>;
  /** Yeni nəticə yoxdursa yalnız «yoxlandı» damgası yenilənir. */
  markChecked(savedSearchId: string, at: Date): Promise<void>;
};

/** Tezliyə görə növbəti göndərişin vaxtı çatıbmı. */
export function isDigestDue(
  frequency: string,
  lastNotifiedAt: Date | null,
  now: Date,
): boolean {
  if (
    frequency !== SAVED_SEARCH_FREQUENCIES.DAILY &&
    frequency !== SAVED_SEARCH_FREQUENCIES.WEEKLY
  ) {
    return false;
  }

  // Heç vaxt göndərilməyibsə ilk uyğunluq dərhal digest-ə düşür
  if (!lastNotifiedAt) return true;

  const interval = frequency === SAVED_SEARCH_FREQUENCIES.DAILY ? DAY_MS : WEEK_MS;
  return now.getTime() - lastNotifiedAt.getTime() >= interval;
}

export type DigestResult = {
  /** Yoxlanmış axtarış sayı. */
  checked: number;
  /** Məktub göndərilən axtarış sayı. */
  sent: number;
  /** İstisna ilə keçilən axtarış sayı. */
  failed: number;
  /** E-poçt kanalı söndürüldüyü üçün göndərilməyən axtarış sayı. */
  skipped: number;
};

/**
 * Bütün vaxtı çatmış digest-ləri göndərir.
 *
 * Hər axtarış öz təcridində işlənir: bir nasaz qeyd bütün növbəni dayandırmamalıdır
 * (eyni səbəb `runSavedSearchMatching`-də də tətbiq olunub).
 */
export async function runSavedSearchDigest(
  store: DigestStore,
  now: Date = new Date(),
): Promise<DigestResult> {
  const searches = await store.findDigestSavedSearches();
  const result: DigestResult = { checked: 0, sent: 0, failed: 0, skipped: 0 };

  for (const search of searches) {
    if (!isDigestDue(search.frequency, search.lastNotifiedAt, now)) continue;

    result.checked += 1;

    try {
      const properties = await store.findPendingMatches(search.id, DIGEST_ITEM_LIMIT);

      if (properties.length === 0) {
        // Yeni nəticə yoxdur: `lastNotifiedAt` toxunulmur ki, növbəti nəticə
        // gələn kimi göndəriş vaxtı yenidən hesablanmasın
        await store.markChecked(search.id, now);
        continue;
      }

      // E-poçt kanalı söndürülübsə məktub getmir, amma uyğunluqlar
      // `notifiedAt: null` qalır — istifadəçi onları kabinetdə «yeni» kimi görməlidir.
      if (search.user.notificationPreference?.savedSearchEmail === false) {
        await store.markChecked(search.id, now);
        result.skipped += 1;
        continue;
      }

      const totalCount = await store.countPendingMatches(search.id);

      await store.sendDigestEmail({
        email: search.user.email,
        locale: search.user.locale,
        searchName: search.name,
        // `isDigestDue` yuxarıda yalnız bu iki dəyəri buraxır
        frequency: search.frequency as "DAILY" | "WEEKLY",
        properties,
        totalCount,
      });

      await store.markNotified(
        search.id,
        properties.map((property) => property.id),
        now,
      );
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      console.error(`[saved-search-digest] «${search.id}» göndərilmədi:`, error);
    }
  }

  return result;
}
