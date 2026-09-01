# Browser E2E

Playwright dəsti. Testlər **canlı mühitə qarşı** işləyir — build artefaktına deyil,
faktiki yayımlanmış worker-ə.

## İşlətmə

```bash
npm run e2e              # bütün layihələr (chromium + mobile)
npm run e2e:chromium     # yalnız desktop
npm run e2e:mobile       # yalnız mobil
npm run e2e:ui           # interaktiv rejim (debug üçün)
npm run e2e:report       # son hesabatı aç
```

Hədəf mühit `E2E_BASE_URL` ilə seçilir, defolt staging-dir:

```bash
E2E_BASE_URL=https://luxehomeestate.az npm run e2e
```

### Lokal işlətmə

`next dev` **etibarlı hədəf deyil**: Prisma-nın wasm engine-i dev serverində
yüklənmir və D1-dən oxuyan hər səhifə 500 qaytarır. Production ilə eyni davranışı
yalnız workerd verir:

```bash
npm run preview                                   # ayrıca terminalda
E2E_BASE_URL=http://localhost:8787 npm run e2e
```

## Struktur

| Yol | Məzmun |
|---|---|
| `support/helpers.ts` | Davranış köməkçiləri — naviqasiya, JSON-LD, konsol, hidratasiya |
| `pages/*.page.ts` | Səhifə obyektləri — **seçicilər yalnız burada** |
| `specs/*.spec.ts` | Testlər |

Seçicilərin səhifə obyektlərində toplanması qəsdəndir: UI dəyişəndə yalnız bir
fayl yenilənir.

## Test qatları

| Spec | Nə yoxlayır |
|---|---|
| `smoke` | Hər ictimai marşrut 200, locale prefiksi, konsol xətaları |
| `listings` | Filtr, axtarış, sıralama, səhifələmə — URL müqaviləsi |
| `property-detail` | Detal səhifəsi, qalereya, 404 statusu, canonical |
| `favorites-compare` | `localStorage` → Server Action zənciri |
| `content` | Layihə, bloq, xidmət, bilik mərkəzi, kalkulyator |
| `i18n` | Üç dil, hreflang, tərcümə bütövlüyü |
| `api` | `/api/*` qorunması, media proxy, path traversal |
| `seo` | Metadata, Open Graph, JSON-LD, sitemap, robots |
| `security` | Panel qorunması, cookie bayraqları, başlıqlar, sirr sızması |
| `performance` | Resurs büdcəsi, CLS, TTFB, şəkil optimizasiyası |
| `a11y` | WCAG (axe-core), klaviatura, semantik struktur, dark kontrast |
| `mobile` | Çekmece, üfüqi sürüşmə, toxunma hədəfləri |

## Yazma qaydaları

**Məzmun sayından asılı olma.** Staging-də nümunə məzmun açıqdır (300+ elan),
production-da isə yalnız real qeydlər var. Testlər hər ikisində keçməlidir:

```ts
const total = (await listings.resultCount()) ?? 0;
test.skip(total === 0, "kataloq boşdur");
```

**Slug hardcode etmə.** Konkret elana bağlanmaq əvəzinə kataloqdan ilk elementi
götür — məzmun dəyişəndə test sınmır.

**Hidratasiyanı nəzərə al.** Server HTML-i düyməni dərhal göstərir, lakin React
hidratasiya edənə qədər `onClick` bağlanmır: `domcontentloaded`-dan sonrakı klik
səssizcə itir. İnteraktiv testlər `clickUntil()` işlədir.

**Semantik seçici seç.** Layihədə `data-testid` yoxdur; rol, `aria-label` və
mətn işlədilir. React-in generasiya etdiyi `id` dəyərləri sabit deyil — `select`
elementləri `name` atributu ilə seçilir.

## CI

Axın: `quality → deploy-staging → e2e-staging → deploy-production`.

E2E staging yayımından **sonra**, production yayımından **əvvəl** işləyir —
uğursuz olarsa production yayımı baş vermir. Hesabat `playwright-report`
artefaktı kimi 14 gün saxlanılır.

## Bilinən mühit fərqləri

| Davranış | Production | Staging |
|---|---|---|
| Nümunə məzmun | yoxdur | açıqdır (300+ elan) |
| `robots.txt` | normal | tam `Disallow: /` |
| `meta robots` | indekslənir | `noindex` |
| HSTS | var | yoxdur (`workers.dev` zona qaydalarından kənardır) |

Sitemap **hər iki mühitdə production hostunu** yazır (`src/app/sitemap.ts`):
unudulmuş env dəyəri indeksdə alternativ host yaratmasın deyə canonical host
qəsdən sabitdir.
