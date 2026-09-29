# Cari vəziyyət və yol xəritəsi

Bu səhifə 29 sentyabr 2026 tarixində `main@199f8409` kod auditi, 173 test faylındakı 889 Vitest testi, 190 Playwright test icrası və uğurlu CI/CD run-u (`36505908266`) əsasında hazırlanıb. Prioritetlər faktiki boşluğu göstərir; buradakı maddə avtomatik olaraq təsdiqlənmiş məhsul planı demək deyil.

**Uzunmüddətli hədəf (25 avqust 2026 qərarı):** hər iki PRD sənədinin (`docs/`) tam (100%) koda köçürülməsi. İş ardıcıl, kiçik və təsdiqlənən addımlarla gedir.

## Hazırlıq matrisi

| Sahə | Vəziyyət | Qeyd |
|---|---:|---|
| Production sayt | ✅ İşlək | AZ/EN/RU public route-lar; kənar HTML keşi (anonim ziyarətçi üçün ≤60 s gecikmə) |
| Əmlak kataloqu | ✅ İşlək | Geniş filtr, sort, siyahı/xəritə, xəritədə sahə, metro, nişangah, boş nəticə təklifləri |
| Ərazi bölgüsü | ✅ İşlək | 4 337 yer: rəsmi kodlu 75 şəhər/rayon, 266 qəsəbə, 3 605 kənd; 136 massiv, 27 metro, 214 nişangah; ~63 000 rəsmi küçə təklifi |
| Elan detalı | ✅ İşlək | Lightbox qalereya, plan, 360° tur, qiymət göstəricisi, açıq qapı, rezervasiya, OG kartı |
| Favorit / müqayisə | ✅ İşlək | Hesabla sinxron favorit; cookie əsaslı müqayisə, maksimum 4 |
| Layihə / mənzil şahmatı | ✅ İşlək | Yaşayış kompleksləri, `ProjectUnit` şahmatı; bölmə admin açarı ilə gizlədilə bilir |
| Tərəfdaş, agentlik, agent | ✅ İşlək | Kataloqlar, profillər, rəylər, verification, toplu əməliyyatlar |
| Public auth | ✅ İşlək | Parol + Turnstile, e-poçt təsdiqi, parol bərpası; Google və telefon OTP konfiqurasiyadan asılı |
| Public kabinet | ✅ İşlək | Elan sehrbazı, müddət/yeniləmə, paketlər, rezervasiya, bildiriş, data ixracı, iki mərhələli silinmə |
| Staff auth | ✅ İşlək | TOTP (məcburi), passkey (alternativ), backup kod, lockout, sessiya |
| Admin panel | ✅ İşlək | Kontent, CRM lövhəsi, huni, idxal, paketlər, təqvim, SERP, AI, tərcümə, sistem rejimi |
| Admin dili | ✅ İşlək | AZ/EN/RU, `User.locale`; kataloq parity testi |
| Media | ✅ İşlək | R2 + Images, su nişanı (təkrar nişan aşkarlanır), toplu yükləmə növbəsi və retry |
| Lead/əlaqə | ✅ İşlək | D1 + Resend + Telegram, honeypot, same-origin, IP limit, Turnstile |
| SEO / SERP | ✅ İşlək | Metadata, JSON-LD, hreflang, sitemap index, SERP mərkəzi, avtomatik SEO/ALT |
| Bilik Mərkəzi | ✅ İşlək | Bələdçi, lüğət, CMS FAQ, kalkulyator, istinadlı AI məsləhətçi |
| AI | ✅ İşlək | Workers AI axtarışı, semantik axtarış (Vectorize), foto məsləhətçisi (Mistral Small 3.1) |
| Web Push | ✅ İşlək | Abunə, kanal seçimləri, sakit saatlar |
| Sistem rejimləri | ✅ İşlək | `NORMAL` / `MAINTENANCE` (503) / `READ_ONLY` |
| Nümunə məzmun | ✅ İşlək | Staging-də açıq, production-da bağlı; `isDemo` qeydləri heç vaxt dəyişmir |
| Test | ✅ İşlək | 173 fayl / 889 test (workerd + Node + real miniflare D1 integration) |
| Browser E2E | ✅ İşlək | 15 spec + setup / 190 test icrası; PR-da lokal stack, `main`-də staging qapısı |
| CI/CD | ✅ Avtomatik | quality → deploy-staging → e2e-staging → deploy-production, miqrasiyalar bundle-dan əvvəl |
| Asılılıq idarəsi | ✅ İşlək | Dependabot (həftəlik qruplar), dependency review, CodeQL, `npm audit --audit-level=high` |
| E-poçt əməliyyatları | 🟡 Konfiqurasiya | Webhook hazırdır; production Resend secret/endpoint təsdiqi tələb edir |
| Ödəniş provayderi | 🟡 Qərar | Qəsdən yoxdur — ödəniş ofisdə/köçürmə ilə alınır, paneldə qeyd olunur |
| Backup/DR | 🔴 Yoxdur | Avtomatlaşdırılmış D1 export/restore drill yoxdur |

