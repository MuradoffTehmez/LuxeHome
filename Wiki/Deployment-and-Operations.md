# Deployment və əməliyyatlar

Tətbiq `@opennextjs/cloudflare` ilə Cloudflare Worker formatına çevrilir. Production və staging resursları `wrangler.jsonc` daxilində ayrı təyin olunub.

## Mühit matrisi

| Resurs | Production | Staging |
|---|---|---|
| Worker | `luxehomeestate` | `luxehomeestate-staging` |
| Saved-search cron Worker | `luxehomeestate-cron` | `luxehomeestate-cron-staging` |
| URL | `luxehomeestate.az`, `www.luxehomeestate.az` | `luxehomeestate-staging.amiyevbahadur.workers.dev` |
| D1 | `luxehome-db` | `luxehome-db-staging` |
| Media R2 | `luxehome-media` | `luxehome-media-staging` |
| ISR cache R2 | `luxehome-next-cache` | `luxehome-next-cache-staging` |
| Login limiter namespace | `1001` | `2001` |
| Contact limiter namespace | `1002` | `2002` |
| Admin limiter namespace | `1003` | `2003` |
| `SITE_URL` | `https://luxehomeestate.az` | Staging workers.dev URL |
| `IS_STAGING` | yoxdur/false | `true` |
| `ADMIN_ENABLED` | `true` | `true` |

`env.staging.routes = []` qəsdən yazılıb. Wrangler `routes` dəyərini irsən ötürə bildiyi üçün boş massiv olmasa staging deploy-u production custom domain-i öz üzərinə ala bilər.

## Cloudflare binding-ləri

| Binding | Tip | İstifadə |
|---|---|---|
| `ASSETS` | Static assets | `.open-next/assets` |
| `DB` | D1 | Prisma runtime |
| `NEXT_TAG_CACHE_D1` | D1 | OpenNext tag revalidation (`revalidations` cədvəli) |
| `MEDIA` | R2 | Yüklənən şəkillər |
| `NEXT_INC_CACHE_R2_BUCKET` | R2 | OpenNext incremental cache |
| `IMAGES` | Images | Resize, info və WebP output |
| `WORKER_SELF_REFERENCE` | Service | Revalidation self-call |
| `LOGIN_LIMIT` | Rate limit | Login və public qeydiyyat |
| `CONTACT_LIMIT` | Rate limit | Əlaqə forması üçün IP əsaslı limit |
| `ADMIN_LIMIT` | Rate limit | Admin/public listing mutation-ları |

## Secret-lər

