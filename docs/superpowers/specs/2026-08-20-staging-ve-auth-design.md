# Faza 0 + 1 — Staging mühiti və autentifikasiya sistemi

Tarix: 2026-08-20
Status: təsdiq gözlənilir
Əhatə: Cloudflare staging mühiti, giriş sistemi, rol yoxlaması, iki mərhələli doğrulama

---

## 1. Kontekst

Luxe Home Estate ictimai saytı Cloudflare Workers üzərində canlıdır (`luxehomeestate.az`).
İdarə paneli (`src/app/admin`) və giriş səhifəsi (`src/app/giris`) yalnız mock data ilə işləyən
UI-dır; autentifikasiya yoxdur və `src/middleware.ts` hər iki marşrutu 404-ə yönləndirir.

Hazırkı problem ikiqatdır:

1. Yeganə worker həm `luxehomeestate.az`, həm də `luxehomeestate.amiyevbahadur.workers.dev`
   ünvanına xidmət edir. Ona görə «əvvəl workers.dev-də test et» mümkün deyil — hər deploy
   birbaşa canlı domenə düşür.
2. Admin panelin real işə düşməsi üçün heç bir auth qatı yoxdur.

Bu sənəd hər ikisini həll edən dizaynı təsvir edir. Sonrakı fazalar (admin CRUD, ictimai sayt
redesign) ayrıca spec-lərlə gedəcək.

## 2. Məqsədlər

- Prod verilənlər bazasına və prod domenə heç bir təsir göstərmədən test edilə bilən **staging
  mühiti**.
- E-poçt + parol ilə **giriş**, üzərində məcburi **TOTP iki mərhələli doğrulama**.
- Mövcud `ROLE_PERMISSIONS` matrisinə söykənən **rol və icazə yoxlaması**.
- Parol sınağına qarşı **iki qatlı sürət limiti** (IP və hesab səviyyəsində).
- Sessiyanın **dərhal ləğv edilə bilməsi** (oğurlanmış cookie, işdən çıxan əməkdaş).

## 3. Əhatə dairəsindən kənar

Bu fazada **edilmir**: admin panelin real CRUD-u, media yükləmə, parol bərpası e-poçtu
(«parolumu unutdum» axını), OAuth/SSO, audit jurnalının UI-ı, ictimai sayt dizaynı.
`/admin` səhifələri mock data ilə qalır — sadəcə artıq qorunur.

---

## 4. Faza 0 — Staging mühiti

### 4.1 Resurslar

`wrangler.jsonc`-ə `env.staging` bloku əlavə olunur. Wrangler-də `vars`, `d1_databases`,
`r2_buckets`, `services`, `routes` **irsi ötürülməyən** açarlardır — hər biri staging bloku
daxilində təkrar yazılmalıdır, əks halda staging səssizcə prod resurslarına bağlanar.

| Sahə | Prod (top-level) | `env.staging` |
|---|---|---|
| `name` | `luxehomeestate` | `luxehomeestate-staging` |
| `routes` | `luxehomeestate.az`, `www.luxehomeestate.az` | yoxdur (yalnız `workers.dev`) |
| `workers_dev` | mövcud | `true` |
| D1 `DB` | `luxehome-db` | `luxehome-db-staging` *(yeni yaradılır)* |
| R2 `MEDIA` | `luxehome-media` | `luxehome-media-staging` *(yeni)* |
| R2 `NEXT_INC_CACHE_R2_BUCKET` | `luxehome-next-cache` | `luxehome-next-cache-staging` *(yeni)* |
| `WORKER_SELF_REFERENCE` | `luxehomeestate` | `luxehomeestate-staging` |
| `IMAGES` | binding | eyni binding |
| `ADMIN_ENABLED` | `"false"` | `"true"` |
| `IS_STAGING` | *(yoxdur)* | `"true"` |
| `SITE_URL` | `https://luxehomeestate.az` | `https://luxehomeestate-staging.amiyevbahadur.workers.dev` |

Xərc: D1 pulsuz planda 10 baza, R2 pulsuz planda 10 bucket limiti var. Əlavə ödəniş yaranmır.

### 4.2 `NEXT_PUBLIC_SITE_URL` → `SITE_URL` dəyişikliyi

