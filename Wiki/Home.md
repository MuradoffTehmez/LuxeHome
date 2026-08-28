# Luxe Home Estate — Texniki Wiki

> **Son tam audit:** 28 avqust 2026<br>
> **Branch:** `main`<br>
> **Audit bazası:** [`ed93ba4`](https://github.com/MuradoffTehmez/LuxeHome/commit/ed93ba49aae705f7da5d10aa92b9e80fe177095e)<br>
> **Production:** [luxehomeestate.az](https://luxehomeestate.az) · Worker `11ade039-1f72-4777-b1e7-33df3376aef9`

Luxe Home Estate Azərbaycan bazarı üçün çoxdilli daşınmaz əmlak platformasıdır. Sistem AZ/EN/RU ictimai elan kataloqunu, agentlik və rəsmi tərəfdaş profillərini, layihə və məzmun səhifələrini, istifadəçi kabinetini və rol əsaslı idarə panelini vahid Next.js tətbiqində birləşdirir.

Bu Wiki planlaşdırılan arxitekturanı deyil, audit edilən commit-dəki faktiki kod vəziyyətini təsvir edir. Gələcək və ya yarımçıq imkanlar ayrıca **Cari vəziyyət və yol xəritəsi** səhifəsində qeyd olunur.

## Sürətli naviqasiya

| Səhifə | Nəyi izah edir |
|---|---|
| [[Arxitektura|Architecture]] | Sistem sərhədləri, data axını, Cloudflare və dizayn prinsipləri |
| [[Funksiyalar və marşrutlar|Features-and-Routes]] | İctimai sayt, kabinet, admin və API inventarı |
| [[Məlumat modeli|Data-Model]] | 33 Prisma modeli, domen qaydaları və status müqavilələri |
| [[Təhlükəsizlik və autentifikasiya|Security-and-Authentication]] | Staff 2FA, public auth, sessiya, RBAC, CSRF və media müdafiəsi |
| [[İnkişaf təlimatı|Development-Guide]] | Lokal quraşdırma, əmrlər, konvensiyalar və keyfiyyət qapısı |
| [[Deployment və əməliyyatlar|Deployment-and-Operations]] | Staging/production, D1/R2, secret, miqrasiya və runbook |
| [[Cari vəziyyət və yol xəritəsi|Status-and-Roadmap]] | Hazırlıq matrisi, məlum boşluqlar və prioritetlər |

## İcraçı xülasə

28 avqust 2026 tarixində production ana səhifəsi, ictimai naviqasiya, əlaqə və TREVA tərəfdaş profili, həmçinin autentifikasiya olunmuş admin marşrutları real brauzerdə yoxlanıb. D1-də qarışıq `Service` DateTime tiplərinin yaratdığı ictimai səhifə xətası `0019` miqrasiyası ilə aradan qaldırılıb. Desktop və 390 px mobil yoxlamasında əsas admin səhifələrində üfüqi daşma və brauzer konsol xətası aşkarlanmayıb.

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
| Test və CI | 🟡 Qismən | 81 Vitest faylı/335 test; avtomatlaşdırılmış D1 E2E və CI yoxdur |

## Audit snapshot-u

| Metrika | Nəticə |
|---|---:|
| `page.tsx` faylı | 71 |
| Prisma modeli | 33 |
| D1 miqrasiya faylı | 20 |
| Server Action faylı | 28 |
| Route Handler | 7 |
| Test faylı | 81 |
| Vitest testi | 335 |

Bu rəqəmlər audit tarixinin snapshot-udur və yeni commit-lərlə dəyişə bilər.

Audit zamanı TypeScript, 81 fayldakı 335 Vitest testi, Next.js production build və OpenNext production deploy uğurla keçib.

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
| Lokallaşdırma | `next-intl`, AZ/EN/RU |
| Test | Vitest və Cloudflare `workerd` runtime |

## Dəyişməz sahiblik qeydi

- Proqram kodunun müəllif hüquqları **Təhməz Muradova** məxsusdur.
- **Luxe Home Estate MMC**, “Luxe Home Estate” brendi və markası **Əmiyev Bahadur Qafar oğluna** məxsusdur.
- Kod MIT lisenziyası ilə yayımlanır; bu lisenziya brend, loqo və ticarət nişanı hüququ vermir.

## Sənədlərin saxlanması

Kod davranışı dəyişdikdə uyğun Wiki səhifəsi, `README.md` və lazım olduqda `SECURITY.md` eyni dəyişiklik daxilində yenilənməlidir. Status, marşrut və npm əmri barədə məlumat source faylından yoxlanmadan sənədə əlavə edilməməlidir.
