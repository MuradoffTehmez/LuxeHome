# Saved Search + Recently Viewed + Notification Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** İctimai istifadəçi kabinetinə üç yeni bölmə əlavə etmək — saxlanmış axtarışlar (yeni uyğun elan üçün avtomatik bildiriş), bildiriş mərkəzi, son baxılan əmlaklar.

**Architecture:** Saved Search + Notification server tərəfində D1-də saxlanılır (cihazlar arası davam etməli, cron olmadan "dərhal" email göndərməlidir). Uyğunluq mühərriki `queries.ts`-in mövcud `buildPropertyWhere()`-dən istifadə edir və `src/lib/accounts/property-submission.ts`-dəki inject-edilə bilən "store" nümunəsini təkrar edir ki, D1 binding olmadan unit test yazıla bilsin. Əmlak `PUBLISHED`-ə keçən **hər** yazı nöqtəsi `notifyMatchingSavedSearches()`-i çağırır. Recently Viewed Favorites/Compare presedentinə uyğun tamamilə localStorage-də qalır, DB toxunmur.

**Tech Stack:** Next.js 15 App Router, React 19, Prisma 6 (`@prisma/adapter-d1`), Cloudflare D1, next-intl, Vitest 4 (`@cloudflare/vitest-plugin`, workerd layihəsi).

**Spec:** `docs/superpowers/specs/2026-08-25-saved-search-notifications-design.md`

## Global Constraints

- D1 transaction dəstəkləmir — bütün çoxlu-yazı əməliyyatları ardıcıl, ayrı-ayrı sorğulardır; yarımçıq qalma halında məlumat itməməlidir (bax spec bölmə 5, mövcud `emlaklar/actions.ts` D1 şərhi).
- `mode: "insensitive"` D1-də yazılmır (SQLite native dəstəkləmir).
- Yeni ictimai əmlak sorğusu `publicPropertyWhere()` / mövcud `buildPropertyWhere()`-dən başlamalıdır.
- Status/tip dəyərləri həmişə `src/lib/constants.ts`-dən gəlməlidir, hardcode yazılmamalıdır.
- Bildiriş uğursuzluğu əsas əməliyyatı (əmlak yazılması) bloklamamalıdır — hər çağırış nöqtəsində xəta udulub `console.error` ilə qeyd olunur.
- Yeni komponentlərdə `dark:` prefiksi yazılmır — mövcud rəng token-lərindən istifadə olunur.
- Yeni i18n mətni əlavə edilən hər namespace-də AZ/EN/RU **eyni** açar dəstinə malik olmalıdır (`src/i18n/__tests__/catalog-parity.test.ts` bunu yoxlayır) və heç bir açar boş qalmamalıdır.
- Kabinet səhifələri `requireAccount()` / `requireLister()` ilə qorunur, hər server action öz guard-ını ilk sətirdə çağırır (action-lar layout-dan keçmir).
- Hər tapşırıqdan sonra `npm run typecheck` təmiz keçməlidir; son tapşırıqda əlavə olaraq `npm run test` və `npm run build`.

---

## Task 1 — Data modeli, miqrasiya, domen sabitləri

**Files:**
- Modify: `prisma/schema.prisma` (yeni `SavedSearch`, `SavedSearchMatch`, `Notification` modelləri; `User.savedSearches`/`User.notifications`; `Property.savedSearchMatches` relation-ları)
- Modify: `src/lib/constants.ts` (`SAVED_SEARCH_FREQUENCIES`, `SAVED_SEARCH_FREQUENCY_LABELS`, `NOTIFICATION_TYPES`)
- Create: `migrations/0012_saved_search_notifications.sql`

**Interfaces:**
- Produces: Prisma modelləri `SavedSearch { id, userId, name, filters(String/JSON), frequency, enabled, createdAt, lastCheckedAt, lastNotifiedAt }`, `SavedSearchMatch { id, savedSearchId, propertyId, notifiedAt, createdAt, @@unique([savedSearchId, propertyId]) }`, `Notification { id, userId, type, title, content, actionUrl, readAt, createdAt }`. Bunlar Task 2-5-də istifadə olunur.
- Produces: `SAVED_SEARCH_FREQUENCIES.{IMMEDIATE,DAILY,WEEKLY,OFF}`, `NOTIFICATION_TYPES.SAVED_SEARCH_MATCH` — Task 2, 4, 5-də istifadə olunur.