Hər mühit üçün ayrıca təyin olunur:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
npx wrangler secret put NOTIFICATION_EMAIL
npx wrangler secret put RESEND_WEBHOOK_SECRET
npx wrangler secret put CRON_SECRET
npx wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN
npx wrangler secret put CRON_SECRET --config workers/saved-search-cron/wrangler.jsonc
```

Staging:

```bash
npx wrangler secret put AUTH_SECRET --env staging
npx wrangler secret put RESEND_API_KEY --env staging
npx wrangler secret put RESEND_FROM_EMAIL --env staging
npx wrangler secret put NOTIFICATION_EMAIL --env staging
npx wrangler secret put RESEND_WEBHOOK_SECRET --env staging
npx wrangler secret put CRON_SECRET --env staging
npx wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN --env staging
npx wrangler secret put CRON_SECRET --config workers/saved-search-cron/wrangler.jsonc --env staging
```

Qaydalar:

- production və staging `AUTH_SECRET` eyni olmamalıdır;
- secret terminal tarixçəsi, issue, Wiki və commit-ə yazılmamalıdır;
- `AUTH_SECRET` versiyasız rotasiya sessiya JWT-lərini etibarsız edir və TOTP secret-lərinin açılmasını poza bilər;
- Resend credential sızma şübhəsində dərhal revoke edilməlidir.
- `CRON_SECRET` əsas Worker və ayrıca cron Worker-də eyni mühit üçün eyni olmalıdır;
- production və staging `CRON_SECRET` dəyərləri bir-birindən fərqli olmalıdır;
- `CLOUDFLARE_ANALYTICS_TOKEN` yalnız `Analytics:Read` icazəsi ilə məhdudlaşdırılmalıdır.

## OpenNext konfiqurasiyası

`open-next.config.ts` R2 incremental cache override istifadə edir. `next.config.ts`:

- `outputFileTracingRoot: import.meta.dirname` ilə workspace kökünü sabitləşdirir;
- Cloudflare binding-lərini local dev üçün init edir;
- Server Action allowed origin-lərini məhdudlaşdırır;
- Cloudflare Images və remote image host-larını təyin edir;
- təhlükəsizlik və immutable media header-ları verir;
- `poweredByHeader`-ı söndürür.

Bu parametrlər deploy workaround-u deyil, cari runtime müqaviləsinin hissəsidir.

## Davamlı inteqrasiya (CI)

`.github/workflows/ci.yml` hər pull request və `main` push-unda `npm ci` → Vitest → typecheck →
lint → production build ardıcıllığını işlədir. `main` push-unda, əgər `CLOUDFLARE_API_TOKEN` və
`CLOUDFLARE_ACCOUNT_ID` secret-ləri qoyulubsa, `npx wrangler d1 migrations list DB --remote` ilə
production miqrasiya drift-i də yoxlanılır.

Pipeline Node versiyasını `.nvmrc`-dən, npm versiyasını isə `package.json` → `packageManager`
sahəsindən götürür. Bu ikinci addım məcburidir: `package-lock.json`-un formatı npm major
versiyasından asılıdır və uyğunsuz npm `npm ci`-ni `EUSAGE` ilə sındırır. Toolchain dəyişəndə
`.nvmrc`, `packageManager` və lock faylı **eyni commit-də** yenilənməlidir.

CI-da Cloudflare kimlik məlumatı yalnız miqrasiya drift addımı üçün istifadə olunur; `npm run build`
credential olmadan da keçməlidir. Bunun üçün `next.config.ts`-dəki `initOpenNextCloudflareForDev()`
çağırışı yalnız development-də işə düşür — əks halda `ai`/`images` binding-ləri üçün açılan remote
proxy sessiyası tokensiz mühitdə build-i sındırır.

CI deploy etmir — yayım hələ manualdır (`npm run deploy`).

## Staging deploy runbook-u

1. İş ağacını və commit-i yoxlayın:

   ```bash
   git status
   git rev-parse HEAD
   ```

2. Keyfiyyət qapısını işlədin:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

   `npm ci` `EUSAGE` verirsə npm versiyanız `package.json` → `packageManager` dəyəri ilə uyğun
   deyil; həll [[İnkişaf təlimatı|Development-Guide]] səhifəsindədir.

3. Secret-lərin mövcudluğunu və staging üçün fərqli olduğunu yoxlayın.
4. Miqrasiyanı və lazım olduqda seed/taksonomiyanı tətbiq edin:

   ```bash
   npm run db:migrate:staging
   npm run db:seed:staging
   npm run db:taxonomy:staging
   ```

   Seed və taksonomiya hər deploy-da avtomatik işlədilmir; yalnız dəyişiklik bunu tələb edirsə istifadə olunur.

5. Deploy edin:

   ```bash
   npm run deploy:staging
   npm run deploy:cron:staging
   ```

6. Smoke test:

   - ana səhifə;
   - AZ/EN/RU locale keçidi və canonical/hreflang;
   - əmlak siyahısı və detail;
   - locale-prefiksli public login/qeydiyyat/kabinet;
   - staff login → TOTP → admin;
   - bir read-only admin səhifəsi;
   - test media upload;
   - `robots.txt` bütün staging-i bloklayır;
   - canonical URL staging URL-dir və metadata noindex-dir;
   - production domeni staging deploy-dan təsirlənməyib.

## Production deploy runbook-u

1. Staging smoke test nəticəsini və deploy ediləcək commit-i təsdiqləyin.
2. D1 schema dəyişikliyi varsa backup/export və rollback planı hazırlayın.
3. Keyfiyyət qapısını həmin commit-də yenidən işlədin.
4. Production secret və binding-lərin adlarını yoxlayın.
5. Miqrasiyanı tətbiq edin:

   ```bash
   npm run db:migrate:remote
   ```

6. Deploy edin:

   ```bash
   npm run deploy
   npm run deploy:cron
   ```

7. Production smoke test aparın.
8. Worker log, 5xx, D1 xəta və Resend uğursuzluqlarını izləyin.
9. Cache/revalidation təsirini yoxlayın.

Production seed, taksonomiya və demo-clean əmrləri deploy runbook-un standart hissəsi deyil. Onlar ayrıca məlumat əməliyyatıdır və explicit təsdiq tələb edir.

## Production smoke checklist-i

- [ ] `/az`, `/en`, `/ru` HTTP 200 və locale keçidi işləyir
- [ ] `/az/emlaklar` filtr və səhifələmə işləyir
- [ ] ən azı bir `/{locale}/emlaklar/[slug]` detail açılır
- [ ] xəritə yalnız koordinat olduqda render olunur
- [ ] favorit LocalStorage-də qalır
- [ ] müqayisə limiti 4-dür
- [ ] `/{locale}/agentlikler` yalnız verified agentlikləri göstərir
- [ ] `/{locale}/terefdaslar` yalnız public görünüş şərtlərini keçən tərəfdaşları göstərir
- [ ] `/{locale}/qeydiyyat` və `/{locale}/daxil-ol` açılır
- [ ] sessiyasız `/{locale}/kabinet` public login-ə yönləndirir
- [ ] sessiyasız `/admin` staff login-ə yönləndirir
- [ ] `/{locale}/admin/...` `/admin/...` canonical marşrutuna 308 qaytarır
- [ ] staff TOTP və admin permission işləyir
- [ ] media yükləmə və `/media/...` delivery işləyir
- [ ] əlaqə formu lead yaradır, Resend konfiqurasiya olunubsa bildiriş gəlir
- [ ] əlaqə formunda honeypot, same-origin və `CONTACT_LIMIT` qoruması işləyir
- [ ] saved-search cron qorunan endpoint-i uğurla çağırır
- [ ] Resend webhook imzasız sorğunu rədd edir və imzalı event-i `EmailActivity`-yə yazır
- [ ] `/sitemap.xml` və `/robots.txt` 200 qaytarır
- [ ] production canonical-lar `https://luxehomeestate.az` göstərir
- [ ] admin/kabinet response `no-store` alır

