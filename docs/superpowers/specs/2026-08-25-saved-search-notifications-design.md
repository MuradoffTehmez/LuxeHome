# Saved Search + Recently Viewed + Notification Center

Tarix: 2026-08-25
Status: təsdiq gözlənilir
Əhatə: İctimai istifadəçi kabinetinə üç yeni bölmə — saxlanmış axtarışlar (+ uyğunluq bildirişi),
son baxılan əmlaklar, bildiriş mərkəzi. Hər iki PRD-nin (bax `MEMORY.md` bölmə 10) tam
tamamlanması yol xəritəsində 1-ci alt-layihə.

---

## 1. Kontekst

`(account)/kabinet` altında USER/OWNER/AGENCY hesabları üçün ümumi baxış, elanlar, komanda,
profil səhifələri artıq var (`requireAccount()` ilə qorunur, bax `src/lib/auth/guard.ts`).
Favoritlər (`Favorite` modeli DB-də mövcuddur, amma hazırda **istifadə olunmur** — ictimai
favoritlər `src/lib/favorites.ts` vasitəsilə yalnız localStorage-də saxlanılır) və müqayisə
(`src/lib/compare.ts`) eyni presedenti göstərir: sadə, hesabsız, brauzer-əsaslı saxlama.

Bu üç yeni funksiya fərqli xarakter daşıyır — Saved Search matching və Notification Center
server tərəfində, cihazlar arası davam edən vəziyyət tələb edir (PRD qəbul kriteriyaları: yeni
uyğun elan avtomatik aşkarlanmalı, email/web bildirişi getməlidir). Ona görə DB-əsaslı olmalıdır.
Recently Viewed isə sırf brauzinq tarixçəsidir — Favorites/Compare presedentinə uyğun DB-siz
qala bilər.

D1 tranzaksiya dəstəkləmir, cron infrastrukturu hələ qurulmayıb (bax `MEMORY.md` bölmə 10,
maddə 8 — ən sona planlaşdırılıb). Bu iki məhdudiyyət dizaynı birbaşa formalaşdırır.

## 2. Məqsədlər

- İstifadəçi cari axtarış filtrlərini adla saxlaya bilsin, tezliyi seçsin, redaktə/pause/silə bilsin.
- Yeni əmlak PUBLISHED olanda aktiv saxlanmış axtarışlarla avtomatik müqayisə olunsun, uyğun
  gələnlər üçün **bir dəfə** bildiriş yaransın (təkrar göndərilməsin).
- İstifadəçi kabinetdə mərkəzi bildiriş siyahısı görsün: oxu/oxunmamış, hamısını oxu, sil.
- Baxılan əmlaklar brauzerdə yadda saxlanılsın və kabinetdə siyahı kimi görünsün.
- Bildiriş cədvəli gələcək bildiriş növləri üçün (Qiymət düşməsi, Görüş xatırlatması — sonrakı
  alt-layihələr) sxem dəyişikliyi olmadan genişlənə bilsin.

## 3. Əhatə dairəsindən kənar

- **Web Push** (brauzer push bildirişi) — service worker + VAPID açarları tələb edir, ayrıca
  infrastruktur işidir. Bu fazada seçim UI-da görünür, amma "tezliklə" işarəli və qeyri-aktivdir.
- **Gündəlik/həftəlik email digest-in real göndərilməsi** — planlaşdırılmış icra (cron) tələb
  edir. Bu fazada yalnız **"dərhal"** tezliyi real email göndərir (mövcud Resend inteqrasiyası
  ilə). Digər tezliklər seçilə bilər və saxlanılır, amma faktiki toplu göndərmə `MEMORY.md`
  bölmə 10 maddə 8-də (cron infrastrukturu) aktivləşəcək — bu, bilinən məhdudiyyət kimi qeyd
  olunur, gizli qalmır.
- Qiymət düşməsi bildirişi, Görüş xatırlatması — ayrı alt-layihələr, `Notification` modeli
  onlar üçün hazır olacaq, amma trigger məntiqi bu fazada yazılmır.
- AI axtarış inteqrasiyası (natural language query saxlama) — sonrakı alt-layihə.

---

## 4. Data modeli