`NEXT_PUBLIC_` prefiksli dəyişənlər Next.js tərəfindən **build zamanı** koda yapışdırılır.
Nəticədə staging və prod üçün iki ayrı build lazım gələrdi. Dəyər yalnız bir yerdə —
`src/config/site.ts` içindəki `siteUrl()` funksiyasında — istifadə olunur və bu funksiya yalnız
server tərəfdə (metadata, JSON-LD, sitemap) çağırılır.

Ona görə dəyişən `SITE_URL` adına keçirilir və `src/lib/email.ts`-dəki kimi **lazy** oxunur.
Beləliklə eyni build həm staging, həm prod-a yayımlana bilir; fərqi yalnız wrangler `vars` verir.

İcra zamanı yoxlanılmalıdır: `siteUrl()` heç bir client komponentindən çağırılmır. Çağırılırsa,
həmin çağırış server komponentinə qaldırılır və dəyər prop kimi ötürülür.

### 4.3 Staging indeksləşməyə bağlanır

Staging prod-un birə-bir dublikatıdır. Google onu indeksləsə, əsas domenin sıralaması zərər
görər. İki tədbir:

- `src/app/robots.ts` — `IS_STAGING === "true"` olduqda bütün user-agent-lər üçün
  `disallow: "/"` qaytarır və `sitemap` sətrini buraxmır.
- `src/lib/seo.ts` — `IS_STAGING` aktivdirsə `buildMetadata()` hər səhifəyə
  `robots: { index: false, follow: false }` əlavə edir. Canonical URL isə **həmişə prod
  domenə** işarə edir, staging ünvanına yox.

### 4.4 Skriptlər

`package.json`-a əlavə olunur:

```
"deploy:staging":     "opennextjs-cloudflare build && opennextjs-cloudflare deploy -- --env staging",
"preview:staging":    "opennextjs-cloudflare build && opennextjs-cloudflare preview -- --env staging",
"db:migrate:staging": "wrangler d1 migrations apply luxehome-db-staging --remote",
"db:seed:staging":    "wrangler d1 execute luxehome-db-staging --remote --file=prisma/seed.sql"
```

Mövcud `deploy` skripti `-- --env ""` ilə açıq şəkildə top-level mühitə bağlanır: wrangler
konfiqurasiyada birdən çox mühit görəndə hədəf göstərilməsini tələb edir və göstərilməsə
xəbərdarlıq verib gözlənilməz mühitə deploy edə bilir.

