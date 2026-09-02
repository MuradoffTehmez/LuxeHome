# Kibertəhlükəsizlik auditi — 2 sentyabr 2026

**Əhatə:** tam mənbə kodu (580 TS/TSX faylı), `main` @ `b6c3f4f`
**Metod:** ağ qutu statik analiz. Kod icra edilməyib, canlı mühitə sorğu göndərilməyib.
Dinamik test (DAST) və nüfuzetmə testi bu işin əhatəsindən kənardır.

**Nəticə:** 2 yüksək · 3 orta · 5 aşağı · 1 məlumat

Layihənin təhlükəsizlik səviyyəsi bu ölçüdə bir platforma üçün orta göstəricidən xeyli
yuxarıdır: sessiyalar ləğv edilə bilən və bazada saxlanılır, HTML yazılma anında ağ siyahı ilə
təmizlənir, yükləmələr magic-byte ilə yoxlanılır, müqayisələr sabit vaxtlıdır və 47 Server
Action faylının hamısında guard invariantı pozulmur. Buna baxmayaraq, panelin ən kritik
müdafiə həlqəsində — məcburi iki mərhələli doğrulamada — iki real yan keçmə yolu var idi.

> **Status:** bütün 11 tapıntı bu auditdən sonra həll edilib. Hər bölmədəki
> «Düzəliş» qeydi tətbiq olunmuş həlli təsvir edir.

---

## Yüksək prioritetli tapıntılar

### T-1 — Yalnız parolla tam panel sessiyası açmaq mümkün idi

`src/app/[locale]/giris/actions.ts:310` — `finishEnrollment()`

**Nə baş verirdi.** `signIn()` parolu düzgün olan, amma hələ 2FA qurmamış əməkdaşa
`stage: "enroll"` ara-cookie-si verir. `finishEnrollment()` yalnız həmin cookie-nin
mövcudluğunu və mərhələsini yoxlayır, sonra birbaşa `startSession()` çağırırdı.
TOTP-un həqiqətən qurulduğu heç yerdə yoxlanmırdı — nə `totpEnabledAt`, nə `totpSecret`.

**Təsir.** Server Action-lar birbaşa POST ilə çağırıla bilir və layout-dan keçmir. Parolu
ələ keçirmiş şəxs `completeEnrollment()`-i tamamilə atlayıb `finishEnrollment()`-i çağıraraq
`authKind: STAFF_2FA` daşıyan tam səlahiyyətli sessiya ala bilərdi. Pəncərə hər yeni əməkdaş
hesabında açılırdı: `auth:create-admin` ilə yaradılan ilk SUPER_ADMIN və
`/admin/istifadeciler`-dən müvəqqəti parolla yaradılan hər hesab ilk girişinə qədər bu
vəziyyətdə olur.

**Düzəliş.** Yoxlama `startSession()`-ın özünə qoyulub: sessiya açılmazdan əvvəl
`totpEnabledAt` bazadan oxunur və boşdursa istifadəçi `/giris/2fa-qurulumu`-ya qaytarılır.
Mərkəzləşdirmə qəsdəndir — gələcəkdə `startSession()`-ı çağıran hər yeni axın avtomatik
qorunur. Məntiq `canStartStaffSession()` kimi ayrılıb və unit testlə sabitlənib.

### T-2 — TOTP doğrulamasında nə IP sürət limiti, nə hesab kilidi tətbiq olunurdu

`src/app/[locale]/giris/actions.ts:219` — `verifyTwoFactor()`

**Nə baş verirdi.** `signIn()` üç qat qorunur: `checkLoginLimit(ip)`, `verifyTurnstile()` və
`isAccountLocked(user.lockedUntil)`. `verifyTwoFactor()`-də bunların heç biri yox idi.
Funksiya uğursuz cəhddə `registerFailure()` çağırır — o da `failedAttempts`-i artırıb 5-dən
sonra `lockedUntil` yazır — lakin bu sahəni həmin kod yolunda heç kim oxumurdu.
Kilid qoyulur, amma tətbiq edilmirdi.