## Deploy qeydi — 31 avqust 2026

`main` branch-ı production-a yayımlanıb. Aktiv Worker versiyası **`a88cf4ab-6a5e-4b84-a038-2a6c82f0ae92`**;
`luxehomeestate.az` və `www.luxehomeestate.az` custom domain-ləri həmin versiyaya bağlıdır.
Deploy öncəsi vəziyyət:

| Yoxlama | Nəticə |
|---|---|
| `npm run test` | ✅ 89 fayl, 373 test |
| `npm run typecheck` | ✅ Keçdi |
| `npm run lint` | ✅ Keçdi |
| `npm run build` | ✅ Keçdi |
| `npx wrangler d1 migrations list DB --remote` | ✅ `No migrations to apply` (`0025` daxil tətbiq olunub) |

Deploy sonrası brauzer User-Agent-i ilə `/`, `/az`, `/en`, `/ru`, `/az/emlaklar`,
`/az/bilik-merkezi`, `/az/kalkulyator`, `/sitemap.xml`, `/sitemap-index.xml`, `/robots.txt` və
`/llms.txt` marşrutları 200 qaytarıb. `luxehomeestate-cron` Worker-i 27 avqustdan bəri
dəyişmədiyi üçün yenidən yayımlanmayıb.

Eyni gündə GitHub Actions CI-nın davamlı uğursuzluğu da aradan qaldırılıb; səbəb tətbiq kodunda
deyil, `npm ci` mərhələsindəki npm/lock formatı uyğunsuzluğunda idi.

## Canlı audit qeydi — 28 avqust 2026

`main@ed93ba4` kodu Worker deploy `11ade039-1f72-4777-b1e7-33df3376aef9` üzərində yoxlanıb. D1-də qarışıq tarix formatlarının Prisma adapterini çökdürməsi `0019_normalize_d1_datetime_storage.sql` ilə aradan qaldırılıb; public sayt və admin panel həmin deploy-dan sonra yenidən əlçatan olub.

Browser User-Agent ilə aşağıdakı nəticələr alınıb:

| URL | Nəticə |
|---|---|
| `/az`, `/en`, `/ru` | 200 |
| `/az/emlaklar` | 200 |
| `/az/agentlikler` | 200 |
| `/az/terefdaslar` | 200 |
| `/az/muqayise` | 200 |
| `/az/qeydiyyat` | 200 |
| `/admin` | `/az/giris?davam=%2Fadmin&yeniden=1`-ə redirect, final 200 |
| `/az/admin/audit?sehife=2` | `/admin/audit?sehife=2`-yə 308 |
| `/sitemap.xml` | 200 |
| `/robots.txt` | 200 |

