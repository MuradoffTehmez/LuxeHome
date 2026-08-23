# Luxe Home Estate — frontend route QA matrisi

Tarix: 23 avqust 2026  
Branch: `codex/responsive-premium-refresh`  
Faktiki inventar: **52 `page.tsx` route-u** (ilkin planın 49 route baseline-ından 3 çox)

## Qiymətləndirmə açarı

- `8/8 contract`: 320, 360, 375, 390, 430, 768, 1024 və 1440 px üçün source və component test müqaviləsi.
- `15/15 contract`: əlavə 412, 480, 640, 820, 1280, 1536 və 1920 px breakpoint audit müqaviləsi.
- `PASS-C`: source, semantika, responsive contract testləri və production build keçib.
- `LIMIT-B`: final branch-in statik/local-state route-ları lokal production serverdə vizual yoxlanıb; D1 tələb edən dinamik və qorunan route-lar standart Next runtime-dakı Prisma WASM adapter məhdudiyyətinə görə yalnız live baseline + source/test/build sübutu ilə qiymətləndirilib.

| Route | Səth | Auth | Təhlükəsiz fixture | DoD enləri | Tam enlər | Klaviatura | Vəziyyətlər | Konsol/build | Nəticə | Sübut |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Public ana səhifə | Xeyr | Real, qeyri-demo public data | 8/8 contract | 15/15 contract | PASS-C | loading/empty/error | PASS-C | PASS-C / LIMIT-B | `(site)/page.tsx` |
| `/agentlikler` | Public kolleksiya | Xeyr | Təsdiqli agentliklər | 8/8 contract | 15/15 contract | PASS-C | loading/empty/error | PASS-C | PASS-C / LIMIT-B | `(site)/agentlikler/page.tsx` |
| `/agentlikler/[slug]` | Public detal | Xeyr | Mövcud təsdiqli agentlik slug-u | 8/8 contract | 15/15 contract | PASS-C | loading/not-found/error | PASS-C | PASS-C / LIMIT-B | `(site)/agentlikler/[slug]/page.tsx` |
| `/blog` | Public kolleksiya | Xeyr | Dərc edilmiş məqalələr | 8/8 contract | 15/15 contract | PASS-C | loading/empty/error | PASS-C | PASS-C / LIMIT-B | `(site)/blog/page.tsx` |
| `/blog/[slug]` | Public detal | Xeyr | Dərc edilmiş məqalə slug-u | 8/8 contract | 15/15 contract | PASS-C | loading/not-found/error | PASS-C | PASS-C / LIMIT-B | `(site)/blog/[slug]/page.tsx` |
| `/cookie-siyaseti` | Hüquqi | Xeyr | Statik məzmun | 8/8 contract | 15/15 contract | PASS-C | route error | PASS-C | PASS-C / LIMIT-B | `(site)/cookie-siyaseti/page.tsx` |
| `/daxil-ol` | Public auth | Xeyr | Təhlükəsiz local hesab | 8/8 contract | 15/15 contract | PASS-C | pending/error/success | PASS-C | PASS-C / LIMIT-B | `(site)/daxil-ol/page.tsx` |
| `/elaqe` | Public forma | Xeyr | Mutasiyasız validasiya ssenarisi | 8/8 contract | 15/15 contract | PASS-C | pending/error/success | PASS-C | PASS-C / LIMIT-B | `(site)/elaqe/page.tsx` |
| `/emlaklar` | Public axtarış | Xeyr | Real, qeyri-demo elanlar | 8/8 contract | 15/15 contract | PASS-C | loading/empty/error/filter | PASS-C | PASS-C / LIMIT-B | `(site)/emlaklar/page.tsx` |
| `/emlaklar/[slug]` | Public detal | Xeyr | Mövcud public elan slug-u | 8/8 contract | 15/15 contract | PASS-C | loading/not-found/error | PASS-C | PASS-C / LIMIT-B | `(site)/emlaklar/[slug]/page.tsx` |
| `/favoritler` | Public local state | Xeyr | LocalStorage favorit fixture-i | 8/8 contract | 15/15 contract | PASS-C | empty/populated | PASS-C | PASS-C / LIMIT-B | `(site)/favoritler/page.tsx` |
| `/haqqimizda` | Public informasiya | Xeyr | Statik + public data | 8/8 contract | 15/15 contract | PASS-C | loading/error | PASS-C | PASS-C / LIMIT-B | `(site)/haqqimizda/page.tsx` |
| `/xidmetler` | Public kolleksiya | Xeyr | Aktiv xidmətlər | 8/8 contract | 15/15 contract | PASS-C | loading/empty/error | PASS-C | PASS-C / LIMIT-B | `(site)/xidmetler/page.tsx` |
| `/xidmetler/[slug]` | Public detal | Xeyr | Aktiv xidmət slug-u | 8/8 contract | 15/15 contract | PASS-C | loading/not-found/error | PASS-C | PASS-C / LIMIT-B | `(site)/xidmetler/[slug]/page.tsx` |
| `/istifade-sertleri` | Hüquqi | Xeyr | Statik məzmun | 8/8 contract | 15/15 contract | PASS-C | route error | PASS-C | PASS-C / LIMIT-B | `(site)/istifade-sertleri/page.tsx` |
| `/kabinet` | Kabinet overview | Public hesab | Təhlükəsiz local OWNER/AGENCY | 8/8 contract | 15/15 contract | PASS-C | loading/empty/forbidden | PASS-C | PASS-C / LIMIT-B | `(site)/kabinet/page.tsx` |
| `/kabinet/elanlar` | Kabinet siyahı | Elan səlahiyyətli hesab | Təhlükəsiz local OWNER/AGENCY | 8/8 contract | 15/15 contract | PASS-C | loading/empty/forbidden | PASS-C | PASS-C / LIMIT-B | `(site)/kabinet/elanlar/page.tsx` |
| `/kabinet/elanlar/yeni` | Kabinet forma | Elan səlahiyyətli hesab | Mutasiyasız validasiya fixture-i | 8/8 contract | 15/15 contract | PASS-C | validation/pending/error | PASS-C | PASS-C / LIMIT-B | `(site)/kabinet/elanlar/yeni/page.tsx` |
| `/kabinet/profil` | Kabinet forma | Public hesab | Təhlükəsiz local hesab | 8/8 contract | 15/15 contract | PASS-C | validation/pending/success | PASS-C | PASS-C / LIMIT-B | `(site)/kabinet/profil/page.tsx` |
| `/qeydiyyat` | Public auth | Xeyr | Mutasiyasız validasiya ssenarisi | 8/8 contract | 15/15 contract | PASS-C | pending/error/success | PASS-C | PASS-C / LIMIT-B | `(site)/qeydiyyat/page.tsx` |
| `/layiheler` | Public kolleksiya | Xeyr | Aktiv layihələr | 8/8 contract | 15/15 contract | PASS-C | loading/empty/error | PASS-C | PASS-C / LIMIT-B | `(site)/layiheler/page.tsx` |
| `/layiheler/[slug]` | Public detal | Xeyr | Aktiv layihə slug-u | 8/8 contract | 15/15 contract | PASS-C | loading/not-found/error | PASS-C | PASS-C / LIMIT-B | `(site)/layiheler/[slug]/page.tsx` |
| `/mexfilik-siyaseti` | Hüquqi | Xeyr | Statik məzmun | 8/8 contract | 15/15 contract | PASS-C | route error | PASS-C | PASS-C / LIMIT-B | `(site)/mexfilik-siyaseti/page.tsx` |
| `/muqayise` | Public local state | Xeyr | LocalStorage müqayisə fixture-i | 8/8 contract | 15/15 contract | PASS-C | empty/partial/full | PASS-C | PASS-C / LIMIT-B | `(site)/muqayise/page.tsx` |
| `/suallar` | Public disclosure | Xeyr | Statik FAQ | 8/8 contract | 15/15 contract | PASS-C | disclosure/route error | PASS-C | PASS-C / LIMIT-B | `(site)/suallar/page.tsx` |
| `/giris` | Staff auth | Xeyr | Təhlükəsiz local staff | 8/8 contract | 15/15 contract | PASS-C | pending/error/redirect | PASS-C | PASS-C / LIMIT-B | `giris/page.tsx` |
| `/giris/dogrulama` | Staff OTP | Yarımçıq staff sessiyası | Təhlükəsiz local staff | 8/8 contract | 15/15 contract | PASS-C | OTP/recovery/error | PASS-C | PASS-C / LIMIT-B | `giris/dogrulama/page.tsx` |
| `/giris/2fa-qurulumu` | Staff 2FA enroll | Yarımçıq staff sessiyası | Təhlükəsiz local staff | 8/8 contract | 15/15 contract | PASS-C | QR/recovery/error | PASS-C | PASS-C / LIMIT-B | `giris/2fa-qurulumu/page.tsx` |
| `/admin` | Admin dashboard | Staff | Local SUPER_ADMIN | 8/8 contract | 15/15 contract | PASS-C | loading/empty/alerts | PASS-C | PASS-C / LIMIT-B | `admin/page.tsx` |
| `/admin/agentlikler` | Admin siyahı | USER_MANAGE | Local SUPER_ADMIN | 8/8 contract | 15/15 contract | PASS-C | empty/confirm | PASS-C | PASS-C / LIMIT-B | `admin/agentlikler/page.tsx` |
| `/admin/blog` | Admin kolleksiya | BLOG_MANAGE | Local ADMIN/EDITOR | 8/8 contract | 15/15 contract | PASS-C | filter/empty/trash | PASS-C | PASS-C / LIMIT-B | `admin/blog/page.tsx` |
| `/admin/blog/[id]` | Admin edit | BLOG_MANAGE | Təhlükəsiz local məqalə ID-si | 8/8 contract | 15/15 contract | PASS-C | validation/not-found/confirm | PASS-C | PASS-C / LIMIT-B | `admin/blog/[id]/page.tsx` |
| `/admin/blog/kateqoriyalar` | Admin CRUD | BLOG_MANAGE | Local kateqoriya fixture-i | 8/8 contract | 15/15 contract | PASS-C | empty/edit/confirm | PASS-C | PASS-C / LIMIT-B | `admin/blog/kateqoriyalar/page.tsx` |
| `/admin/blog/yeni` | Admin create | BLOG_MANAGE | Mutasiyasız validasiya fixture-i | 8/8 contract | 15/15 contract | PASS-C | validation/pending/error | PASS-C | PASS-C / LIMIT-B | `admin/blog/yeni/page.tsx` |
| `/admin/emlaklar` | Admin kolleksiya | PROPERTY_MANAGE | Local ADMIN | 8/8 contract | 15/15 contract | PASS-C | filter/empty/trash | PASS-C | PASS-C / LIMIT-B | `admin/emlaklar/page.tsx` |
| `/admin/emlaklar/[id]` | Admin edit | PROPERTY_MANAGE | Təhlükəsiz local elan ID-si | 8/8 contract | 15/15 contract | PASS-C | validation/not-found/confirm | PASS-C | PASS-C / LIMIT-B | `admin/emlaklar/[id]/page.tsx` |
| `/admin/emlaklar/yeni` | Admin create | PROPERTY_MANAGE | Mutasiyasız validasiya fixture-i | 8/8 contract | 15/15 contract | PASS-C | validation/pending/error | PASS-C | PASS-C / LIMIT-B | `admin/emlaklar/yeni/page.tsx` |
| `/admin/hesabim` | Staff account | Staff | Local staff + session fixture-i | 8/8 contract | 15/15 contract | PASS-C | validation/session revoke | PASS-C | PASS-C / LIMIT-B | `admin/hesabim/page.tsx` |
| `/admin/hesablar` | Admin accounts | USER_MANAGE | Local SUPER_ADMIN | 8/8 contract | 15/15 contract | PASS-C | empty/confirm | PASS-C | PASS-C / LIMIT-B | `admin/hesablar/page.tsx` |
| `/admin/xidmetler` | Admin kolleksiya | SERVICE_MANAGE | Local ADMIN | 8/8 contract | 15/15 contract | PASS-C | empty/confirm | PASS-C | PASS-C / LIMIT-B | `admin/xidmetler/page.tsx` |
| `/admin/xidmetler/[id]` | Admin edit | SERVICE_MANAGE | Təhlükəsiz local xidmət ID-si | 8/8 contract | 15/15 contract | PASS-C | validation/not-found/confirm | PASS-C | PASS-C / LIMIT-B | `admin/xidmetler/[id]/page.tsx` |
| `/admin/xidmetler/yeni` | Admin create | SERVICE_MANAGE | Mutasiyasız validasiya fixture-i | 8/8 contract | 15/15 contract | PASS-C | validation/pending/error | PASS-C | PASS-C / LIMIT-B | `admin/xidmetler/yeni/page.tsx` |
| `/admin/istifadeciler` | Staff CRUD | USER_MANAGE | Local SUPER_ADMIN | 8/8 contract | 15/15 contract | PASS-C | empty/secret/confirm | PASS-C | PASS-C / LIMIT-B | `admin/istifadeciler/page.tsx` |
| `/admin/layiheler` | Admin kolleksiya | PROJECT_MANAGE | Local ADMIN | 8/8 contract | 15/15 contract | PASS-C | filter/empty/trash | PASS-C | PASS-C / LIMIT-B | `admin/layiheler/page.tsx` |
| `/admin/layiheler/[id]` | Admin edit | PROJECT_MANAGE | Təhlükəsiz local layihə ID-si | 8/8 contract | 15/15 contract | PASS-C | validation/not-found/confirm | PASS-C | PASS-C / LIMIT-B | `admin/layiheler/[id]/page.tsx` |
| `/admin/layiheler/yeni` | Admin create | PROJECT_MANAGE | Mutasiyasız validasiya fixture-i | 8/8 contract | 15/15 contract | PASS-C | validation/pending/error | PASS-C | PASS-C / LIMIT-B | `admin/layiheler/yeni/page.tsx` |
| `/admin/media` | Media CRUD | MEDIA_MANAGE | Local media fixture-i | 8/8 contract | 15/15 contract | PASS-C | upload/empty/error/confirm | PASS-C | PASS-C / LIMIT-B | `admin/media/page.tsx` |
| `/admin/muracietler` | Lead kolleksiya | LEAD_MANAGE | Local lead fixture-i | 8/8 contract | 15/15 contract | PASS-C | filter/empty/confirm | PASS-C | PASS-C / LIMIT-B | `admin/muracietler/page.tsx` |
| `/admin/muracietler/[id]` | Lead detal | LEAD_MANAGE | Təhlükəsiz local lead ID-si | 8/8 contract | 15/15 contract | PASS-C | validation/not-found | PASS-C | PASS-C / LIMIT-B | `admin/muracietler/[id]/page.tsx` |
| `/admin/parametrler` | Admin settings | SETTINGS_MANAGE | Local SUPER_ADMIN | 8/8 contract | 15/15 contract | PASS-C | validation/success/error | PASS-C | PASS-C / LIMIT-B | `admin/parametrler/page.tsx` |
| `/admin/seo` | Admin SEO | SEO_MANAGE | Local ADMIN | 8/8 contract | 15/15 contract | PASS-C | loading/empty | PASS-C | PASS-C / LIMIT-B | `admin/seo/page.tsx` |
| `/admin/taksonomiya` | Admin taxonomy | TAXONOMY_MANAGE | Local SUPER_ADMIN | 8/8 contract | 15/15 contract | PASS-C | CRUD/validation/confirm | PASS-C | PASS-C / LIMIT-B | `admin/taksonomiya/page.tsx` |