- [ ] Spec bölmə 4-dəki Prisma modellərini `prisma/schema.prisma`-ya əlavə et (dəqiq sahə adları və şərhlərlə), `User`/`Property` relation-larını bağla.
- [ ] `src/lib/constants.ts`-ə `SAVED_SEARCH_FREQUENCIES` + `SAVED_SEARCH_FREQUENCY_LABELS` (mövcud `PRICE_PERIODS`/`PRICE_PERIOD_LABELS` cütü ilə eyni forma) və `NOTIFICATION_TYPES` sabitlərini əlavə et.
- [ ] `npm run db:generate` işlət (Prisma client yenilənsin), sonra `npm run db:migrate:local` ilə lokal D1-i sxemlə sinxronlaşdır.
- [ ] `npm run db:migrate:new -- --output migrations/0012_saved_search_notifications.sql` işlədib miqrasiya faylını yarat, çıxan SQL-in yalnız gözlənilən 3 cədvəli yaratdığını gözdən keçir.
- [ ] `npm run typecheck` təmiz keçdiyini təsdiqlə.
- [ ] Commit: `feat(db): add saved search, saved search match, notification models`.

## Task 2 — Uyğunluq mühərriki (`notifyMatchingSavedSearches`) + unit test

**Files:**
- Modify: `src/lib/queries.ts`
- Create: `src/lib/__tests__/saved-search-matching.test.ts`

**Interfaces:**
- Consumes: Task 1-dəki `SavedSearch`/`SavedSearchMatch`/`Notification` modelləri, `SAVED_SEARCH_FREQUENCIES`, mövcud (module-private) `buildPropertyWhere(filters: PropertyFilters)`.
- Produces: `export type SavedSearchMatchStore` (inject-edilə bilən asılılıqlar: `findActiveSavedSearches()`, `matchesFilters(filters, propertyId)`, `recordMatch(savedSearchId, propertyId): Promise<boolean>` — `true` yalnız yeni sətir yaradılıbsa), `getProperty(propertyId)`, `createNotification(input)`, `sendImmediateEmail(userEmail, property, searchName)`); `export async function runSavedSearchMatching(propertyId: string, store: SavedSearchMatchStore): Promise<void>` (test bunu saxta store ilə çağırır); `export async function notifyMatchingSavedSearches(propertyId: string): Promise<void>` (real Prisma store ilə sarılmış, xətanı udur) — Task 3-dəki bütün admin/kabinet çağırış nöqtələri yalnız bunu import edir.

- [ ] `src/lib/accounts/property-submission.ts`-dəki inject-edilə bilən "store" nümunəsinə uyğun olaraq `SavedSearchMatchStore` tipini və `runSavedSearchMatching()` orkestrasiya funksiyasını `queries.ts`-ə yaz: bütün aktiv (`enabled: true`) saxlanmış axtarışları oxu, hər birinin `filters` JSON-unu parse et (parse xətası olan sətri sükutla ötür), `matchesFilters` ilə yoxla, uyğun gələrsə `recordMatch` çağır — `false` qayıdarsa (artıq bildirilib) sonrakı addımları ötür, `true` qayıdarsa `createNotification` çağır və `frequency === SAVED_SEARCH_FREQUENCIES.IMMEDIATE` olduqda `sendImmediateEmail`-i çağır (xətasını udub log yaz).
- [ ] Prisma-əsaslı real `SavedSearchMatchStore` implementasiyasını yaz: `matchesFilters` → `prisma.property.findFirst({ where: { ...buildPropertyWhere(filters), id: propertyId }, select: { id: true } })` nəticəsinin boş olmadığını qaytarır; `recordMatch` → `prisma.savedSearchMatch.create(...)`, `P2002` xətasını tutub `false` qaytarır, uğurlu olduqda `true`; `findActiveSavedSearches` → `prisma.savedSearch.findMany({ where: { enabled: true }, select: { id, userId, filters, frequency, user: { select: { email: true } } } })`; `getProperty` → `prisma.property.findUnique({ where: { id }, select: { title: true, slug: true } })`; `createNotification` → `prisma.notification.create(...)` (`type: NOTIFICATION_TYPES.SAVED_SEARCH_MATCH`); `sendImmediateEmail` → Task 3-dəki `sendSavedSearchMatchEmail`-i çağırır.
- [ ] `export async function notifyMatchingSavedSearches(propertyId: string)` yaz: real store ilə `runSavedSearchMatching`-i çağırır, bütün xətanı udub `console.error("[saved-search] uyğunluq yoxlanmadı:", error)` yazır — çağıran kod heç vaxt bu funksiyadan atılan xəta görməməlidir.
- [ ] `src/lib/__tests__/saved-search-matching.test.ts`-də saxta `SavedSearchMatchStore` ilə ssenariləri yaz: (a) uyğun gələn axtarış üçün `createNotification` çağırılır və `IMMEDIATE` tezlikdə `sendImmediateEmail` çağırılır, `DAILY`-də çağırılmır; (b) uyğun gəlməyən axtarış üçün heç nə yaradılmır; (c) `recordMatch` `false` qaytardıqda (artıq bildirilib) `createNotification` **ikinci dəfə** çağırılmır; (d) bozuq JSON `filters` sətri digər axtarışları dayandırmır.
- [ ] `npm run test -- saved-search-matching` ilə testlərin keçdiyini təsdiqlə.
- [ ] Commit: `feat(queries): add saved search matching engine`.