**Təsir.** Etibarlı `stage: "totp"` cookie-si olan tərəf (yəni parolu artıq bilən) 5 dəqiqəlik
pəncərədə 6 rəqəmli kodu limitsiz sınaya bilərdi. `WINDOW = 1` hər anda 3 kodu etibarlı
saxlayır, yəni cəhd başına uğur ehtimalı ≈ 3/10⁶. Yüksək sürətli avtomatlaşdırma ilə tək
pəncərədə bir neçə faizlik, təkrarlanan pəncərələrdə isə praktiki uğur şansı yaranırdı.
Bu, 2FA-nı ikinci müdafiə həlqəsi olmaqdan çıxarırdı.

**Düzəliş.** `verifyTwoFactor()`-un əvvəlinə `signIn()`-dəki eyni yoxlamalar əlavə edilib:
`checkLoginLimit(ip)`, sonra istifadəçi oxunduqdan dərhal sonra
`isAccountLocked(user.lockedUntil)`. Kilidli hesabda kod yoxlaması ümumiyyətlə aparılmır.
Backup kod budağı da eyni qapıdan keçir. Qərar `twoFactorGateOutcome()` saf funksiyasına
ayrılıb və testlə örtülüb.

---

## Orta prioritetli tapıntılar

### T-3 — İctimai səhifələr CSP-siz göndərilirdi

`src/middleware.ts:89` — `harden()` yalnız 193 və 199-cu sətirlərdən çağırılırdı

**Nə baş verirdi.** `harden()` funksiyası `ADMIN_CSP`, `frame-ancestors 'none'`,
`Referrer-Policy: no-referrer` və `Cache-Control: no-store` qoyur, lakin yalnız
`isAccountFlowRoute()` budağının içində çağırılırdı. İctimai marşrutlar erkən `return`-dan
keçir və `Content-Security-Policy` başlığı almırdı.

**Təsir.** Məhz ictimai səhifələr redaktor tərəfindən yazılan zəngin HTML-i
`dangerouslySetInnerHTML` ilə render edir (bloq, bilik mərkəzi, lüğət, tərəfdaşlar, FAQ).
Sanitizer güclüdür və hazırda boşluq görünmür, amma CSP məhz sanitizer-də gələcək bir səhv
üçün ikinci qatdır. Həmçinin `base-uri` və `object-src` qorumasız qalırdı; clickjacking-ə
qarşı yeganə vasitə `next.config.ts`-dəki `X-Frame-Options: SAMEORIGIN` idi.

**Düzəliş.** Ayrıca `PUBLIC_CSP` dəsti əlavə olunub və bütün ictimai cavablara tətbiq edilir.
Panel siyasətindən fərqləri qəsdlidir: `frame-ancestors 'self'` (panel `'none'` saxlayır),
`script-src`-də Google Tag Manager, `img-src`-də analitika pikselləri və `connect-src`-də
GA/GTM son nöqtələri. `base-uri 'self'`, `object-src 'none'` və `form-action 'self'` indi
hər üç cavab yolunda var. `Cache-Control` ictimai səhifələrə toxunmur — ISR keşi qorunur.

### T-4 — PBKDF2 iterasiya sayı sənəddə yazılandan iki dəfə az idi

`src/lib/auth/password.ts:24` — `ITERATIONS = 100_000` · `CLAUDE.md`: «210 000 iterasiya»

**Nə baş verirdi.** Kod 100 000 iterasiya işlədir və şərh bunu Cloudflare Workers-in yuxarı
həddi kimi izah edir (hədd realdır — daha böyük dəyər `deriveBits()` zamanı
`NotSupportedError` atır və düzgün parolun da rədd edilməsinə səbəb olur). Lakin `CLAUDE.md`
hələ də 210 000 yazırdı. OWASP-ın PBKDF2-SHA256 üçün cari tövsiyəsi 600 000-dir.

**Təsir.** Baza sızması halında oflayn parol sındırma tövsiyə olunandan ~6 dəfə ucuz olur.
Sənəd sürüşməsi ayrıca risk daşıyırdı: növbəti dəfə bu qatı oxuyan şəxs qorumanı olduğundan
güclü sanardı. Format iterasiya sayını daşıdığı üçün miqrasiya problemi yoxdur.