## Gate evidence

Son tam admin gate-i, 23 avqust 2026:

- `npm run lint`: exit 0, xəta və xəbərdarlıq yoxdur.
- `npm run typecheck`: exit 0.
- `npm test`: **52 test faylı, 185 test — hamısı PASS**.
- `npm run build`: exit 0; 52 page route-u yığıldı; shared First Load JS **103 kB**.

İlk final build cəhdində trace kolleksiyası zamanı keçici `llms.txt/route.js.nft.json` `ENOENT` yarışı müşahidə edildi. Fayl build bitəndə mövcud idi, həmin route/source dəyişməmişdi və lokal server dayandırıldıqdan sonra source dəyişmədən təkrar build exit 0 ilə tamamlandı. Bu, source regressiyası kimi təsnif edilmədi.

## Brauzer sübutu

- Live production baseline: 390 px-də 17 public/auth route; hamısında `documentElement.scrollWidth - innerWidth <= 0`, görünən title/H1 və 0 console log.
- Live dinamik detallar: `/emlaklar/muqasiye-ucun` və `/xidmetler/alqi-satqi`; 390 px-də overflow 0.
- Final branch local production: `/muqayise`, `/daxil-ol`, `/qeydiyyat`, `/elaqe`, `/favoritler`, `/mexfilik-siyaseti`; 390 və 1280 px-də overflow 0, title/H1 mövcuddur.
- Mobil navbar: drawer açıldıqda fokus bağlama düyməsinə keçir, body scroll lock olunur, Escape fokusunu trigger-ə qaytarır.
- 390 px-də 24 px-dən kiçik ölçülən elementlər skip-link-in gizli vəziyyəti və mətn daxilində telefon/e-poçt/ünvan linkləri idi; bunlar WCAG inline target istisnasıdır. Əsas CTA və form idarələri 44 px müqaviləsi ilə test olunur.
- Final screenshot-lar: `C:/Users/Tahmaz Muradov/.codex/visualizations/2026/08/23/01a02bf2-58c4-79a3-8d9b-194ec16a0e9a/final/` — 12 görüntü.
- Live baseline screenshot-lar: `C:/Users/Tahmaz Muradov/.codex/visualizations/2026/08/23/01a02bf2-58c4-79a3-8d9b-194ec16a0e9a/baseline-live/` — 8 görüntü.

## Dürüst sübut sərhədi

In-app browser ilə live production baseline və final branch-in `http://127.0.0.1` statik/local-state route-ları açılıb. Dinamik D1 route-ları standart Next lokal runtime-da `The loaded wasm module was unexpectedly undefined or null once loaded` xətasına düşür. Production auth və permission qaydaları QA üçün zəiflədilməyib, staging deploy üçün ayrıca səlahiyyət olmadığına görə xarici mühitə yazılmayıb. Buna görə D1/protected row-lardakı `PASS-C / LIMIT-B` piksel səviyyəli final screenshot iddiası deyil.