## Task 3 — Email şablonu + bütün PUBLISHED keçid nöqtələrinə bağlama

**Files:**
- Modify: `src/lib/email.ts` (yeni `sendSavedSearchMatchEmail`)
- Modify: `src/app/admin/emlaklar/actions.ts` (`createProperty`, `updateProperty`, `setPropertyStatus`, `bulkUpdateProperties`)
- Modify: `src/app/admin/moderation/actions.ts` (`approveModerationProperty`)
- Modify: `src/app/[locale]/(account)/kabinet/elanlar/yeni/actions.ts` (`createPublicProperty`)

**Interfaces:**
- Consumes: Task 2-dəki `notifyMatchingSavedSearches(propertyId)`.
- Produces: `sendSavedSearchMatchEmail({ to, searchName, propertyTitle, propertyUrl }): Promise<{success, ...}>` — yalnız Task 2-dəki real store daxilində çağırılır, başqa yerdən istifadə olunmur.

- [ ] `email.ts`-ə mövcud brend şablon üslubunda (header/gold xətt/footer) yığcam `sendSavedSearchMatchEmail` funksiyası əlavə et — `sendLeadNotificationEmail`-dən qısa, tək əmlak kartı və "Elana bax" düyməsi ilə.
- [ ] `admin/emlaklar/actions.ts`-də hər 4 nöqtədə **yalnız `publishedAt` `null`-dan qeyri-`null`-a keçəndə** `await notifyMatchingSavedSearches(propertyId)` çağır:
  - `createProperty`: `parsed.data.status === PROPERTY_STATUSES.PUBLISHED` olduqda, yazıdan sonra.
  - `updateProperty`: `existing.publishedAt === null && parsed.data.status === PROPERTY_STATUSES.PUBLISHED` olduqda, yazıdan sonra.
  - `setPropertyStatus`: `existing.publishedAt === null && status === PROPERTY_STATUSES.PUBLISHED` olduqda, yazıdan sonra.
  - `bulkUpdateProperties` (`intent === "publish"`): dövrədən əvvəl `publishedAt: null` olan id-ləri ayrıca sorğu ilə tap, yalnız uğurla yenilənən və əvvəllər `publishedAt` olmayan id-lər üçün dövrədən sonra çağır.
- [ ] `moderation/actions.ts`-in `approveModerationProperty`-də yazıdan sonra `await notifyMatchingSavedSearches(id)` çağır (bu yol həmişə ilk dəfə dərcdir, çünki `PENDING`-dən gəlir).
- [ ] `kabinet/elanlar/yeni/actions.ts`-in `createPublicProperty`-də `finalizeProperty` callback-i uğurla bitəndən sonra (yəni `finalPolicy.status === PROPERTY_STATUSES.PUBLISHED` olduqda) `await notifyMatchingSavedSearches(propertyId)` çağır.
- [ ] Hər çağırışı `try { await notifyMatchingSavedSearches(id); } catch {}`-ə ehtiyac yoxdur — funksiya artıq daxildə xətanı udur; sadəcə `await` elə.
- [ ] `npm run typecheck` təmiz keçdiyini təsdiqlə.
- [ ] Commit: `feat(properties): trigger saved search notifications on publish`.