Cloudflare Managed Content/Bot qaydası default CLI User-Agent ilə bəzi HTML route-larına 403 qaytara bilər. Smoke və uptime monitoru üçün təşkilatın icazə verdiyi monitor/User-Agent istifadə olunmalı, bu davranış tətbiqin 5xx xətası kimi şərh edilməməlidir.

## Sitemap və robots əməliyyatı

Production `robots.txt` Cloudflare Managed Content Signals blokundan sonra tətbiqin öz qaydalarını da verir:

- locale-prefiksli public route-lar allow;
- `/admin`, `/giris`, `/favoritler` disallow;
- sitemap və host production domeninə bağlıdır.

Staging `IS_STAGING=true` olduqda tətbiq bütün route-ları disallow edir.

Sitemap D1-dən public property, project, service, blog, agency, partner, Bilik Mərkəzi və idarə
olunan SEO landing qeydlərini oxuyur; AZ/EN/RU alternativləri ilə statik SEO səhifələrini də daxil
edir. `/sitemap.xml`-dən əlavə locale və entity üzrə bölünmüş `/sitemap-index.xml` və
`/sitemaps/[feed]` feed-ləri verilir. Yeni indexlənən route əlavə ediləndə `src/app/sitemap.ts`,
feed mənbələri və locale alternativləri birlikdə yenilənməlidir.

## Miqrasiya təhlükəsizliyi

- Migration source control-da saxlanır.
- Prisma diff SQL-i review edilmədən tətbiq olunmur.
- Destruktiv dəyişiklik backup və restore planı tələb edir.
- D1 transaction məhdudluğu nəzərə alınır.
- Schema və tətbiq deploy sırası backward-compatible planlanır.
- Seed migration əvəzi deyil.
- Staging D1 production məlumatının yeganə backup-u sayılmır.
- Prisma `DateTime` sahələri D1-də ISO-8601 mətn kimi saxlanmalıdır; Unix integer və ISO mətnin qarışması runtime parse xətası yaradır.
- Tarix formatı dəyişikliklərində `0019_normalize_d1_datetime_storage.sql` miqrasiyasının invariantı qorunmalıdır.

### Rollback yanaşması

Kod rollback-i əvvəlki Worker deploy-a qayıtmaqla mümkündür, lakin schema rollback avtomatik deyil. Ona görə təhlükəsiz migration adətən:

1. additive sütun/cədvəl;
2. hər iki schema variantını qəbul edən kod;
3. data backfill;
4. yeni koda keçid;
5. ayrıca sonrakı cleanup

ardıcıllığı ilə hazırlanır.

## Backup və bərpa

Repo hazırda avtomatlaşdırılmış D1 backup/restore job-u saxlamır. Production əməliyyatı üçün ayrıca:

- planlı D1 export;
- R2 inventory və lifecycle;
- backup retention;
- restore test/drill;
- RPO/RTO hədəfi;
- məsul şəxs və insident əlaqə siyahısı

müəyyən edilməlidir.

## Observability

Wrangler observability production və staging üçün aktivdir. Tətbiq səviyyəsində error tracking və strukturlaşdırılmış log platforması ayrıca inteqrasiya edilməyib.

İzlənməli siqnallar:

- Worker 5xx və CPU limit;
- D1 sorğu xətası və latency;
- login `RATE_LIMITED`, `LOCKED`, `BAD_TOTP` artımı;
- media conversion/R2 rollback xətası;
- Resend delivery xətası;
- Resend webhook signature/processing xətası və `EmailActivity` statusları;
- saved-search cron çağırışı, digest nəticəsi və `CRON_SECRET` uyğunsuzluğu;
- admin audit log-da kütləvi dəyişiklik;
- sitemap və robots əlçatanlığı;
- cache hit/revalidation problemləri.

## İnsident zamanı

1. Təsiri və hədəf mühiti müəyyən edin.
2. Dəlili silmədən log/commit/deploy ID-ni qoruyun.
3. Oğurlanmış credential varsa revoke/rotate edin.
4. Staff user risklidirsə deaktiv edin və sessiyalarını revoke edin.
5. Zərərli media və ya kontent varsa public görünüşü dayandırın, sübutu qoruyun.
6. Data dəyişibsə backup və audit log ilə scope müəyyən edin.
7. Təhlükəsiz əvvəlki Worker deploy-a rollback edin; schema uyğunluğunu ayrıca yoxlayın.
8. İstifadəçi və hüquqi bildiriş öhdəliyini qiymətləndirin.
9. Postmortem və qarşısını alan action item-lər yazın.
