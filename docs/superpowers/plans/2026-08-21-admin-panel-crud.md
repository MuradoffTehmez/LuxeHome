# Faza 2 — Admin panelin tam CRUD-u

Son yenilənmə: 21 avqust 2026.

Faza 1 (staging mühiti + autentifikasiya) kod səviyyəsində tamamlanıb: PBKDF2 parol,
məcburi TOTP 2FA, D1-də saxlanan ləğv edilə bilən sessiyalar, `requirePermission()` RBAC,
iki laylı sürət limiti. Bu plan növbəti mərhələni — panelin real məlumatla işləyən
CRUD qatını — əhatə edir.

## Prinsiplər

- Hər server action ilk sətrində `requirePermission()` çağırır. Layout guard-ı action-ları
  örtmür: action birbaşa POST ilə çağırıla bilər.
- Yazma əməliyyatları `useActionState` ilə işləyən Server Action-lardır; ayrıca API qatı yalnız
  fayl yükləmə üçün açılır (multipart body Server Action üçün əlverişsizdir).
- Validasiya `zod` ilə `src/lib/admin/schemas.ts` faylında mərkəzləşir. Status/rol sətirləri
  yalnız `src/lib/constants.ts`-dən gəlir.
- D1 transaction dəstəkləmir — çoxsətirli yazılışlar ardıcıl sorğulara bölünür və sıra
  elə seçilir ki, yarımçıq qalan halda qeyd yararsız vəziyyətdə qalmasın.
- Silmə həmişə soft delete (`deletedAt`) ilə gedir; `Lead` istisnadır (sahə yoxdur).
- İctimai səhifələr `force-dynamic` olduğundan `revalidatePath` yalnız sitemap və ISR
  keşi üçün lazım olan yerlərdə çağırılır.

## Tasklar

### Task 1 — Ortaq bünövrə
`src/lib/admin/` qovluğu: `action-result.ts` (birləşdirilmiş `ActionState` tipi),
`schemas.ts` (zod), `slug.ts` (unikal slug generatoru — mövcud `slugify()` üzərində),
`form.ts` (FormData → tip çevirici köməkçilər).
`src/components/admin/` içində: `form-shell.tsx` (sticky saxla/ləğv et paneli),
`submit-button.tsx` (`useFormStatus`), `delete-button.tsx` (təsdiq modalı ilə),
`admin-pagination.tsx`.

### Task 2 — Media yükləmə (R2)
`POST /api/admin/media` — `requirePermission("media:manage")`, MIME və ölçü yoxlaması,
R2-yə yazma, `Media` sətrinin yaradılması.
`GET /media/[...key]` — R2-dən oxuyan serving route (bucket-ın public domeni hələ yoxdur).
`ImageDropzone` real yükləməyə bağlanır və seçilmiş şəkilləri gizli input ilə forma ötürür.

### Task 3 — Əmlak CRUD
Siyahı: real filtr + səhifələmə (`getAdminProperties` yenidən yazılır).
`/admin/emlaklar/yeni` və `/admin/emlaklar/[id]`: tam forma (qiymət, yerləşmə, otaq,
sahə, təmir, sənəd, xüsusiyyətlər, şəkillər, SEO).
Action-lar: yarat, yenilə, statusu dəyiş, tövsiyə et, sil (soft), bərpa et.

### Task 4 — Müraciətlər (Lead)
Siyahı + status filtri, detal paneli, status dəyişmə, admin qeydi, məsul şəxs təyini,
silmə. Yeni müraciət sayğacı sidebar-dakı badge ilə uyğun gəlir.

### Task 5 — Bloq CRUD
Yazılar (`BlogPost`) və kateqoriyalar (`BlogCategory`). `ContentEditor` real sahəyə bağlanır,
`readingMinutes()` avtomatik hesablanır, dərc tarixi status dəyişəndə qoyulur.

### Task 6 — Layihələr CRUD
`Project` + `ProjectImage`. `highlights` və `timeline` JSON massivləri üçün sadə sətir siyahısı
redaktoru.

### Task 7 — Xidmətlər CRUD
`Service` — sıra, aktivlik, `bullets` JSON massivi, ikon seçimi.

### Task 8 — Media kitabxanası
`/admin/media` — yüklənmiş faylların siyahısı, alt mətn redaktəsi, silmə (R2 + DB).

### Task 9 — İstifadəçilər
`/admin/istifadeciler` — yalnız `user:manage`. Yaratma (müvəqqəti parol),
rol dəyişmə, deaktiv etmə, 2FA sıfırlama, sessiyaların ləğvi.

### Task 10 — Parametrlər
`/admin/parametrler` — `Setting` modeli üzərində açar/dəyər redaktəsi (əlaqə məlumatları,
sosial şəbəkələr, SEO defolt mətnləri).

### Task 11 — Detallı elan axtarışı (ictimai sayt)
`emlaklar/page.tsx` hazırda `queries.ts`-in dəstəklədiyi filtrlərin hamısını ötürmür.
Əlavə ediləcək: xüsusiyyət filtri (`featureSlugs`, çoxseçimli), tikili növü (yeni/köhnə),
ipoteka və taksit, mərtəbə aralığı, metro/qəsəbə üzrə seçim, otaq aralığı,
«yalnız şəkilli elanlar» və nəticə sayının filtr başlıqlarında göstərilməsi.
Filtr vəziyyəti yenə yalnız URL query parametrlərində saxlanılır.

### Task 12 — Panel üçün təhlükəsizlik tədbirləri
Redaktorların işlədiyi bütün səthlərin sərtləşdirilməsi:

- Origin/Sec-Fetch yoxlaması ilə CSRF qoruması (server action-lar üçün mərkəzi guard).
- Bütün yazma action-larında `requirePermission()` + obyekt sahibliyi yoxlaması.
- Fayl yükləmədə MIME + ölçü + fayl imzası (magic bytes) yoxlaması, təhlükəsiz açar adı.
- Blog kontentində XSS qarşısının alınması (HTML sanitizasiyası və ya yalnız mətn/markdown).
- Panel cavablarında sərt təhlükəsizlik başlıqları (CSP, X-Frame-Options, Referrer-Policy,
  Permissions-Policy) və `noindex`.
- Audit jurnalı: kim, nə vaxt, hansı qeydi dəyişdi.
- Admin yazma əməliyyatlarına sürət limiti.
- Sessiya siyahısında şübhəli cihazın ləğvi və parol dəyişəndə bütün sessiyaların bağlanması.

## Keyfiyyət qapısı

Hər taskdan sonra: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.