## Task 4 — Saved Search UI (kabinet səhifəsi + axtarış nəticələrindən saxlama)

**Files:**
- Create: `src/app/[locale]/(account)/kabinet/axtarislarim/page.tsx`
- Create: `src/app/[locale]/(account)/kabinet/axtarislarim/actions.ts`
- Create: `src/app/[locale]/(account)/kabinet/axtarislarim/saved-search-list.tsx` (client — pause/redaktə/sil düymələri)
- Create: `src/components/site/save-search-button.tsx` (client, `/emlaklar` nəticələr səhifəsi üçün)
- Modify: `src/app/[locale]/(site)/emlaklar/page.tsx` (giriş edilmiş istifadəçiyə `SaveSearchButton`-u cari filtrlərlə göstər)

**Interfaces:**
- Consumes: Task 1-dəki `SavedSearch` modeli, Task 6-dakı `getCabinetItems`/`isCabinetItemActive` (naviqasiya).
- Produces: `createSavedSearch(_prev, formData)`, `updateSavedSearchFrequency(id, frequency)`, `toggleSavedSearchEnabled(id)`, `deleteSavedSearch(id)` — hamısı `ActionState` qaytarır (`@/lib/admin/action-state` pattern-i ictimai kabinetdə də istifadə olunur, bax `kabinet/profil/actions.ts`).

- [ ] `axtarislarim/actions.ts`-i yaz: hər action `requireAccount(locale)` ilə başlayır. `createSavedSearch`: `formData`-dan `name` + cari `/emlaklar` query-sindən qurulmuş JSON `filters` + `frequency` oxuyur (`emlaklar/page.tsx`-dəki eyni parametr map-i təkrar istifadə olunur — SearchPanel-in göndərdiyi `elan/axtaris/tip/seher/rayon/otaq/min/max/sahe_min/sahe_max/temir/sened/siralama` adları), `prisma.savedSearch.create` çağırır, `revalidatePath` + uğur mesajı qaytarır. `toggleSavedSearchEnabled`/`deleteSavedSearch`: `userId` sahibliyini yoxlayır (`findFirst({ where: { id, userId } })`), tapılmasa `failure`.
- [ ] `axtarislarim/page.tsx`-i `kabinet/elanlar/page.tsx` pattern-i ilə yaz (`AdaptiveDataList`, `EmptyState`, `PageHeader`): hər sətirdə ad, insan-oxunaqlı filtr xülasəsi (mövcud `LISTING_TYPE_LABELS`/`RENOVATION_LABELS` və s.-dən qurulur), yeni nəticə sayı (`matches` üzrə `notifiedAt: null` sayı — `prisma.savedSearchMatch.count`), tezlik, "nəticələrə bax" linki (`/emlaklar?...` filtrlərlə).
- [ ] `saved-search-list.tsx`-də redaktə/pause/sil düymələrini `useActionState` + `useFormStatus` ilə bağla (mövcud `komanda/team-forms.tsx` üslubu).
- [ ] `save-search-button.tsx`-i `getOptionalUser()`-ə görə `/emlaklar` server component-indən şərtlə render et, klikləndə cari `useSearchParams`-dan JSON filtr qurub inline formada ad+tezlik soruşur, `createSavedSearch`-i çağırır.
- [ ] `npm run typecheck` təmiz keçdiyini təsdiqlə.
- [ ] Commit: `feat(cabinet): add saved search management and save-from-search UI`.

## Task 5 — Notification Center

**Files:**
- Create: `src/app/[locale]/(account)/kabinet/bildirisler/page.tsx`
- Create: `src/app/[locale]/(account)/kabinet/bildirisler/actions.ts`
- Create: `src/app/[locale]/(account)/kabinet/bildirisler/notification-list.tsx` (client)
- Modify: `src/lib/queries.ts` (`getUnreadNotificationCount(userId)`)
- Modify: `src/components/site/account-menu.tsx` (oxunmamış say nişanı)

