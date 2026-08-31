# Luxe Home Estate — Texniki Wiki

> **Son tam audit:** 31 avqust 2026<br>
> **Branch:** `main`<br>
> **Audit bazası:** `main` (SERP ekosistemi mərhələsindən sonra)<br>
> **Production:** [luxehomeestate.az](https://luxehomeestate.az) · Worker `a88cf4ab-6a5e-4b84-a038-2a6c82f0ae92`

Luxe Home Estate Azərbaycan bazarı üçün çoxdilli daşınmaz əmlak platformasıdır. Sistem AZ/EN/RU ictimai elan kataloqunu, agentlik və rəsmi tərəfdaş profillərini, layihə və məzmun səhifələrini, istifadəçi kabinetini və rol əsaslı idarə panelini vahid Next.js tətbiqində birləşdirir.

Bu Wiki planlaşdırılan arxitekturanı deyil, audit edilən commit-dəki faktiki kod vəziyyətini təsvir edir. Gələcək və ya yarımçıq imkanlar ayrıca **Cari vəziyyət və yol xəritəsi** səhifəsində qeyd olunur.

## Sürətli naviqasiya

| Səhifə | Nəyi izah edir |
|---|---|
| [[Arxitektura|Architecture]] | Sistem sərhədləri, data axını, Cloudflare və dizayn prinsipləri |
| [[Funksiyalar və marşrutlar|Features-and-Routes]] | İctimai sayt, kabinet, admin və API inventarı |
| [[Məlumat modeli|Data-Model]] | 60 Prisma modeli, domen qaydaları və status müqavilələri |
| [[Təhlükəsizlik və autentifikasiya|Security-and-Authentication]] | Staff 2FA, public auth, sessiya, RBAC, CSRF və media müdafiəsi |
| [[İnkişaf təlimatı|Development-Guide]] | Lokal quraşdırma, əmrlər, konvensiyalar və keyfiyyət qapısı |
| [[Deployment və əməliyyatlar|Deployment-and-Operations]] | Staging/production, D1/R2, secret, miqrasiya və runbook |
| [[Cari vəziyyət və yol xəritəsi|Status-and-Roadmap]] | Hazırlıq matrisi, məlum boşluqlar və prioritetlər |

## İcraçı xülasə

28 avqust auditindən sonra platformaya üç böyük mərhələ əlavə olunub: **Phase 2 ictimai imkanlar** (rezervasiya, agent kataloqu və rəylər, qiymət alert-i, Web Push, fərdi tövsiyələr, Cloudflare Workers AI axtarışı), **Real Estate Knowledge Hub** (hüquqi bələdçi, lüğət, CMS FAQ və kalkulyator) və **SERP ekosistemi** (idarə olunan metadata/landing runtime-ı, entity schema mühərriki, sitemap index feed-ləri, organik lead atribusiyası və 16 səhifəlik admin SERP mərkəzi).

31 avqust 2026 tarixində keyfiyyət qapısı tam təmiz keçib və production deploy təkrarlanıb. Eyni gündə **GitHub Actions CI-nın uzunmüddətli uğursuzluğu aradan qaldırılıb**: səbəb `npm ci` mərhələsindəki `EUSAGE` xətası idi — lock faylı npm 12 ilə yaradılırdı, CI isə Node 22-nin gətirdiyi npm 10 ilə işləyirdi (ətraflı: [[İnkişaf təlimatı|Development-Guide]]).

### Hazırlıq matrisi

| Sahə | Vəziyyət | Faktiki imkan |
|---|---:|---|
| İctimai kataloq və detallar | ✅ Hazır | Filtr, sıralama, xəritə, qalereya, SEO |
| Favorit və müqayisə | ✅ Hazır | LocalStorage favorit, ən çox 4 cookie əsaslı müqayisə |
| Agentlik kataloqu | ✅ Hazır | Yalnız təsdiqlənmiş və aktiv agentliklər |
| Tərəfdaşlıq sistemi | ✅ Hazır | Çoxdilli profil, görünürlük, müqavilə və entity əlaqələri |
| İctimai hesab və kabinet | 🟡 Qismən | Qeydiyyat, profil, elan yaratma və status; edit/delete yoxdur |
| Saxlanmış axtarış/bildiriş | ✅ Hazır | Dərhal/paket uyğunluq, panel bildirişi və cron digest |
| Staff autentifikasiyası | ✅ Hazır | Parol, məcburi TOTP, backup kod, sessiya və lockout |
| Admin panel | ✅ Əməliyyat | Kontent, moderasiya, CRM, tərəfdaş, SEO, analitika, hesab və audit |
| Media pipeline | ✅ Hazır | Magic-byte, Images çevirməsi, R2 master + thumbnail |
| SEO | ✅ Əməliyyat | hreflang, metadata/JSON-LD, sitemap, robots, redirects, SEO audit və `llms.txt` |
| Əlaqə və lead | ✅ Əməliyyat | Same-origin, honeypot, rate limit, D1, Resend və sürətli status |
| Korporativ e-poçt | 🟡 Konfiqurasiya | UI/webhook hazırdır; production `RESEND_WEBHOOK_SECRET` tələb edir |
| Bilik Mərkəzi | ✅ Hazır | Bələdçi kataloqu, lüğət, CMS FAQ, kalkulyator və tərcümə axını |
| SERP ekosistemi | ✅ Əməliyyat | İdarə olunan metadata/landing, entity schema, sitemap index, monitorinq və admin mərkəzi |
| AI və kəşf | ✅ İşlək | Workers AI axtarışı, Match Score, əmlak sehrbazı və admin köməkçisi |
| Rezervasiya və agentlər | ✅ İşlək | Rezervasiya axını, agent kataloqu, profil və rəy moderasiyası |
| Test | ✅ Hazır | 89 Vitest faylı / 373 test |
| CI | ✅ İşlək | GitHub Actions `test + typecheck + lint + build`; npm versiyası `packageManager`-dən pinlənir |
| Browser E2E | 🔴 Yoxdur | Avtomatlaşdırılmış brauzer axını hələ yoxdur |

## Audit snapshot-u

| Metrika | Nəticə |
|---|---:|
| `page.tsx` faylı | 119 |
| Prisma modeli | 60 |
| D1 miqrasiya faylı | 26 (son: `0025_serp_ecosystem.sql`) |
| Server Action faylı | 45 |
| Route Handler | 14 |
| Test faylı | 89 |
| Vitest testi | 373 |

Bu rəqəmlər audit tarixinin snapshot-udur və yeni commit-lərlə dəyişə bilər.

Audit zamanı TypeScript, ESLint, 89 fayldakı 373 Vitest testi, Next.js production build və OpenNext production deploy uğurla keçib.

## Əsas texnologiyalar

| Qat | Texnologiya |
|---|---|
| Tətbiq | Next.js 15.5.23, React 19.1, App Router |
| Dil və UI | TypeScript, Tailwind CSS v4, Lucide, Leaflet |
| Data | Prisma 6.19.3, Cloudflare D1 / SQLite |
| Runtime | Cloudflare Workers, OpenNext |
| Media | Cloudflare R2 və Images |
| Auth | `jose`, Web Crypto PBKDF2, TOTP, AES-GCM |
| E-poçt | Resend |
| AI | Cloudflare Workers AI |
| Lokallaşdırma | `next-intl`, AZ/EN/RU |
| Test | Vitest və Cloudflare `workerd` runtime |

## Dəyişməz sahiblik qeydi

- Proqram kodunun müəllif hüquqları **Təhməz Muradova** məxsusdur.
- **Luxe Home Estate MMC**, “Luxe Home Estate” brendi və markası **Əmiyev Bahadur Qafar oğluna** məxsusdur.
- Kod MIT lisenziyası ilə yayımlanır; bu lisenziya brend, loqo və ticarət nişanı hüququ vermir.

## Sənədlərin saxlanması

Kod davranışı dəyişdikdə uyğun Wiki səhifəsi, `README.md` və lazım olduqda `SECURITY.md` eyni dəyişiklik daxilində yenilənməlidir. Status, marşrut və npm əmri barədə məlumat source faylından yoxlanmadan sənədə əlavə edilməməlidir.