```prisma
/// İstifadəçinin saxladığı filtr kombinasiyası. `filters` PropertyFilters JSON-udur
/// (queries.ts ilə eyni forma — axtarış səhifəsindəki filtrlərlə birbaşa uyğunlaşır).
model SavedSearch {
  id          String    @id @default(cuid())
  userId      String
  name        String
  filters     String    // JSON — PropertyFilters (sort/page/pageSize xaric)
  /// IMMEDIATE | DAILY | WEEKLY | OFF
  frequency   String    @default("DAILY")
  enabled     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  lastCheckedAt   DateTime?
  lastNotifiedAt  DateTime?

  user    User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  matches SavedSearchMatch[]

  @@index([userId])
  @@index([enabled])
}

/// Təkrar bildirişin qarşısını alır — eyni əmlak eyni saxlanmış axtarışa bir dəfə əlavə olunur.
model SavedSearchMatch {
  id            String   @id @default(cuid())
  savedSearchId String
  propertyId    String
  notifiedAt    DateTime?
  createdAt     DateTime @default(now())

  savedSearch SavedSearch @relation(fields: [savedSearchId], references: [id], onDelete: Cascade)
  property    Property    @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([savedSearchId, propertyId])
  @@index([propertyId])
}

/// Ümumi bildiriş qeydi — Saved Search matching ilə başlayır, gələcək bildiriş
/// növləri (Price Drop, Meeting Reminder) eyni cədvəldən istifadə edəcək.
model Notification {
  id        String    @id @default(cuid())
  userId    String
  /// SAVED_SEARCH_MATCH | PRICE_DROP | MEETING_REMINDER (gələcək)
  type      String
  title     String
  content   String
  actionUrl String?
  readAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@index([createdAt])
}
```

`User` modelinə əlavə relation-lar: `savedSearches SavedSearch[]`, `notifications Notification[]`.
`Property` modelinə: `savedSearchMatches SavedSearchMatch[]`.

`src/lib/constants.ts`-ə əlavə (mövcud `LEAD_STATUSES` konvensiyası ilə):

```ts
export const SAVED_SEARCH_FREQUENCIES = {
  IMMEDIATE: "IMMEDIATE",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  OFF: "OFF",
} as const;
// + tip, LABELS

export const NOTIFICATION_TYPES = {
  SAVED_SEARCH_MATCH: "SAVED_SEARCH_MATCH",
} as const;
// gələcək alt-layihələr PRICE_DROP, MEETING_REMINDER əlavə edəcək
```

Miqrasiya: `npm run db:migrate:new -- --output migrations/000X_saved_search_notifications.sql`.

## 5. Uyğunluq mexanizmi (matching)

`queries.ts`-ə yeni funksiya:

```ts
export async function notifyMatchingSavedSearches(propertyId: string): Promise<void>
```

Məntiq:

1. Bütün `enabled: true` `SavedSearch` sətirlərini oxu (indiki miqyasda — bir neçə yüz
   istifadəçi — hamısını yaddaşda süzmək kifayətdir; N böyüdükdə SQL-səviyyəli süzgəcə keçid
   ayrıca iş olacaq).
2. Hər saved search üçün onun `filters`-ini `buildPropertyWhere()`-ə ötür, nəticəyə bu
   `propertyId`-nin daxil olub-olmadığını yoxla (`prisma.property.findFirst({ where: { ...buildPropertyWhere(filters), id: propertyId } })`).
3. Uyğun gələrsə: `SavedSearchMatch` yarat (unique constraint təkrarın qarşısını alır —
   `P2002` xətası sükutla udulur, bu artıq bildirilmiş deməkdir).
4. Yeni match üçün `Notification` yarat (`type: SAVED_SEARCH_MATCH`, `actionUrl: /emlaklar/{slug}`).
5. `frequency === "IMMEDIATE"` olan saved search-lər üçün **indi** email göndər
   (`sendSavedSearchMatchEmail`, `src/lib/email.ts`-ə yeni funksiya, mövcud şablon stilində).
   Digər tezliklər üçün email göndərilmir — in-app bildiriş kifayətdir, batch email gələcək
   cron fazasında əlavə olunacaq.

D1 tranzaksiya dəstəkləmədiyi üçün bu addımlar ardıcıl, ayrı-ayrı sorğulardır (mövcud
`emlaklar/actions.ts` şərhindəki eyni prinsip: yarımçıq qalsa məlumat itmir, sadəcə natamam
bildiriş nəticəsi olur).

**Çağırış nöqtələri** — əmlak status `PUBLISHED`-ə keçən **hər yer**:

- `src/app/admin/emlaklar/actions.ts` — `createProperty` (birbaşa PUBLISHED yaradılarsa),
  `updateProperty`, status-dəyişmə action-ı.
- `src/app/admin/moderation/actions.ts` — təsdiq action-ı.
- `src/app/[locale]/(account)/kabinet/elanlar/yeni/actions.ts` — təsdiqlənmiş agentliyin
  birbaşa dərc olunan elanı.

Hər yerdə: `publishedAt` `null`-dan qeyri-`null`-a keçəndə (yəni **ilk dəfə** dərc olunanda,
təkrar redaktədə yox) `await notifyMatchingSavedSearches(property.id)` çağırılır. Xəta halında
udulur və `console.error` ilə qeyd olunur — bildiriş uğursuzluğu əmlak yazılmasını
bloklamamalıdır.

## 6. Notification Center

`src/app/[locale]/(account)/kabinet/bildirisler/page.tsx`:

