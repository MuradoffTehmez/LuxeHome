# Luxe Home Estate — Texniki Wiki

> **Son tam audit:** 23 avqust 2026<br>
> **Branch:** `main`<br>
> **Audit bazası:** [`f7348b2`](https://github.com/MuradoffTehmez/LuxeHome/commit/f7348b22665b1230c8c01afac37eaa02d9e907da)<br>
> **Production:** [luxehomeestate.az](https://luxehomeestate.az)

Luxe Home Estate Azərbaycan bazarı üçün daşınmaz əmlak platformasıdır. Sistem ictimai elan kataloqunu, agentlik profilini, layihə və məzmun səhifələrini, istifadəçi kabinetini və rol əsaslı idarə panelini vahid Next.js tətbiqində birləşdirir.

Bu Wiki planlaşdırılan arxitekturanı deyil, audit edilən commit-dəki faktiki kod vəziyyətini təsvir edir. Gələcək və ya yarımçıq imkanlar ayrıca **Cari vəziyyət və yol xəritəsi** səhifəsində qeyd olunur.

## Sürətli naviqasiya

| Səhifə | Nəyi izah edir |
|---|---|
| [[Arxitektura|Architecture]] | Sistem sərhədləri, data axını, Cloudflare və dizayn prinsipləri |
| [[Funksiyalar və marşrutlar|Features-and-Routes]] | İctimai sayt, kabinet, admin və API inventarı |
| [[Məlumat modeli|Data-Model]] | 21 Prisma modeli, domen qaydaları və status müqavilələri |
| [[Təhlükəsizlik və autentifikasiya|Security-and-Authentication]] | Staff 2FA, public auth, sessiya, RBAC, CSRF və media müdafiəsi |
| [[İnkişaf təlimatı|Development-Guide]] | Lokal quraşdırma, əmrlər, konvensiyalar və keyfiyyət qapısı |
| [[Deployment və əməliyyatlar|Deployment-and-Operations]] | Staging/production, D1/R2, secret, miqrasiya və runbook |
| [[Cari vəziyyət və yol xəritəsi|Status-and-Roadmap]] | Hazırlıq matrisi, məlum boşluqlar və prioritetlər |

## İcraçı xülasə

Layihənin ictimai hissəsi production-da işləyir. 23 avqust 2026 tarixli smoke yoxlamasında ana səhifə, əmlak kataloqu, agentliklər, müqayisə və qeydiyyat marşrutları HTTP 200 qaytardı; `/admin` sessiyasız sorğunu `/giris` səhifəsinə yönləndirdi. `robots.txt` və `sitemap.xml` də əlçatan idi.

### Hazırlıq matrisi

| Sahə | Vəziyyət | Faktiki imkan |
|---|---:|---|
| İctimai kataloq və detallar | ✅ Hazır | Filtr, sıralama, xəritə, qalereya, SEO |
| Favorit və müqayisə | ✅ Hazır | LocalStorage favorit, ən çox 4 cookie əsaslı müqayisə |
| Agentlik kataloqu | ✅ Hazır | Yalnız təsdiqlənmiş və aktiv agentliklər |
| İctimai hesab və kabinet | 🟡 Qismən | Qeydiyyat, profil, elan yaratma və status; edit/delete yoxdur |
| Staff autentifikasiyası | ✅ Hazır | Parol, məcburi TOTP, backup kod, sessiya və lockout |
| Admin panel | ✅ Əməliyyat | Əsas kontent/CRM/media/istifadəçi CRUD və audit |
| Media pipeline | ✅ Hazır | Magic-byte, Images çevirməsi, R2 master + thumbnail |
| SEO | 🟡 Qismən | Metadata/JSON-LD/sitemap/robots var; yeni route-ların bir hissəsi sitemap-da deyil |
| Əlaqə və lead | 🟡 Qismən | D1 + Resend var; anti-spam action-a bağlanmayıb |
| Test və CI | 🟡 Qismən | 21 Vitest faylı var; D1 integration, E2E və CI yoxdur |

## Audit snapshot-u

| Metrika | Nəticə |
|---|---:|
| `page.tsx` marşrutu | 49 |
| Prisma modeli | 21 |
| Server Action faylı | 16 |
| Route Handler | 4 |
| Test faylı | 21 |
| Vitest testi | 107 |
| `src/` TypeScript/TSX/CSS faylı | 214 |
| `src/` sətir sayı | 23 323 |

Bu rəqəmlər audit tarixinin snapshot-udur və yeni commit-lərlə dəyişə bilər.

Audit zamanı TypeScript, ESLint, 21 fayldakı 107 Vitest testi və Next.js production build uğurla keçib.

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
| Test | Vitest və Cloudflare `workerd` runtime |

## Dəyişməz sahiblik qeydi

- Proqram kodunun müəllif hüquqları **Təhməz Muradova** məxsusdur.
- **Luxe Home Estate MMC**, “Luxe Home Estate” brendi və markası **Əmiyev Bahadur Qafar oğluna** məxsusdur.
- Kod MIT lisenziyası ilə yayımlanır; bu lisenziya brend, loqo və ticarət nişanı hüququ vermir.

## Sənədlərin saxlanması

Kod davranışı dəyişdikdə uyğun Wiki səhifəsi, `README.md` və lazım olduqda `SECURITY.md` eyni dəyişiklik daxilində yenilənməlidir. Status, marşrut və npm əmri barədə məlumat source faylından yoxlanmadan sənədə əlavə edilməməlidir.
