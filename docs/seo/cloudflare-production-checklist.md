# Cloudflare production SEO checklist

Tarix: 24 avqust 2026

Bu sənəd kodda avtomatik edilə bilməyən edge konfiqurasiyasını təsvir edir. Canonical host
`https://luxehomeestate.az`-dır. Tətbiq middleware-i fallback 308 verir, amma əsas redirect
Cloudflare edge-də origin-ə çatmadan işləməlidir.

## 1. DNS və bir-hop canonical redirect

1. `luxehomeestate.az` və `www.luxehomeestate.az` DNS qeydlərinin proxied olduğunu yoxlayın.
2. Rules > Redirect Rules > Single Redirects bölməsində ən yüksək prioritetli qayda yaradın.
3. Match expression:

   ```text
   (http.host ne "luxehomeestate.az" or http.request.full_uri wildcard r"http://*")
   ```

4. Dynamic target expression path və query-ni qoruyaraq apex HTTPS URL qurmalıdır:

   ```text
   concat("https://luxehomeestate.az", http.request.uri.path)
   ```

   Dashboard query string-i qoruma seçimi verirsə onu aktiv edin. Alternativ olaraq rəsmi
   `www` -> root nümunəsinin expression-ını domenə uyğunlaşdırın.
5. Status `301` seçin. Application fallback-i 308-dir; edge qaydası aktiv olduqda istifadəçiyə
   yalnız edge 301 görünəcək.
6. Yoxlama:

   ```bash
   curl -I http://www.luxehomeestate.az/emlaklar?sehife=2
   curl -I https://www.luxehomeestate.az/emlaklar?sehife=2
   curl -I http://luxehomeestate.az/emlaklar?sehife=2
   ```

   Hər üçü bir redirect hop-da
   `https://luxehomeestate.az/emlaklar?sehife=2` qaytarmalıdır. Rəsmi istinad:
   [Redirect from WWW to root](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/).

## 2. TLS və HSTS

Canlı auditdə `Strict-Transport-Security: max-age=15552000` artıq görünür. Kod production
cavabına `max-age=31536000; includeSubDomains; preload` fallback-i əlavə edir. Edge və origin
dəyərlərini zidd saxlamayın:

1. SSL/TLS > Edge Certificates > HSTS bölməsini açın.
2. Bütün subdomain-lərin HTTPS dəstəyi təsdiqlənmədən `includeSubDomains` aktiv etməyin.
3. Preload yalnız bütün hostların uzunmüddətli HTTPS öhdəliyi təsdiqləndikdən sonra aktiv edilsin.
4. Dəyişiklikdən sonra apex və `www` cavab header-lərini ayrıca yoxlayın.

HSTS-ni sonradan düşünülmədən söndürmək mümkün deyil; HTTPS əvvəl söndürülərsə istifadəçilər
max-age müddətində sayta daxil ola bilməz. Rəsmi istinad:
[Cloudflare HSTS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/).

## 3. Verified search bot və WAF

1. Security > Security rules bölməsində verified bot exception qaydasını bütün challenge/block
   qaydalarından əvvəl yerləşdirin.
2. Free/Pro uyğun expression: `(cf.client.bot)`; action `Skip`, mümkün olan müvafiq custom/WAF
   qaydalarını skip etsin.
3. Enterprise Bot Management varsa `cf.bot_management.verified_bot` sahəsi istifadə oluna bilər.
4. `/robots.txt` və `/sitemap.xml` üçün ayrıca hamıya açıq bypass yalnız mövcud qayda həmin
   route-ları challenge edirsə əlavə olunsun; auth/admin müdafiəsini geniş skip etməyin.
5. Security Events-də Googlebot/Bingbot request-lərini, Cloudflare Verified Bot statusunu və
   action nəticəsini yoxlayın.
6. GSC URL Inspection və Live Test ilə `/`, `/emlaklar`, bir property URL və sitemap-ı test edin.

Rəsmi istinadlar:
[Allow verified bots](https://developers.cloudflare.com/waf/custom-rules/use-cases/allow-traffic-from-verified-bots/),
[Skip action](https://developers.cloudflare.com/waf/custom-rules/skip/).

## 4. Staging və preview

- Staging deploy-da `IS_STAGING=true` və staging `SITE_URL` mütləq verilir.
- Middleware bütün public staging cavablarına `X-Robots-Tag: noindex, nofollow` əlavə edir.
- `robots.txt` staging-də `Disallow: /` verir və sitemap elan etmir.
- Preview host heç vaxt production canonical host kimi sitemap və metadata yaratmamalıdır.
- Deploy sonrası `curl -I` ilə X-Robots-Tag, HTML-də robots meta və robots.txt birlikdə yoxlanır.

## 5. Cache və müşahidə

- Public HTML üçün `private, no-store` baseline P1 cache task-ında dəyişdiriləcək.
- Auth, kabinet və admin həmişə `no-store` qalmalıdır.
- Cache rule deploy-dan sonra `CF-Cache-Status`, `Age`, `Server-Timing` və content freshness
  yoxlanmalıdır.
- Security Events, Cache Analytics və GSC Crawl Stats ilk 14 gün gündəlik, sonra həftəlik izlənir.

## 6. Rollback

1. Yanlış redirectdə əvvəl Cloudflare Single Redirect-i disable edin; tətbiq 308 fallback-i qalır.
2. HSTS-i yalnız rəsmi prosedurla əvvəl `max-age=0` verərək və əvvəlki max-age müddətini nəzərə
   alaraq geri qaytarın.
3. Verified bot skip təhlükəsizlik riski yaradırsa bütün skip-i deyil, expression/scope-u daraldın;
   GSC və Security Events ilə yenidən yoxlayın.
4. Staging production-a canonical verirsə deploy-u saxlayın, `IS_STAGING`/`SITE_URL` dəyişənlərini
   düzəldib yenidən build edin.