- Siyahı: icon (type-a görə), title, content, tarix (nisbi, `Intl.RelativeTimeFormat`),
  oxu/oxunmamış vizual fərqi, actionUrl-ə keçid.
- Əməliyyat: tək bildirişi oxunmuş işarələ (klikləyəndə avtomatik), hamısını oxunmuş et,
  sil — hər biri `actions.ts`-də server action, `requireAccount()` ilə qorunur.
- Kabinet naviqasiyasına yeni maddə: `{ id: "notifications", href: "/kabinet/bildirisler" }`
  (`cabinet-navigation.ts`-ə əlavə, `BellIcon`).
- Header-də (Navbar və ya kabinet shell) oxunmamış say — `getUnreadNotificationCount(userId)`,
  yalnız giriş edilmiş istifadəçi üçün göstərilir.

## 7. Saved Search UI

- `/emlaklar` axtarış nəticələri səhifəsində "Axtarışı saxla" düyməsi — yalnız giriş edilmiş
  istifadəçiyə görünür (`getOptionalUser()`). Kliklə: cari URL query-dən `PropertyFilters`
  qurulur (mövcud `emlaklar/page.tsx` parametr map-i təkrar istifadə olunur), modal/inline
  formada ad + tezlik soruşulur, server action ilə saxlanılır.
- `src/app/[locale]/(account)/kabinet/axtarislarim/page.tsx`: siyahı — ad, filter xülasəsi
  (insan-oxunaqlı, mövcud filtr etiketlərindən — `LISTING_TYPE_LABELS` və s. — qurulur), yeni
  nəticə sayı (`matches` üzrə `notifiedAt: null` sayı), tezlik, redaktə/pause/sil, "nəticələrə
  bax" (`/emlaklar?...` filtrlərlə).
- Kabinet naviqasiyasına yeni maddə: `{ id: "saved-searches", href: "/kabinet/axtarislarim" }`.

## 8. Recently Viewed

- `src/lib/recently-viewed.ts` — `favorites.ts` ilə eyni forma: `useRecentlyViewed()` hook,
  `localStorage` (açar: `luxehomeestate:recently-viewed`), maksimum 20 ID, ən yenisi əvvəldə.
- `emlaklar/[slug]/page.tsx`-də klient tərəfli kiçik komponent səhifə yüklənəndə ID-ni əlavə edir
  (useEffect, server component-i statik saxlamaq üçün).
- `src/app/[locale]/(account)/kabinet/son-baxilanlar/page.tsx` — `fetchRecentProperties(ids)`
  server action-ı (favoritler/actions.ts-dəki `fetchFavoriteProperties` pattern-i, `getPropertiesByIds` istifadə edir).
- Kabinet naviqasiyasına yeni maddə.

## 9. Test

Mövcud auth qatı Vitest+workerd konvensiyasına uyğun (`@cloudflare/vitest-plugin`):

- `notifyMatchingSavedSearches` üçün unit test: uyğun/uyğun olmayan filtr ssenariləri, təkrar
  çağırışda ikinci `SavedSearchMatch`/`Notification` yaranmadığını yoxlayır (`src/lib/__tests__/`
  və ya `queries.ts`-ə uyğun test qovluğu).
- Bu, layihədə `queries.ts` üçün ilk test olacaq — `MEMORY.md` bölmə 6-dakı "Vitest — queries.ts
  filtr məntiqi üçün unit testlər" bəndi qismən qarşılanır.

## 10. Qəbul kriteriyaları

1. Giriş edilmiş istifadəçi axtarış nəticələrindən filtri ada və tezliyə görə saxlaya bilir.
2. Saxlanmış axtarış redaktə, pause (`enabled: false`), silinə bilir.
3. Yeni əmlak dərc olunanda uyğun aktiv saxlanmış axtarışlar tapılır.
4. Eyni əmlak eyni saxlanmış axtarışa ikinci dəfə bildiriş yaratmır (`@@unique` təsdiqlənir).
5. "Dərhal" tezliyi seçilmiş saxlanmış axtarış üçün email göndərilir; digər tezliklər üçün
   göndərilmir (sənədləşdirilmiş məhdudiyyət).
6. Bildiriş mərkəzində siyahı görünür, oxunmuş/oxunmamış işarələnir, silinir.
7. Baxılan əmlak avtomatik "Son baxılanlar"a düşür, kabinetdə görünür.
8. `npm run test` + `npm run typecheck` + `npm run build` təmiz keçir.

---

## 11. Açıq sual (spec təsdiqindən əvvəl aydınlaşdırılmalı deyil, amma qeyd olunur)

Email/web/push checkbox-ları (PRD bölmə 57, "Notification Preferences") bu fazada yalnız
Saved Search kateqoriyası üçün göstəriləcək — Price Drop və Meeting Reminder sətirləri hələ
funksional deyil, ona görə UI-da göstərilmir (YAGNI). Onlar öz alt-layihələri ilə əlavə olunacaq.