**Düzəliş.** `CLAUDE.md` kodla uyğunlaşdırılıb və Workers həddi səbəb kimi qeyd olunub.
Kompensasiya: əməkdaş parolu üçün minimum uzunluq 12 simvola qaldırılıb (`STAFF_PASSWORD_MIN`),
onlayn hücum isə 2FA + kilid + sürət limiti kombinasiyası ilə onsuz da bağlıdır.

### T-5 — Altı yüksək səviyyəli asılılıq zəifliyi

`npm audit` — `sharp`, `postcss`, `deepmerge-ts` (hamısı `next` / `prisma` altında tranzitiv)

**Nə baş verirdi.** `sharp <0.35.0` libvips CVE-2026-33327/33328/35590/35591;
`postcss <=8.5.22` — `</style>` üzərindən XSS və `sourceMappingURL` ilə ixtiyari fayl
oxunuşu; `deepmerge-ts <8.0.0` — rekursiv obyekt qrafında stek tükənməsi.

**Təsir.** Real ekspozisiya göründüyündən azdır: `sharp` və `postcss` burada build vaxtı
işləyir, runtime-da şəkil emalı Cloudflare `IMAGES` binding-i ilə gedir, `deepmerge-ts` isə
Prisma konfiqurasiyasındadır. Buna baxmayaraq `postcss`-in fayl oxuma zəifliyi CI mühitində
qorunmayan bir səthdir.

**Düzəliş.** Paketlər yamaqlı buraxılışlara qaldırılıb və CI-yə `npm audit --audit-level=high`
qapısı əlavə edilib ki, bu sinif gələcəkdə avtomatik tutulsun.

---

## Aşağı prioritetli tapıntılar

### T-6 — Agentlik komandası action-ları ümumi yazma qapısını atlayırdı

`src/app/[locale]/(account)/kabinet/komanda/actions.ts:26` — `requireAgencyOwner()`

Layihədəki bütün digər kabinet yazıları `requirePublicAction()`-dan keçir: mənbə yoxlaması +
hesab növü + sürət limiti. `requireAgencyOwner()` isə birbaşa `requireAccount()` çağırırdı,
yəni `assertSameOrigin()` və `ADMIN_LIMIT` yox idi. Bu, `inviteAgencyEmployee()` və
`removeAgencyEmployee()`-yə təsir edirdi.

Praktiki risk aşağı idi — Next.js Server Action-larının öz `Origin` yoxlaması və
`SameSite=Lax` cookie birlikdə kənar saytdan POST-u onsuz da bağlayır. Real problem
invariantın pozulması idi: `allowedOrigins` konfiqurasiyası genişləndirilsə, bu iki action
qorumasız qalan yeganə nöqtə olardı.

**Düzəliş.** `requirePublicAction()`-a `"team"` scope-u əlavə olunub və `requireAgencyOwner()`
artıq ondan keçir.

### T-7 — SEO adı verilən yükləmələr bir-birinin üstünə yazırdı

`src/lib/media/storage.ts:200` — `generatedName || crypto.randomUUID()`

R2 açarı `qovluq/il/ay/<ad>.webp` formasındadır və `<ad>` istifadəçinin verdiyi `seoName`-dən
çıxarılır. `safeSeoName()` yolu təmizləyir (traversal yoxdur), lakin nəticə determinist idi:
eyni ay ərzində eyni SEO adı ilə ikinci yükləmə birincini səssizcə əvəz edirdi.

Bütövlük problemi, təhlükəsizlik deliyi deyil: `Media` cədvəlində iki sətir eyni obyektə
işarə edir və birinci elanın şəkli xəbərsiz dəyişir.

**Düzəliş.** SEO adına qısa təsadüfi şəkilçi əlavə olunub — SEO faydası qalır, toqquşma
aradan qalxır.

### T-8 — AI foto analizində autentifikasiyalı SSRF səthi

`src/app/admin/ai-komekci/actions.ts:101` — `readImageBytes()`