**Interfaces:**
- Consumes: Task 1-dəki `Notification` modeli, `requireAccount()`.
- Produces: `markNotificationRead(id)`, `markAllNotificationsRead()`, `deleteNotification(id)` — `ActionState` qaytarır; `getUnreadNotificationCount(userId: string): Promise<number>` — `account-menu.tsx` bunu import edir.

- [ ] `queries.ts`-ə `getUnreadNotificationCount(userId)` əlavə et: `prisma.notification.count({ where: { userId, readAt: null } })`.
- [ ] `bildirisler/actions.ts`-i yaz: hər action `requireAccount(locale)` + sahiblik yoxlaması (`findFirst({ where: { id, userId } })`) ilə başlayır. `markNotificationRead`/`deleteNotification` tək ID alır, `markAllNotificationsRead` `updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })`.
- [ ] `bildirisler/page.tsx`-i yaz: `prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })`, hər sətirdə icon (`type`-a görə — hazırda yalnız `SAVED_SEARCH_MATCH`), title, content, nisbi tarix (`Intl.RelativeTimeFormat`), oxu/oxunmamış vizual fərqi (fon rəngi), `actionUrl`-ə klikləndə `markNotificationRead` çağırılır. Üstdə "Hamısını oxu" düyməsi.
- [ ] `account-menu.tsx`-ə `getUnreadNotificationCount(user.id)`-i `requireAccount`-un çağrıldığı yerdən ötür və zəng zəngi ikonuna (`BellIcon`, sayı ilə) əlavə et, `/kabinet/bildirisler`-ə keçid versin — yalnız giriş edilmiş istifadəçiyə görünür.
- [ ] `npm run typecheck` təmiz keçdiyini təsdiqlə.
- [ ] Commit: `feat(cabinet): add notification center`.

## Task 6 — Recently Viewed + kabinet naviqasiyasının genişlənməsi

**Files:**
- Create: `src/lib/recently-viewed.ts` (`favorites.ts` ilə eyni forma)
- Create: `src/components/site/recently-viewed-tracker.tsx` (client, `useEffect`)
- Create: `src/app/[locale]/(account)/kabinet/son-baxilanlar/page.tsx`
- Create: `src/app/[locale]/(account)/kabinet/son-baxilanlar/actions.ts` (`fetchRecentProperties`)
- Modify: `src/app/[locale]/(site)/emlaklar/[slug]/page.tsx` (tracker-i render et)
- Modify: `src/lib/accounts/cabinet-navigation.ts` (yeni id-lər: `saved-searches`, `notifications`, `recently-viewed`)
- Modify: `src/app/[locale]/(account)/kabinet/cabinet-nav.tsx` (yeni icon-lar)

**Interfaces:**
- Consumes: `getPropertiesByIds` (`queries.ts`, artıq mövcuddur).
- Produces: `useRecentlyViewed()` (`favorites.ts`-dəki `useFavorites()` ilə eyni imza: `{ ids, ready, add, clear }`), `fetchRecentProperties(ids: string[])`.

- [ ] `recently-viewed.ts`-i `favorites.ts`-i əsas götürərək yaz: `STORAGE_KEY = "luxehomeestate:recently-viewed"`, maksimum 20 ID, `add(id)` ID-ni siyahının əvvəlinə qoyur (təkrarı çıxarır), `useRecentlyViewed()` hook.
- [ ] `recently-viewed-tracker.tsx`-i yaz: `"use client"`, `useEffect`-də `add(propertyId)` çağırır, heç nə render etmir (`null` qaytarır) — server component-i statik saxlamaq üçün.
- [ ] `emlaklar/[slug]/page.tsx`-ə `<RecentlyViewedTracker propertyId={property.id} />`-i əlavə et.
- [ ] `son-baxilanlar/actions.ts`-də `fetchRecentProperties(ids)` — `favoritler/actions.ts`-dəki `fetchFavoriteProperties` pattern-i (100 ID həddi + `getPropertiesByIds`).
- [ ] `son-baxilanlar/page.tsx`-i `favoritler/favorites-list.tsx` pattern-i ilə yaz (client komponent, `useRecentlyViewed()` + `fetchRecentProperties` çağırır, kart siyahısı göstərir).
- [ ] `cabinet-navigation.ts`-də `CabinetNavItem["id"]` union-una `"saved-searches" | "notifications" | "recently-viewed"` əlavə et, `getCabinetItems()`-ə uyğun sətirləri (`/kabinet/axtarislarim`, `/kabinet/bildirisler`, `/kabinet/son-baxilanlar`) hər istifadəçi üçün (canList-dən asılı olmadan) əlavə et.
- [ ] `cabinet-nav.tsx`-in `ICONS` map-inə `Search`/`Bell`/`History` (lucide-react) əlavə et.
- [ ] `npm run typecheck` təmiz keçdiyini təsdiqlə.
- [ ] Commit: `feat(cabinet): add recently viewed and expand cabinet navigation`.

