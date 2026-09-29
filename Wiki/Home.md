# Luxe Home Estate — Texniki Wiki

> **Son tam audit:** 29 sentyabr 2026<br>
> **Audit bazası:** `main@199f8409` — yol xəritəsinin 4 mərhələsi, #113 elan sehrbazı, #114/#115 admin auditi, #122 asılılıq yeniləməsi və #127/#128 ölkə üzrə ərazi bölgüsündən sonra<br>
> **Production:** [luxehomeestate.az](https://luxehomeestate.az) · yayım GitHub Actions ilə avtomatikdir (`quality + e2e-local → deploy-staging → e2e-staging → deploy-production`)<br>
> **Staging:** `luxehomeestate-staging.amiyevbahadur.workers.dev` (noindex, nümunə məzmun açıq)

Luxe Home Estate Azərbaycan bazarı üçün çoxdilli daşınmaz əmlak platformasıdır. Sistem AZ/EN/RU ictimai elan kataloqunu, agentlik, agent və rəsmi tərəfdaş profillərini, yaşayış komplekslərini, Bilik Mərkəzini, istifadəçi kabinetini və rol əsaslı idarə panelini vahid Next.js tətbiqində birləşdirir. Bütün infrastruktur Cloudflare-dədir: Workers (OpenNext), D1, R2, Images, Workers AI və Vectorize.

Bu Wiki planlaşdırılan arxitekturanı deyil, audit edilən commit-dəki **faktiki kod vəziyyətini** təsvir edir. Gələcək və ya yarımçıq imkanlar ayrıca [[Cari vəziyyət və yol xəritəsi|Status-and-Roadmap]] səhifəsində qeyd olunur. Ziddiyyət olduqda mənbə kod və `CLAUDE.md` qalib gəlir.

## Sürətli naviqasiya

| Səhifə | Nəyi izah edir | Kimin üçündür |
|---|---|---|
| [[Arxitektura|Architecture]] | Sistem sərhədləri, render/data axını, kənar keş, media, Cloudflare binding-ləri, dizayn sistemi | Developer |
| [[Funksiyalar və marşrutlar|Features-and-Routes]] | 133 səhifə və 21 Route Handler-in tam inventarı, filtr parametrləri, rol/icazə xəritəsi | Developer, məhsul |
| [[Məlumat modeli|Data-Model]] | 68 Prisma modeli, domen sabitləri, 54 miqrasiyanın tarixçəsi, seed/demo qaydaları | Developer |
| [[Ərazi bölgüsü və ünvan|Location-Taxonomy]] | Rəsmi ərazi ağacı, massiv/metro/nişangah, rəsmi küçələr, generator axını və yeniləmə runbook-u | Developer, redaktor |
| [[Təhlükəsizlik və autentifikasiya|Security-and-Authentication]] | Staff 2FA + passkey, ictimai giriş (parol, Google, telefon OTP), RBAC, Turnstile, başlıqlar | Developer, təhlükəsizlik |
| [[İdarə paneli bələdçisi|Admin-Panel-Guide]] | Paneldə gündəlik iş axınları: elan, moderasiya, idxal, CRM, paketlər, SERP, sistem rejimi | Redaktor, menecer |
| [[Test və keyfiyyət|Testing-and-Quality]] | Test piramidası, keyfiyyət qapısı, qoruyucu testlər, E2E lokal stack, CI yoxlamaları | Developer, QA |
| [[İnkişaf təlimatı|Development-Guide]] | Lokal quraşdırma, mühit dəyişənləri, npm əmrləri, testlər, konvensiyalar, troubleshooting | Developer |
| [[Deployment və əməliyyatlar|Deployment-and-Operations]] | CI/CD, staging/production, secret-lər, miqrasiya, runbook-lar, observability, insident | DevOps |
| [[Cari vəziyyət və yol xəritəsi|Status-and-Roadmap]] | Hazırlıq matrisi, sentyabr mərhələləri, prioritetli boşluqlar | Hamı |
| [[Terminlər lüğəti|Glossary]] | Kodda və sənədlərdə işlənən termin və qısaltmalar | Hamı |

## İcraçı xülasə

31 avqust auditindən sonra platformaya bu mərhələlər əlavə olunub:

- **Keyfiyyət infrastrukturu** — Playwright browser E2E (PR-da lokal workerd stack, `main`-də staging yayım qapısı), real miniflare D1 integration testləri, Knip dead-code yoxlaması, avtomatik CI/CD (miqrasiya → staging → E2E → production).
- **Sistem rejimləri** — paneldən idarə olunan `NORMAL` / `MAINTENANCE` / `READ_ONLY`; təcili hal üçün `FORCE_MAINTENANCE` mühit dəyəri.
- **Nümunə (demo) məzmun** — `isDemo` bayrağı və `/admin/demo-mezmun` açarı; staging-də açıq, production-da bağlı.
- **Next.js 16 + dizayn yenilənməsi** — webpack build, radius/kart/badge konvensiyaları, 49 səhifə × 18 viewport responsive auditi.
- **Yol xəritəsinin 4 mərhələsi (27 sentyabr)** — CSV idxalı, Telegram bildirişi, OG paylaşım kartı, PWA; qiymət göstəricisi, `/emlakimi-sat`, müraciət lövhəsi, huni, kənar HTML keşi; plan/360° tur, mobil alt naviqasiya, metro, kalkulyatorlar, `/investisiya`, xəritədə sahə, mənzil şahmatı, semantik axtarış; elan müddəti, açıq qapı günləri, təqvim + ICS, premium paketlər, Bilik Mərkəzi AI məsləhətçisi, passkey, Google və telefonla giriş.
- **Elan sehrbazı (#113)** — 8 addımlı forma, iyerarxik ünvan, su nişanı, avtomatik AI SEO/ALT, genişləndirilmiş hesab növləri (`AGENT`, `CORPORATE`).
- **Admin auditi (#114/#115)** — toplu seçim və silmə, hesab/agentlik silmə, foto məsləhətçisi üçün Mistral Small 3.1, sitemap genişlənməsi, tərəfdaş loqosunun qorunması, yeni qeydiyyat forması.
- **Asılılıq yeniləməsi (#122)** — Next 16.3.6, next-intl 4.14.7, wrangler 4.139; TypeScript 7, ESLint 10 və Vitest 5 upstream uyğunsuzluğuna görə saxlanılır.
- **Ölkə üzrə ərazi bölgüsü (#127/#128, 29 sentyabr)** — Ünvan Reyestrinin bütün 75 şəhər/rayonu üzrə rəsmi 8 rəqəmli kodlar, 266 qəsəbə, 3 605 kənd və ~63 000 rəsmi küçə; 136 bazar massivi (Bakı 62, Sumqayıt 67, Abşeron 5, Gəncə 2), 27 metro, 214 nişangah (`?nisangah=` filtri), 91 alias qrupu ilə registrsiz axtarış. Ətraflı: [[Ərazi bölgüsü və ünvan|Location-Taxonomy]].

### Hazırlıq matrisi

| Sahə | Vəziyyət | Faktiki imkan |
|---|---:|---|
| İctimai kataloq və detallar | ✅ Hazır | Filtr, sıralama, siyahı/xəritə + sahə çəkmə, lightbox qalereya, plan/tur, qiymət göstəricisi, metro, nişangah |
| Favorit və müqayisə | ✅ Hazır | Hesabla sinxron favorit, ən çox 4 elanın müqayisəsi |
| Agentlik, agent və tərəfdaş | ✅ Hazır | Kataloqlar, profillər, rəy moderasiyası, rəsmi tərəfdaş əlaqələri |
| İctimai hesab və kabinet | ✅ Hazır | 5 hesab növü, 8 addımlı sehrbaz, müddət/yeniləmə, paketlər, rezervasiya, bildiriş, data ixracı, silinmə |
| İctimai giriş | ✅ Hazır | Parol + Turnstile; Google OIDC və telefon OTP secret verilənə qədər söndürülüdür |
| Staff autentifikasiyası | ✅ Hazır | Parol, məcburi TOTP, passkey (alternativ), backup kod, sessiya və lockout |
| Admin panel | ✅ Əməliyyat | Kontent, CRM (lövhə, huni), idxal, paketlər, təqvim, SERP, AI, tərcümə, sistem, toplu əməliyyatlar |
| Ərazi bölgüsü | ✅ Hazır | Rəsmi kodlu ölkə ağacı, massiv/metro/nişangah, rəsmi küçə təklifləri, generasiyalı miqrasiyalar |
| Media pipeline | ✅ Hazır | Magic-byte, Images çevirməsi, su nişanı, R2 master + thumbnail, toplu yükləmə növbəsi |
| SEO/SERP | ✅ Əməliyyat | hreflang, metadata/JSON-LD, sitemap index, OG kartı, avtomatik SEO/ALT, SERP mərkəzi |
| Bilik Mərkəzi | ✅ Hazır | Bələdçi, lüğət, CMS FAQ, kalkulyator, istinadlı AI məsləhətçi |
| AI və kəşf | ✅ İşlək | Workers AI axtarışı, semantik axtarış (Vectorize), Match Score, foto məsləhətçisi, admin köməkçisi |
| Test | ✅ Hazır | 173 Vitest faylı / 889 test (workerd + Node + real D1 integration) |
| Browser E2E | ✅ Hazır | 15 spec + auth setup, 190 test icrası (chromium 158, mobile 32) |
| CI/CD | ✅ Avtomatik | Miqrasiya → staging → E2E → production; CodeQL, dependency review, Dependabot |
| Ödəniş provayderi | 🟡 Qərar | Qəsdən yoxdur — ödəniş ofisdə/köçürmə ilə, paneldə uçot |
| Backup/DR | 🔴 Yoxdur | Avtomatlaşdırılmış D1 export/restore drill hələ qurulmayıb |

## Audit snapshot-u

| Metrika | Nəticə |
|---|---:|
| `page.tsx` faylı | 133 (ictimai sayt 40 · kabinet və auth 24 · admin 69) |
| Route Handler | 21 (`src/app/api` altında 17 + `media`, `llms.txt`, `sitemap-index.xml`, `sitemaps/[feed]`) |
| `"use server"` faylı | 58 |
| Prisma modeli | 68 |
| D1 miqrasiya faylı | 54 (son: `0053_country_locations_part4.sql`) |
| Permission / rol | 25 / 3 |
| Vitest faylı / testi | 173 / 889 |
| Playwright spec faylı / test icrası | 15 (+1 setup) / 190 |
| `Location` sətri | 4 337 (75 CITY · 14 DISTRICT · 266 SETTLEMENT · 3 605 VILLAGE · 136 NEIGHBORHOOD · 27 METRO · 214 LANDMARK) |
| Rəsmi küçə faylı | 3 476 (`public/data/kuceler/<kod>.json`) |

Bu rəqəmlər audit tarixinin snapshot-udur və yeni commit-lərlə dəyişə bilər. Audit zamanı lokal `npm run test` (173 fayl / 889 test) keçib; `main@199f8409` üçün GitHub Actions CI (quality, lokal E2E, staging + E2E, production yayımı) uğurla bitib.

## Əsas texnologiyalar

| Qat | Texnologiya |
|---|---|
| Tətbiq | Next.js 16.3.6 (webpack build), React 19.3, App Router, Server Actions |
| Dil və UI | TypeScript 5 (strict), Tailwind CSS v4, Lucide, Leaflet, `next-themes` |
| Data | Prisma 6.19.3, `@prisma/adapter-d1`, WASM client, Cloudflare D1 / SQLite |
| Runtime | Cloudflare Workers, OpenNext (`worker.ts` sarğısı + kənar HTML keşi), Smart Placement |
| Media | Cloudflare R2 və Images, su nişanı |
| Auth | `jose`, Web Crypto PBKDF2, TOTP, AES-GCM, `@simplewebauthn/server`, Google OIDC, Turnstile |
| Bildiriş | Resend, Web Push (VAPID), Telegram, SMS provayderi (istəyə bağlı) |
| AI | Cloudflare Workers AI (mətn + vision), Vectorize (`bge-m3`, 1024/cosine) |
| Lokallaşdırma | `next-intl` 4.14, AZ/EN/RU; admin dili `User.locale`-dan |
| Validasiya | Zod, UltraHTML sanitizasiyası |
| Test | Vitest 4 + `@cloudflare/vitest-plugin` (workerd), Playwright + axe-core |
| Data generatorları | Python 3 (ərazi bölgüsü, rəsmi küçələr, hesabat), `tsx` (seed, taksonomiya, demo, Bilik Mərkəzi) |
| Toolchain | Node `^22.22.2 \|\| ^24.15.0 \|\| >=26` (`.nvmrc`: 24), npm 12.0.1 (`packageManager`) |

## Repozitoriyadakı digər sənədlər

| Sənəd | Məzmun |
|---|---|
| `README.md` | Layihənin ümumi təsviri, imkanlar, quraşdırma və əmrlər |
| `CLAUDE.md` / `AGENTS.md` | AI agentlər üçün arxitektura qaydaları və tələlər (CLAUDE.md həqiqət mənbəyidir) |
| `MEMORY.md` | Qərarlar, tarixçə, gözləyən işlər və sessiyalararası yaddaş |
| `CONTRIBUTING.md` | Issue → branch → PR axını, branch/commit adlandırma, keyfiyyət qapısı |
| `SECURITY.md` | Zəifliyin məxfi bildirilməsi və təhlükəsizlik bazası |
| `docs/github-governance.md` | GitHub UI parametrlərinin (branch qoruması, environment-lər) authoritative sənədi |
| `docs/erazi/baki-erazi-bolgusu.md` | Ərazi bölgüsünün generasiya olunan hesabatı: mənbələr, ziddiyyətlər, hər rayonun siyahısı |
| `docs/erazi/sources/` | Bazar saytlarından (bina, kub, arenda, yeniemlak, lalafo, tap, emlak.az) toplanmış snapshot-lar |
| `docs/seo/` | Cloudflare production checklist, ölçmə, off-page plan, final qəbul hesabatı |
| `docs/audits/` | Frontend, kod, kibertəhlükəsizlik və tam layihə auditləri (avqust–sentyabr 2026) |
| `docs/Real Estate Knowledge Hub/` | Bilik Mərkəzinin hüquqi mənbə materialı (avtomatik dərc müqaviləsi deyil) |
| `docs/*PRD*.md` | Uzunmüddətli hədəf olan PRD sənədləri (Full Platform, Public Platform, SERP, Tərəfdaşlıq) |
| `docs/content/2026-bloq-plani.md` | Bloq məzmun planı |
| `e2e/README.md` | Playwright dəstinin quruluşu və işlətmə qaydası |

## Dəyişməz sahiblik qeydi

- Proqram kodunun müəllif hüquqları **Təhməz Muradova** məxsusdur.
- **Luxe Home Estate MMC**, “Luxe Home Estate” brendi və markası **Əmiyev Bahadur Qafar oğluna** məxsusdur (`siteConfig.owner`; footer və `organizationSchema()`-də göstərilir).
- Şirkət ünvanı hər yerdə **Əliyar Əliyev 45a, Bakı AZ1005**-dir (Google Business Profile ilə eyni; köhnə «109A, AZ1033» işlədilmir).
- Kod MIT lisenziyası ilə yayımlanır; bu lisenziya brend, loqo və ticarət nişanı hüququ vermir.

## Sənədlərin saxlanması

Kod davranışı dəyişdikdə uyğun Wiki səhifəsi, `README.md`, `CLAUDE.md`, `AGENTS.md`, `MEMORY.md` və lazım olduqda `SECURITY.md` eyni dəyişiklik daxilində yenilənməlidir. Status, marşrut, say və npm əmri barədə məlumat mənbə fayldan yoxlanmadan sənədə əlavə edilməməlidir.

Wiki-nin mənbəyi repozitoriyadakı `Wiki/` qovluğudur; GitHub Wiki (`LuxeHome.wiki.git`) həmin fayllardan yenilənir.