Funksiya `/media/` ilə başlamayan istənilən `https://` ünvanını server tərəfdən çəkirdi.
Cavab `image/*` olmalıdır və ölçü limiti var, amma hədəf host məhdudlaşdırılmırdı.

Xeyli məhdud idi: `PROPERTY_MANAGE` səlahiyyəti tələb olunur və `wrangler.jsonc`-dəki
`global_fetch_strictly_public` uyğunluq bayrağı daxili/şəxsi ünvanlara müraciəti onsuz da
bağlayır. Qalan səth — ictimai hostların cavab vaxtı ilə zondlanması.

**Düzəliş.** Mənbə `next.config.ts`-dəki `images.remotePatterns` siyahısı ilə eyniləşdirilib:
yalnız `/media/`, `images.unsplash.com`, `media.luxehomeestate.az` və `treva.realestate`
qəbul edilir. Siyahı `AI_IMAGE_HOSTS` sabitində bir yerdə saxlanılır.

### T-9 — `.gitignore`-dakı `!.env.production` istisnası tələ qoyurdu

`.gitignore:38` «`.env*`» · `.gitignore:64` «`!.env.production`»

38-ci sətir bütün `.env*` fayllarını bağlayır, 64-cü sətir isə `.env.production`-u yenidən
açırdı. **Tarixçə təmizdir** — fayl bir dəfə commit olunub (`6f3ff9d`), yalnız ictimai
`NEXT_PUBLIC_SITE_URL` saxlayıb və `3f60228`-də silinib. Repoda izlənən heç bir sirr yoxdur.

Risk gələcəkdə idi: kimsə eyni adla fayl yaradıb ora sirr yazsa, git onu səssizcə izləməyə
başlayacaqdı — çünki istisna qüvvədə idi və qorumanı gözləyən adam xəbərdarlıq görməyəcəkdi.

**Düzəliş.** İstisna silinib. Fayl artıq mövcud deyil və `SITE_URL` runtime-da oxunur, yəni
istisnanın səbəbi qalmayıb.

### T-10 — Parol bərpasında sürət limiti yox idi

`src/app/[locale]/(account)/hesab/actions.ts:323` — `resetPassword()`

Eyni fayldakı `requestPasswordReset()` həm `checkLoginLimit()`, həm `verifyTurnstile()`
işlədir, lakin tokeni istifadə edən `resetPassword()` heç birini işlətmirdi.

Token 256 bit təsadüfidir və SHA-256 ilə hash-lanır, ona görə brute-force real təhlükə deyil.

**Düzəliş.** `checkLoginLimit(ip)` əlavə olunub. Ayrıca `verifyTurnstile()`-ın secret
tapılmayanda `NODE_ENV !== "production"` qaytaran fail-open budağı şərhdə açıq
işarələnib ki, sonrakı redaktə onu təsadüfən production yoluna buraxmasın.

---

## Məlumat xarakterli

### T-11 — Sənəd sürüşməsi: `ADMIN_ENABLED`

`wrangler.jsonc` production: `"true"` · `CLAUDE.md` staging cədvəli: production `"false"`

Kod doğrudur — mətnin başqa yerində panelin production-da açıq olduğu yazılıb. Uyğunsuz olan
cədvəl idi. **Düzəliş:** cədvəldəki dəyər `"true"`-ya düzəldilib.

---

## Təsdiqlənmiş güclü tərəflər

Bunlar kodda oxunub yoxlanılıb və hücum ssenarisi qurulmağa çalışılıb — sadəcə şərhlərə
əsaslanan qeydlər deyil.