## Task 7 — i18n mətnləri (AZ/EN/RU)

**Files:**
- Modify: `src/i18n/locales/{az,en,ru}/account.json` (yeni `savedSearches`, `notifications`, `recentlyViewed` obyektləri)
- Modify: `src/i18n/locales/{az,en,ru}/auth.json` (`cabinet` obyektinə `savedSearches`, `notifications`, `recentlyViewed`, `unreadNotifications` açarları)
- Modify: `src/i18n/locales/{az,en,ru}/listings.json` (`search` obyektinə `saveSearch`, `saveSearchName`, `saveSearchFrequency`, `saveSearchSubmit`, `saveSearchSaved`)

**Interfaces:**
- Consumes: Task 4/5/6-dakı bütün `useTranslations(...)` çağırışları bu açarları gözləyir.

- [ ] Task 4/5/6-da yazılan hər səhifə/komponentin istifadə etdiyi bütün `t("...")` açarlarının siyahısını çıxar.
- [ ] `az/account.json`-a `savedSearches` (`metaTitle`, `title`, `eyebrow`, `emptyTitle`, `emptyDescription`, `newMatches`, `frequencyLabel`, `frequency.{immediate,daily,weekly,off}`, `pause`, `resume`, `delete`, `viewResults`, `nameLabel`, `save`), `notifications` (`metaTitle`, `title`, `eyebrow`, `emptyTitle`, `emptyDescription`, `markAllRead`, `markRead`, `delete`, `unread`), `recentlyViewed` (`metaTitle`, `title`, `eyebrow`, `emptyTitle`, `emptyDescription`) obyektlərini əlavə et — mövcud `listings`/`team` obyektləri ilə eyni minified JSON üslubunda.
- [ ] Eyni açar strukturunu `en/account.json` və `ru/account.json`-a real ingiliscə/rusca tərcümə ilə əlavə et (heç bir boş sətir yox).
- [ ] `auth.json`-un `cabinet` obyektinə hər 3 dildə `savedSearches`, `notifications`, `recentlyViewed` naviqasiya etiketlərini və `unreadNotifications: "{count} oxunmamış"` (və EN/RU qarşılığı) əlavə et.
- [ ] `listings.json`-un `search` obyektinə hər 3 dildə saxlama düyməsi/modal mətnlərini əlavə et.
- [ ] `npm run test -- catalog-parity` ilə parity testinin keçdiyini təsdiqlə.
- [ ] Commit: `feat(i18n): translate saved search and notification UI`.

## Task 8 — Tam doğrulama

- [ ] `npm run test` — bütün workerd + ui-node testləri (yeni `saved-search-matching.test.ts` daxil) yaşıl olmalıdır.
- [ ] `npm run typecheck` — xəta olmamalıdır.
- [ ] `npm run build` — uğurla bitməlidir.
- [ ] Spec bölmə 10-dakı 8 qəbul kriteriyasının hər birini kodda göstər (fayl:sətir) və uyğunsuzluq varsa düzəlt.
- [ ] `npm run preview` ilə workerd runtime-ında əl ilə yoxla: axtarış saxlama → yeni uyğun elan dərci → bildiriş yaranması → email (əgər `RESEND_API_KEY` yoxdursa `sendEmail` `success:false` qaytarır, bu gözlənilir) → Notification Center-də görünmə → Recently Viewed-ə əmlak baxışının düşməsi.
- [ ] `MEMORY.md` bölmə 10-da bu alt-layihəni tamamlanmış kimi qeyd et.
