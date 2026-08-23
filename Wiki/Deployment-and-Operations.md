# Deployment və əməliyyatlar

Tətbiq `@opennextjs/cloudflare` ilə Cloudflare Worker formatına çevrilir. Production və staging resursları `wrangler.jsonc` daxilində ayrı təyin olunub.

## Mühit matrisi

| Resurs | Production | Staging |
|---|---|---|
| Worker | `luxehomeestate` | `luxehomeestate-staging` |
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
| `MEDIA` | R2 | Yüklənən şəkillər |
| `NEXT_INC_CACHE_R2_BUCKET` | R2 | OpenNext incremental cache |
| `IMAGES` | Images | Resize, info və WebP output |
| `WORKER_SELF_REFERENCE` | Service | Revalidation self-call |
| `LOGIN_LIMIT` | Rate limit | Login və public qeydiyyat |
| `CONTACT_LIMIT` | Rate limit | Əlaqə forması üçün rezerv; action-a hələ qoşulmayıb |
| `ADMIN_LIMIT` | Rate limit | Admin/public listing mutation-ları |

## Secret-lər

Hər mühit üçün ayrıca təyin olunur:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
npx wrangler secret put NOTIFICATION_EMAIL
```

Staging:

```bash
npx wrangler secret put AUTH_SECRET --env staging
npx wrangler secret put RESEND_API_KEY --env staging
npx wrangler secret put RESEND_FROM_EMAIL --env staging
npx wrangler secret put NOTIFICATION_EMAIL --env staging
```

Qaydalar:

- production və staging `AUTH_SECRET` eyni olmamalıdır;
- secret terminal tarixçəsi, issue, Wiki və commit-ə yazılmamalıdır;
- `AUTH_SECRET` versiyasız rotasiya sessiya JWT-lərini etibarsız edir və TOTP secret-lərinin açılmasını poza bilər;
- Resend credential sızma şübhəsində dərhal revoke edilməlidir.

## OpenNext konfiqurasiyası

`open-next.config.ts` R2 incremental cache override istifadə edir. `next.config.ts`:

- `outputFileTracingRoot: import.meta.dirname` ilə workspace kökünü sabitləşdirir;
- Cloudflare binding-lərini local dev üçün init edir;
- Server Action allowed origin-lərini məhdudlaşdırır;
- Cloudflare Images və remote image host-larını təyin edir;
- təhlükəsizlik və immutable media header-ları verir;
- `poweredByHeader`-ı söndürür.

Bu parametrlər deploy workaround-u deyil, cari runtime müqaviləsinin hissəsidir.

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
   ```

6. Smoke test:

   - ana səhifə;
   - əmlak siyahısı və detail;
   - public login/qeydiyyat/kabinet;
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
   ```

7. Production smoke test aparın.
8. Worker log, 5xx, D1 xəta və Resend uğursuzluqlarını izləyin.
9. Cache/revalidation təsirini yoxlayın.

Production seed, taksonomiya və demo-clean əmrləri deploy runbook-un standart hissəsi deyil. Onlar ayrıca məlumat əməliyyatıdır və explicit təsdiq tələb edir.

## Production smoke checklist-i

- [ ] `/` HTTP 200 və loqo/tema işləyir
- [ ] `/emlaklar` filtr və səhifələmə işləyir
- [ ] ən azı bir `/emlaklar/[slug]` detail açılır
- [ ] xəritə yalnız koordinat olduqda render olunur
- [ ] favorit LocalStorage-də qalır
- [ ] müqayisə limiti 4-dür
- [ ] `/agentlikler` yalnız verified agentlikləri göstərir
- [ ] `/qeydiyyat` və `/daxil-ol` açılır
- [ ] sessiyasız `/kabinet` public login-ə yönləndirir
- [ ] sessiyasız `/admin` staff login-ə yönləndirir
- [ ] staff TOTP və admin permission işləyir
- [ ] media yükləmə və `/media/...` delivery işləyir
- [ ] əlaqə formu lead yaradır, Resend konfiqurasiya olunubsa bildiriş gəlir
- [ ] `/sitemap.xml` və `/robots.txt` 200 qaytarır
- [ ] production canonical-lar `https://luxehomeestate.az` göstərir
- [ ] admin/kabinet response `no-store` alır

## Canlı audit qeydi — 23 avqust 2026

Browser User-Agent ilə aşağıdakı nəticələr alınıb:

| URL | Nəticə |
|---|---|
| `/` | 200 |
| `/emlaklar` | 200 |
| `/agentlikler` | 200 |
| `/muqayise` | 200 |
| `/qeydiyyat` | 200 |
| `/admin` | `/giris?davam=%2Fadmin&yeniden=1`-ə redirect, final 200 |
| `/sitemap.xml` | 200 |
| `/robots.txt` | 200 |

Cloudflare Managed Content/Bot qaydası default CLI User-Agent ilə bəzi HTML route-larına 403 qaytara bilər. Smoke və uptime monitoru üçün təşkilatın icazə verdiyi monitor/User-Agent istifadə olunmalı, bu davranış tətbiqin 5xx xətası kimi şərh edilməməlidir.

## Sitemap və robots əməliyyatı

Production `robots.txt` Cloudflare Managed Content Signals blokundan sonra tətbiqin öz qaydalarını da verir:

- public route-lar allow;
- `/admin`, `/giris`, `/favoritler` disallow;
- sitemap və host production domeninə bağlıdır.

Staging `IS_STAGING=true` olduqda tətbiq bütün route-ları disallow edir.

Sitemap D1-dən public property, project, service və blog qeydlərini oxuyur. Statik siyahıya yeni indexlənən route əlavə edildikdə `src/app/sitemap.ts` də yenilənməlidir.

## Miqrasiya təhlükəsizliyi

- Migration source control-da saxlanır.
- Prisma diff SQL-i review edilmədən tətbiq olunmur.
- Destruktiv dəyişiklik backup və restore planı tələb edir.
- D1 transaction məhdudluğu nəzərə alınır.
- Schema və tətbiq deploy sırası backward-compatible planlanır.
- Seed migration əvəzi deyil.
- Staging D1 production məlumatının yeganə backup-u sayılmır.

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