## Sentyabr 2026-da tamamlanan mərhələlər

### Keyfiyyət və çatdırılma infrastrukturu

- **Browser E2E (2 sentyabr):** Playwright dəsti canlı workerd mühitinə qarşı işləyir (`next dev` hədəf deyil — Prisma wasm engine orada yüklənmir). İki real baq tapdı: `not-found.tsx` AZ üçün locale prefiksi vermirdi və `--color-ink-muted` 4.47:1 kontrastda idi.
- **PR-da `Local stack E2E` (#87/#88):** bundle lokal workerd-də real D1/R2 ilə qaldırılır; admin TOTP addımından real keçir (test bypass-ı qəsdən yoxdur).
- **Real D1 integration testləri (#85/#86):** D1-in 100 bound parametr həddi və nested relation problemləri üçün `*.integration.test.ts`.
- **Avtomatik yayım:** `main` push-unda hər deploy job-u öz D1 miqrasiyalarını bundle-dan əvvəl tətbiq edir.
- **GitHub governance:** CODEOWNERS, labeler, issue formaları, branch/commit konvensiyaları (`docs/github-governance.md`).
- **Knip** dead-code yoxlaması keyfiyyət qapısına əlavə olundu.

### Platforma və təhlükəsizlik

- **Maintenance və READ_ONLY rejimi (#36, #41).**
- **Təhlükəsizlik auditinin bağlanması (#61, #63):** e-poçt şablonlarında HTML kodlaması, `TILE_LIMIT`, `AI_LIMIT`, əlaqə formasında sahə hədləri, push endpoint validasiyası, CodeQL xəbərdarlıqları.
- **Rəsmi yerləşmə ağacı (#68, #75):** 2024 İnzibati Ərazi Bölgüsü Təsnifatı; ağac D1 parametr həddinə sığdırıldı.
- **Next.js 16.3 keçidi (#77)** — webpack build saxlanılır.
- **i18n (#82, #90):** admin server mesajları və xam JSX mətni kataloqa köçdü.
- **Toplu şəkil yükləmə (#80):** növbə, retry və brauzerdə kiçiltmə.
- **Dizayn yenilənməsi (#95, #102):** radius şkalası, `card-surface`, `on-image-chip`, 49 səhifə × 18 viewport responsive auditi.

### Yol xəritəsi — 4 mərhələ (27 sentyabr)

| Mərhələ | Əsas imkanlar |
|---|---|
| 1 (#103/#104) | Boş bölmələrin gizlədilməsi + sahib bloku, CSV idxalı, kart siqnalları, Telegram lead bildirişi, PWA manifest, elan OG kartı, boş axtarış təklifləri, sayt şəkilləri paneldən |
| 2 (#105/#106) | Qiymət göstəricisi, `/emlakimi-sat` + onlayn qiymətləndirmə, müraciət lövhəsi, konversiya hunisi, kənar HTML keşi, Cloudflare Web Analytics |
| 3 (#107/#108) | Plan və 360° tur, mobil alt naviqasiya, metro məsafəsi və filtri, hissə-hissə kalkulyator, `/investisiya`, xəritədə sahə, mənzil şahmatı, semantik axtarış |
| 4 (#109/#112) | Elan müddəti, açıq qapı günləri, təqvim + ICS, premium paketlər, Bilik Mərkəzi AI məsləhətçisi, passkey, Google və telefonla giriş |

### Elan sehrbazı və admin auditi (#113, #114/#115)

- 8 addımlı elan sehrbazı (kabinet + admin), `localStorage` qaralaması;
- iyerarxik ünvan (region → … → bina), `formatFullAddress()` və `shortLocation()`;
- su nişanı: nisbi həndəsə, təkrar nişanın bayt izi və piksel korrelyasiyası ilə aşkarlanması;
- avtomatik AI SEO və ALT (`listing-enrichment.ts`), redaktorun sahəsinin üzərinə yazılmır;
- `AGENT` və `CORPORATE` hesab növləri, genişləndirilmiş profillər;
- tam ekran lightbox, sürətli əməliyyatlar, kabinet breadcrumb-ları, qısa ünvanlar;
- toplu seçim + silmə (hesablar, agentliklər, müraciətlər, bloq, layihələr, tərəfdaşlar, xidmətlər);
- foto məsləhətçisi Meta lisenziyası tələb etməyən modelə keçdi;
- sitemap-a yeni səhifələr və bazar hesabatları;
- tərəfdaşın kənar loqosu saxlamada itmir (`migrations/0049`);
- yeni qeydiyyat forması.

### Asılılıq yeniləməsi (#122)

Next 16.3.6, next-intl 4.14.7, wrangler 4.139, knip 6.38 və s. birləşdirildi. TypeScript 7, ESLint 10 və Vitest 5 upstream uyğunsuzluğuna görə `dependabot.yml`-də ignore edilib:

| Paket | Səbəb |
|---|---|
| `typescript >=7` | `typescript-eslint` yalnız TS `<6.1` dəstəkləyir |
| `eslint >=10` | `eslint-config-next`-in `eslint-plugin-react`-ı ESLint 10-da çökür |
| `vitest >=5` | `@cloudflare/vitest-plugin` peer olaraq yalnız `vitest ^4` qəbul edir |

Plugin yeni major-u dəstəkləyəndə uyğun ignore sətri silinməlidir.

### Ölkə üzrə ərazi bölgüsü (#127 / PR #128, 29 sentyabr)

- **Mənbələr:** rəsmi — DSK təsnifatı və Ünvan Reyestri (unvanportali.az API: bütün 75 şəhər/rayon, rəsmi kodlar, ~63 000 küçə); bazar — bina.az, kub.az, arenda.az, yeniemlak.az, lalafo.az; ziddiyyətlər OSM sərhədləri ilə həll olunub. tap.az-da ərazi sərbəst mətndir — 1 440 elan başlığının yer hissəsi yoxlanıb (119 ad, hamısı ağacda); emlak.az birbaşa oxunmadı, axtarış indeksindəki səhifələr yoxlanıb (hamısı ağacda). Tam hesabat: `docs/erazi/baki-erazi-bolgusu.md`.
- **Data:** 75 şəhər/rayon, 14 şəhər rayonu (Bakı 12, Gəncə 2), 266 qəsəbə və 3 605 kənd rəsmi kodla; 136 massiv — Bakı 62 (Şuşa şəhərciyi daxil), Sumqayıt 67 (17 mikrorayon, 40 məhəllə, 10 ərazi — arenda + yeniemlak), Abşeron 5, Gəncə 2 (Yeni Gəncə, Gülüstan); 27 metro; 214 nişangah; 91 alias qrupu. evimemlak.az Naxçıvan MR-in 8 vahidini təsdiqləyir.
- **Düzəlişlər:** 8-ci kilometr → Nizami, Günəşli → Suraxanı, 6–9-cu mikrorayon → Binəqədi, Sovetski → Yasamal, Alatava → 1-ci (Nəsimi) / 2-ci (Yasamal), Şuşa şəhərciyi → Sabunçu, Gürgən → Pirallahı; Qurd qapısı (qəbiristanlıq) əlavə edilmədi.
- **Sayt:** admin və kabinet formasında metro (kabinetdə ilk dəfə), nişangah və rəsmi küçə təklifləri; `?nisangah=` filtri, alias-lı axtarış, elan səhifəsində nişangah, yadda saxlanmış axtarış, CSV `landmark` sütunu, semantik axtarış.
- **Baza:** `Location.officialCode`, `Property.landmarkId`; özü-yetərli `migrations/0050`–`0053` (~8 000 ifadə ardıcıl hissələrdə).
- **Performans:** kəndlər filtrdə yalnız elanı olanda, formada seçilmiş rayon üçün (`/api/yerler/kendler`) yüklənir; AI axtarışı promptuna düşmür.

### Sənəd sinxronu (29 sentyabr)

Wiki (8 → 12 səhifə: Ərazi bölgüsü, İdarə paneli bələdçisi, Test və keyfiyyət, Terminlər lüğəti əlavə olundu), README, CLAUDE.md, AGENTS.md, MEMORY.md, CONTRIBUTING, SECURITY və `e2e/README.md` #128-dən sonrakı faktiki vəziyyətə uyğunlaşdırıldı.

## P0 — production riskinin azaldılması

### Backup və bərpa

**Mövcud:** miqrasiyalar CI tərəfindən tətbiq olunur; avtomatlaşdırılmış D1 export, R2 inventory və restore drill yoxdur.

**Hədəf:** planlı D1 export (Time Travel + ayrıca export), retention siyasəti, RPO/RTO, R2 inventory/lifecycle, dövri restore testi.

### Production post-deploy smoke

Staging E2E yayım qapısıdır; production üçün `npm run test:seo:routes` və `test:seo:live` var, amma tam post-deploy brauzer smoke hələ manualdır.

## P1 — istifadəçidən gözlənilən konfiqurasiya (koda aid deyil)

- `TELEGRAM_BOT_TOKEN` və `TELEGRAM_CHAT_ID` secret-ləri;
- Cloudflare Web Analytics tokeni → GitHub repo dəyişəni `PRODUCTION_CF_WEB_ANALYTICS_TOKEN`;
- Google ilə giriş: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; yönləndirmə `https://luxehomeestate.az/api/auth/google/callback`;
- Telefonla giriş: SMS provayderi ilə müqavilə → `SMS_PROVIDER_URL`, `SMS_PROVIDER_TOKEN`, `SMS_SENDER`;
- production `RESEND_WEBHOOK_SECRET` və Resend endpoint abunəliyi;
- şirkətin öz fotoları (`Parametrlər → Saytın şəkilləri`) və real elanlar (CSV idxalı).

## P2 — məhsul yetkinliyi

- **Admin i18n borcu:** 2 sentyabr auditində qalan legacy xam JSX sətirləri (`MEMORY.md` bölmə 5).
- **Turbopack keçidi:** ayrıca `npm run preview` + staging E2E ilə sınanmalıdır (Prisma klientinin symlink xaricləşdirilməsi).
- **`middleware.ts` → `proxy.ts`:** Next 16 köhnə konvensiya barədə xəbərdarlıq verir.
- **Bilik Mərkəzi:** idxal paketi DRAFT-dır; hüquqşünas/redaktor təsdiqi olmadan PUBLISHED edilmir.
- **Kontent və hüquqi təsdiq:** hüquqi mətnlər, iş saatları, xidmət iddiaları, AZ/EN/RU terminologiya redaktəsi.
- **Observability:** strukturlaşdırılmış log korrelyasiyası, e-poçt/cron alert-ləri, audit anomaliya siqnalları.
- **Nişangahlar:** koordinatla rayona bağlama və EN/RU dəqiq adları (hazırda transliterasiya).
- **Ərazi datası:** Naxçıvan şəhərinin məhəllələri (strukturlu mənbə yoxdur) və Sumqayıtın tək mənbədə görünən məhəllələri (72-ci, 76-cı) təsdiq gözləyir; taksonomiya SQL-i sətir silmir — ad/slug birləşdirmələri ayrıca miqrasiya tələb edir.
- **Asılılıqlar:** açıq Dependabot PR-ları — #126 (Prisma 6.19 → 7.10, major; D1 adapter və WASM client ilə ayrıca sınanmalıdır) və #129 (`@cloudflare/vitest-plugin` 1.2.8, `wrangler`, `@types/node`).

## Bilinən əməliyyat qeydləri

- Cloudflare Managed Content/Bot qaydası default CLI User-Agent ilə bəzi HTML route-larına 403 verə bilər; brauzer tipli User-Agent ilə yoxlanmalıdır.
- Admin locale-siz `/admin` marşrutundadır; `/{locale}/admin/...` canonical `/admin/...` ünvanına 308 qaytarır.
- `AUTH_SECRET` rotasiyası versiyalı deyil və TOTP secret şifrələməsinə təsir edir.
- D1 transaction dəstəkləmir — axınlar kompensasiya, şərti `updateMany` və idempotent marker-lərlə qorunur.
- D1 bir sorğuda ən çox 100 bound parametr qəbul edir; `take`/`orderBy`-li nested əlaqə 98-dən çox valideyndə sorğunu ilişdirir.
- Passkey domenə bağlıdır — `luxehomeestate.az`-da yaradılan passkey workers.dev-də işləmir.
- `next/font` build zamanı Google Fonts-dan yüklənir; Google-un keçici cavab xətası CI build-ini sındıra bilər (yenidən işlətmə ilə keçir).

## Tamamlanma meyarı

Bir roadmap maddəsi yalnız aşağıdakılar olduqda tamamlanmış sayılır:

- davranış mənbə kodda mövcuddur;
- auth/data sərhədi serverdə qorunur;
- uyğun unit/integration/E2E test əlavə edilib;
- test, typecheck, lint, dead-code və build keçir;
- staging E2E keçir;
- README/Wiki/CLAUDE.md/SECURITY təsirlənirsə yenilənib;
- miqrasiya/deploy/rollback qeydi mövcuddur.

## Sənədləşdirmə borcu qaydası

Yeni route, model, permission, npm script, binding və security davranışı eyni pull request-də sənədləşdirilməlidir. Wiki-ni faktiki koddan üstün həqiqət mənbəyi saymaq olmaz; ziddiyyətdə mənbə kod qalibdir və sənəd düzəldilməlidir.