**Bilinən risk:** `opennextjs-cloudflare deploy` bəzi versiyalarda `--env` bayrağını wrangler-ə
ötürməkdə problem çıxarıb (workers-sdk #11741). İcra zamanı ilk staging deploy-dan sonra
`wrangler deployments list --env staging` ilə doğru worker-ə düşdüyü yoxlanılır. Bayraq
işləməzsə ehtiyat plan: ayrıca `wrangler.staging.jsonc` faylı və `--config` bayrağı.

### 4.5 Secret-lər

Staging secret-ləri prod-dan miras qalmır, ayrıca yazılır:

```
wrangler secret put AUTH_SECRET --env staging
wrangler secret put RESEND_API_KEY --env staging
wrangler secret put RESEND_FROM_EMAIL --env staging
wrangler secret put NOTIFICATION_EMAIL --env staging
```

`AUTH_SECRET` staging və prod-da **fərqli** olmalıdır — eyni olsa, staging-də verilmiş sessiya
cookie-si prod-da da etibarlı sayılardı.

`npm run cf-typegen` yenidən işlədilir, `cloudflare-env.d.ts` yenilənir.

---

## 5. Faza 1 — Autentifikasiya

### 5.1 Sxem dəyişiklikləri

`User` modelinə əlavə sahələr:

```prisma
totpSecret         String?    // AES-GCM ilə şifrələnmiş, açıq saxlanılmır
totpEnabledAt      DateTime?  // null = 2FA hələ qurulmayıb
mustChangePassword Boolean  @default(false)
failedAttempts     Int      @default(0)
lockedUntil        DateTime?
```

Üç yeni model:

```prisma
/// Aktiv giriş sessiyaları. Cookie yalnız bu sətrin id-sini daşıyır.
model Session {
  id         String   @id @default(cuid())
  userId     String
  createdAt  DateTime @default(now())
  expiresAt  DateTime
  lastSeenAt DateTime @default(now())
  ip         String?
  userAgent  String?
  revokedAt  DateTime?
  totpCounter Int?    // sessiyanı açan TOTP addımı — təkrar oynatmanın qarşısını alır

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

/// 2FA cihazı itirildikdə istifadə olunan birdəfəlik kodlar (hash-lənmiş).
model BackupCode {
  id       String    @id @default(cuid())
  userId   String
  codeHash String
  usedAt   DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

/// Təhlükəsizlik jurnalı. Uğurlu və uğursuz cəhdlər.
model LoginAttempt {
  id        String   @id @default(cuid())
  email     String
  ip        String?
  success   Boolean
  reason    String?  // BAD_PASSWORD | BAD_TOTP | LOCKED | RATE_LIMITED | OK
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@index([createdAt])
}
```

Miqrasiya `npm run db:migrate:new -- --output migrations/0002_auth.sql` ilə yaradılır.

**D1 xatırlatması:** D1 transaction dəstəkləmir. Giriş axınında bir neçə yazı var
(sessiya yaratmaq + sayğac sıfırlamaq + jurnal yazmaq). Atomarlıq yoxdur, ona görə sıra
əhəmiyyətlidir: əvvəl sessiya yaradılır, sonra sayğac sıfırlanır, jurnal ən sonda yazılır.
Jurnal yazısı uğursuz olsa, giriş yenə də etibarlıdır — jurnal kritik yol deyil.

### 5.2 Parol hash-ı — PBKDF2 (Web Crypto)

`bcryptjs` dependency-lərdən çıxarılır. Saf JavaScript bcrypt Workers-də bir girişə 150–400 ms
CPU yeyir; Web Crypto-nun doğma PBKDF2-si eyni işi bir neçə millisaniyəyə görür.

- Alqoritm: PBKDF2-HMAC-SHA256
- İterasiya: 210 000 (OWASP tövsiyəsi)
- Duz: 16 bayt, `crypto.getRandomValues`
- Açar uzunluğu: 32 bayt
- Saxlanma formatı: `pbkdf2$sha256$210000$<saltBase64>$<hashBase64>`

Format iterasiya sayını özündə daşıyır — gələcəkdə dəyəri artırmaq köhnə hash-ları sındırmır,
istifadəçi növbəti girişində yeni parametrlərlə yenidən hash-lanır.

Müqayisə **sabit vaxtlı** funksiya ilə aparılır — bayt-bayt XOR toplaması, erkən çıxış yoxdur.

Fayl: `src/lib/auth/password.ts` — `hashPassword()`, `verifyPassword()`, `needsRehash()`.

### 5.3 Sessiya

**Model:** stateless JWT deyil, D1-də saxlanan sessiya. Səbəb: sessiyanı dərhal ləğv etmək
imkanı 2FA-lı sistemdə mütləqdir, admin trafiki azdır və bir D1 oxunuşu nəzərə çarpmır.

**Cookie:** `lhe_session`

- Dəyər: jose HS256 JWT, payload `{ sid, uid, role }`, `AUTH_SECRET` ilə imzalanmış
- `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- Sürüşən müddət: 8 saat; hər aktivlikdə `lastSeenAt` yenilənir və müddət uzadılır
- Mütləq son həd: yaradılmadan 7 gün sonra sessiya bitir, uzatma işləmir

JWT-nin rolu **daşımaq deyil, imzalamaqdır** — həqiqi səlahiyyət hər dəfə D1-dən oxunur.
Payload-dakı `role` yalnız middleware-in ucuz ilkin qərarı üçündür.

Fayl: `src/lib/auth/session.ts` — `createSession()`, `readSession()`, `touchSession()`,
`revokeSession()`, `revokeAllSessions(userId)`, `listSessions(userId)`.

### 5.4 İki mərhələli doğrulama (TOTP)

- Kitabxana: `otpauth` (Web Crypto üzərində işləyir, Workers-də dəstəklənir)
- Parametrlər: SHA-1, 6 rəqəm, 30 saniyə pəncərə, ±1 addım tolerantlıq
- QR: `qrcode-svg` ilə server tərəfdə SVG kimi çəkilir. Sirr heç bir kənar servisə göndərilmir
  (Google Charts kimi URL-lərdən qəti istifadə edilmir)

**Sirrin şifrələnməsi.** `totpSecret` bazada açıq saxlanılmır. `AUTH_SECRET`-dən HKDF-SHA256 ilə
ayrıca açar törədilir və sirr AES-GCM (12 baytlıq random IV) ilə şifrələnir. Saxlanma formatı:
`v1$<ivBase64>$<cipherBase64>`. Bazaya oxu icazəsi əldə edən şəxs sirri işlədə bilmir.

**Təkrar istifadə qorunması.** Uğurla işlədilmiş TOTP addımı (`counter`) sessiya yaradılarkən
`Session` sətrinə yazılır və eyni addım ikinci dəfə qəbul edilmir — şəbəkədən tutulmuş kod
30 saniyə ərzində yenidən oynadıla bilməz.

**Backup kodlar.** Qurulum anında 10 ədəd kod yaradılır (`XXXX-XXXX` formatı, crypto random,
kod başına ən azı 40 bit entropiya), istifadəçiyə bir dəfə göstərilir, bazada **SHA-256** ilə
hash-lənmiş saxlanılır. PBKDF2 burada işlədilmir: kodlar istifadəçi seçimi deyil, yüksək
entropiyalı təsadüfi dəyərlərdir, lüğət hücumuna məruz qalmır, 10 kodu PBKDF2 ilə hash-lamaq
isə boş yerə 2 milyon iterasiya CPU deməkdir. Hər kod bir dəfə işləyir. 3 koddan az qalanda
paneldə xəbərdarlıq çıxır.

**Sıfırlama.** SUPER_ADMIN başqa istifadəçinin 2FA-sını sıfırlaya bilir; bu, həmin
istifadəçinin bütün sessiyalarını da ləğv edir. SUPER_ADMIN öz cihazını itirsə, backup kod
yeganə yoldur — ona görə qurulum ekranı kodları saxlamağı açıq tələb edir.

Fayl: `src/lib/auth/totp.ts` — `generateSecret()`, `buildOtpauthUri()`, `verifyTotp()`,
`encryptSecret()`, `decryptSecret()`, `generateBackupCodes()`, `consumeBackupCode()`.

### 5.5 Sürət limiti və hesab kilidi

İki qat, hər ikisi lazımdır:

**a) IP üzrə — Workers `ratelimit` binding-i.** Ucuz, DB-yə toxunmur, bot selini kəsir.

```jsonc
"ratelimits": [
  { "name": "LOGIN_LIMIT",   "namespace_id": "1001", "simple": { "limit": 10, "period": 60 } },
  { "name": "CONTACT_LIMIT", "namespace_id": "1002", "simple": { "limit": 5,  "period": 60 } }
]
```

`period` yalnız `10` və ya `60` ola bilər. Açar: `login:<ip>`. `CONTACT_LIMIT` bu fazada
yalnız elan edilir, əlaqə formuna qoşulması Faza 3-dədir.

**b) Hesab üzrə — D1 kilidi.** IP dəyişdirən hədəflənmiş hücumu kəsir. 5 uğursuz cəhddən sonra
`lockedUntil = now + 15 dəqiqə`. Uğurlu girişdə sayğac sıfırlanır. Kilid aktivləşəndə
hesabın e-poçtuna bildirim göndərilir (Resend, `src/lib/email.ts` üzərindən).

Fayl: `src/lib/auth/rate-limit.ts`.

### 5.6 Qat bölgüsü — middleware vs guard

`src/middleware.ts` **yalnız ucuz yoxlama** aparır:

1. `ADMIN_ENABLED !== "true"` → indiki kimi 404-ə rewrite (davranış dəyişmir)
2. `/admin` marşrutunda `lhe_session` cookie-si yoxdursa və ya JWT imzası etibarsızdırsa →
   `/giris?davam=<yol>` ünvanına yönləndirmə
3. `/giris` marşrutunda etibarlı imza varsa → `/admin`-ə yönləndirmə

Middleware **D1-ə getmir**. Sessiyanın həqiqətən diri olduğu, ləğv edilmədiyi və rolun kifayət
etdiyi `src/app/admin/layout.tsx` içində və **hər server action-ın ilk sətrində** yoxlanılır.

Bu bölgü vacibdir: middleware-də DB oxumaq hər statik asset sorğusuna gizli yük əlavə edərdi;
guard-ı yalnız layout-a qoymaq isə server action-ları açıq qoyardı — action-lar layout-dan
keçmir və birbaşa çağırıla bilər.

Fayl: `src/lib/auth/guard.ts`:

```ts
requireUser(): Promise<AuthUser>                     // sessiya yoxdursa redirect("/giris")
requirePermission(p: Permission): Promise<AuthUser>  // icazə yoxdursa 403
getOptionalUser(): Promise<AuthUser | null>          // yönləndirmədən oxuyur
```

İcazələr `src/lib/constants.ts`-dəki mövcud `ROLE_PERMISSIONS` matrisindən oxunur —
yeni icazə sistemi yazılmır.

### 5.7 Marşrutlar və axın

| Marşrut | Təyinat |
|---|---|
| `/giris` | E-poçt + parol forması |
| `/giris/dogrulama` | TOTP kodu və ya backup kod |
| `/giris/2fa-qurulumu` | QR + kod təsdiqi + backup kodların göstərilməsi |
| `/admin/hesabim` | Parol dəyişmə, 2FA yenidən qurma, aktiv sessiyalar |

Axın:

1. `/giris` → server action `signIn(email, password)`
2. IP limiti yoxlanılır → aşılıbsa generik səhv
3. İstifadəçi tapılır, `isActive` və `lockedUntil` yoxlanılır
4. Parol yoxlanılır. Səhvdirsə `failedAttempts++`, jurnal, generik səhv
5. `totpEnabledAt` null-dursa → 10 dəqiqəlik `stage:"enroll"` ara-cookie-si,
   `/giris/2fa-qurulumu`-na yönləndirmə
6. 2FA aktivdirsə → 5 dəqiqəlik `stage:"totp"` ara-cookie-si, `/giris/dogrulama`-ya yönləndirmə
7. `verifyTwoFactor(code)` → uğurludursa ara-cookie silinir, `Session` yaradılır,
   `lhe_session` verilir, `lastLoginAt` yenilənir, `/admin`-ə yönləndirmə

Ara-cookie (`lhe_2fa`) ayrıca imzalanmış qısa ömürlü JWT-dir və **sessiya deyil** — onunla
`/admin`-ə keçmək mümkün deyil, çünki `stage` sahəsi guard tərəfindən rədd edilir.

**İstifadəçi sayılmasının qarşısı.** Mövcud olmayan e-poçt, səhv parol və deaktiv hesab —
hamısı eyni mesajı qaytarır: «E-poçt və ya parol yanlışdır». Mövcud olmayan e-poçt üçün də
saxta PBKDF2 hesablaması aparılır ki, cavab vaxtı fərqlənməsin.

### 5.8 İlk admin hesabı

`prisma/create-admin.ts` skripti: e-poçt, ad və parolu arqument/env dəyişənindən alır, PBKDF2
hash-ı hesablayır və `INSERT` SQL-i çap edir. SQL `wrangler d1 execute --remote` ilə tətbiq
olunur. Hesab `SUPER_ADMIN` rolu, `mustChangePassword: true` və `totpEnabledAt: null` ilə
yaradılır — ilk girişdə istifadəçi həm parolu dəyişir, həm 2FA qurur.

Parol heç vaxt commit edilmir, heç vaxt jurnal faylına düşmür.

### 5.9 `/giris` səhifəsindəki dəyişikliklər

Mövcud `login-form.tsx` UI-ı saxlanılır, «bu forma heç yerə göndərilmir» xəbərdarlıq bloku
silinir, forma real server action-a bağlanır. `useActionState` ilə səhv mesajı və yüklənmə
vəziyyəti göstərilir. Sağ paneldəki Unsplash şəkli Faza 3-də dəyişəcək — bu fazada toxunulmur.

---

## 6. Test planı

Layihədə test infrastrukturu yoxdur. Auth üçün minimal quraşdırma edilir:
`vitest` + `@cloudflare/vitest-pool-workers` (workerd runtime-ında işləyir, Web Crypto real
davranışı ilə).

Örtüləcək hallar:

1. `hashPassword` → `verifyPassword` dövrü doğru parolu qəbul edir
2. Səhv parol rədd edilir
3. Eyni parol iki dəfə hash-lananda fərqli nəticə verir (duz işləyir)
4. `needsRehash` köhnə iterasiya sayını tanıyır
5. TOTP: doğru kod qəbul edilir
6. TOTP: ±1 addım tolerantlıqdan kənar kod rədd edilir
7. TOTP: eyni addım ikinci dəfə rədd edilir (təkrar oynatma)
8. Sirr şifrələnib açılanda ilkin dəyəri verir
9. Backup kod bir dəfə işləyir, ikinci dəfə rədd edilir
10. Sessiya `expiresAt`-dan sonra etibarsızdır
11. Ləğv edilmiş sessiya dərhal etibarsızdır
12. 7 günlük mütləq həddən sonra uzatma işləmir
13. `ROLE_PERMISSIONS`: EDITOR `property:manage` ala bilmir
14. `ROLE_PERMISSIONS`: SUPER_ADMIN bütün icazələri alır
15. 5 uğursuz cəhddən sonra hesab kilidlənir, 6-cı cəhd doğru parolla da rədd edilir

`npm run test` skripti əlavə olunur. Mövcud keyfiyyət qapısı (`typecheck` + `build`) qüvvədə qalır.

## 7. Əl ilə yoxlama siyahısı (staging-də)

- [ ] `luxehomeestate.az` dəyişməyib, köhnə versiya işləyir
- [ ] Staging ünvanı açılır, `ADMIN_ENABLED=true`
- [ ] Staging `robots.txt` hər şeyi qadağan edir
- [ ] Staging səhifələrinin HTML-ində `noindex` meta var, canonical prod domenə işarə edir
- [ ] Staging D1-də prod məlumatı yoxdur (ayrı bazadır)
- [ ] Cookie olmadan `/admin` → `/giris`-ə yönləndirir
- [ ] Səhv parol generik mesaj verir, hesabın varlığını açmır
- [ ] 6-cı səhv cəhd kilidlə qarşılanır və e-poçt bildirişi gəlir
- [ ] İlk girişdə 2FA qurulumu məcburi çıxır, QR skan olunur
- [ ] Backup kodla giriş işləyir, həmin kod ikinci dəfə işləmir
- [ ] `/admin/hesabim`-dan sessiya ləğv ediləndə həmin brauzer dərhal çıxarılır
- [ ] EDITOR rolu ilə əmlak səhifəsi 403 verir
- [ ] Çıxış düyməsi sessiyanı bazadan silir, cookie təmizlənir

## 8. Yayım ardıcıllığı

1. Staging resursları yaradılır, `env.staging` yazılır, miqrasiya tətbiq olunur
2. Auth kodu yazılır, testlər keçir, `typecheck` + `build` təmizdir
3. `npm run deploy:staging` — yalnız staging worker yenilənir
4. Yuxarıdakı siyahı staging-də əl ilə yoxlanılır
5. Prod-a **yalnız kod** gedir; prod `ADMIN_ENABLED` **`false` qalır**. Panel Faza 2 bitənə
   qədər canlı domendə açılmır — yarımçıq CRUD-un real bazaya çıxışı olmamalıdır

## 9. Risklər

| Risk | Təsir | Tədbir |
|---|---|---|
| `opennextjs-cloudflare` `--env` bayrağını ötürmür | Staging əvəzinə prod-a deploy | İlk deploy-dan sonra `wrangler deployments list --env staging` ilə yoxlama; ehtiyat: ayrıca config faylı |
| `otpauth` və ya `qrcode-svg` Workers bundle-ında qırılır | 2FA qurulumu işləmir | `npm run preview` ilə workerd runtime-ında erkən yoxlama |
| D1-də transaction yoxdur, giriş axını yarımçıq qalır | Sessiya yaranıb sayğac sıfırlanmaya bilər | Yazı sırası kritiklik üzrə düzülüb; jurnal ən sonda |
| Staging Google tərəfindən indeksləndi | Prod SEO zərəri | `robots.ts` + `noindex` + prod canonical, üç qat |
| `AUTH_SECRET` itirilir | Bütün sessiyalar və TOTP sirləri işlənməz olur | Secret Cloudflare-də saxlanılır; itirilsə istifadəçilər yenidən 2FA qurur — bərpa yolu sənədləşdirilib |

## 10. Qərar jurnalı

| Qərar | Alternativ | Səbəb |
|---|---|---|
| D1 sessiya | Stateless JWT | Dərhal ləğv imkanı; admin trafiki az, DB oxunuşu ucuz |
| PBKDF2 (Web Crypto) | `bcryptjs` | Saf JS bcrypt Workers-də 150–400 ms CPU yeyir |
| Məcburi TOTP | Könüllü 2FA | Panel real əmlak inventarını idarə edir; tək parol kifayət deyil |
| İki qatlı limit | Yalnız IP limiti | IP dəyişən hədəflənmiş hücumu yalnız hesab kilidi kəsir |
| Middleware yalnız imza yoxlayır | Middleware-də tam sessiya yoxlaması | Hər sorğuya D1 oxunuşu əlavə etməmək; guard action səviyyəsində daha etibarlıdır |
| `SITE_URL` (runtime) | `NEXT_PUBLIC_SITE_URL` (build) | Bir build ilə iki mühitə yayım |