| Sahə | Tapıntı |
|---|---|
| Guard invariantı | 47 `"use server"` faylının hər ixracı yoxlanıldı. Guard görünməyən 13 ixracın hamısı guard-lı köməkçiyə (`ownerAndGuard`, `moderateReview`, `actor()`) delegasiya edir. |
| Sessiya arxitekturası | Cookie yalnız imzalanmış ID daşıyır; səlahiyyət hər sorğuda D1-dən oxunur. Sürüşən 8 saat + mütləq 7 gün. `matchesSessionProjection()` cookie ilə bazanın eyni qərarı daşıdığını təsdiqləyir. |
| HTML sanitizasiyası | Ağ siyahı yazılma anında tətbiq olunur. `ultrahtml`-in atribut siyahısının «icazə verilməyəni saxlayır» davranışı düzgün başa düşülüb və əl ilə kompensasiya edilib — `onclick` sağ qalmır. |
| Fayl yükləmə | Magic-byte imza yoxlaması, SVG-nin qəsdən kənarda saxlanması, server tərəfdə qurulan açar, R2 cavabında `nosniff` + tip ağ siyahısı. |
| Sabit vaxtlı müqayisələr | `timingSafeEqual()` uzunluq fərqi üçün də ayrıca budaq açmır. Mövcud olmayan e-poçt üçün dummy hash hesablanır — cavab vaxtı hesabın varlığını sızdırmır. |
| TOTP təkrar oynatma | `isTotpStepUsed()` eyni addım nömrəsi ilə ikinci sessiya açılmasını bağlayır. Sirr AES-GCM ilə şifrəli saxlanılır, QR server tərəfdə çəkilir. |
| Proxy sərhədləri | Xəritə tile proxy-si stili sabit lüğətdən, z/x/y-ni ciddi diapazonla yoxlayır. Geocode proxy-si sessiya + mənbə + istifadəçi üzrə limit tələb edir. Hər ikisi API açarını serverdə saxlayır. |
| Sirr gigiyenası | Tam git tarixçəsində heç bir sirr commit olunmayıb. Kodda hardcode edilmiş açar tapılmadı. Secret-lər Cloudflare-dədir və staging/production üçün ayrıdır. |
| İctimai formalar | Əlaqə forması dörd qatlıdır: honeypot, mənbə yoxlaması, IP limiti, Turnstile. Bot uğur cavabı alır — sahənin tutulduğunu bilmir. |
| İmtiyaz idarəsi | İstifadəçi öz rolunu dəyişə və özünü deaktiv edə bilmir; sonuncu aktiv SUPER_ADMIN qorunur. Parol dəyişikliyi cari parol tələb edir və digər sessiyaları ləğv edir. |
| Cron və webhook | Cron marşrutu sabit vaxtlı Bearer müqayisəsi işlədir və sirr yoxdursa bağlı qalır; icazəsiz sorğuya 404 verir. Resend webhook-u svix imzasını yoxlayır. |
| Mühit təcridi | Staging ayrı D1, R2 və worker işlədir; `routes: []` qəsdən boşdur ki, production domenini qopartmasın. `AUTH_SECRET`-in mühitlər üzrə fərqli olması tələbi sənədləşdirilib. |

---

## Yoxlanılan səthlər

| Səth | Yoxlanılan | Nəticə |
|---|---|---|
| Autentifikasiya | parol, sessiya, cookie, 2FA, kilid, sürət limiti | 2 yüksək |
| Səlahiyyət | 47 Server Action faylı, RBAC matrisi, guard invariantı | Təmiz |
| CSRF / mənbə | `assertSameOrigin`, `allowedOrigins`, SameSite | 1 aşağı |
| XSS | 14 `dangerouslySetInnerHTML` nöqtəsi, sanitizer, JSON-LD | Təmiz |
| Cavab başlıqları | CSP, HSTS, nosniff, frame-ancestors, Permissions-Policy | 1 orta |
| Enjeksiya | Prisma sorğuları, xam SQL, yol qurulması | Xam SQL yoxdur |
| SSRF | geocode, map-tiles, AI şəkil oxuma, email | 1 aşağı |
| Fayl yükləmə | magic-byte, ölçü, MIME, açar qurulması, R2 verilişi | 1 aşağı |
| Açıq yönləndirmə | `safeTarget`, `safePublicTarget`, canonical host | Təmiz |
| IDOR | favorit/müqayisə/son baxılanlar, kabinet sahibliyi, export | Təmiz |
| Sirr gigiyenası | git tarixçəsi, `.gitignore`, hardcode axtarışı, CI | 1 aşağı |
| Asılılıqlar | `npm audit` — 6 yüksək | 1 orta |

---

Luxe Home Estate MMC · Sahib: Əmiyev Bahadur Qafar oğlu
