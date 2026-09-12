import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import {
  countdownTargetMs,
  localizedValue,
  type SystemModeConfig,
} from "@/lib/system-mode-policy";

/**
 * Texniki xidmət cavabı.
 *
 * **Niyə tam müstəqil HTML, Next.js səhifəsi deyil.** Cavab middleware-dən —
 * yəni sorğunun ən erkən mərhələsindən — qaytarılır. Next server-i heç işə
 * düşmür, ona görə:
 *
 * - əsas tətbiq UI-si render olunmur (tələb: «əvvəl səhifə görünüb sonra
 *   maintenance-ə keçmə»);
 * - status kodu tam nəzarətdədir. `NextResponse.rewrite()` rewrite edilən
 *   səhifənin statusunu (200) saxlayır və 503 vermək mümkün olmur;
 * - D1/R2 sorğusu, CSS bundle-ı, şəkil və şrift yüklənmir — səhifə tək
 *   cavabda tamamlanır, yəni sayt həqiqətən çətin vəziyyətdə olsa belə açılır.
 *
 * Stil inline-dır: Tailwind sinifləri `_next/static/css/...` faylından gəlir,
 * onun adı isə build-dən buildə dəyişir və middleware onu bilmir.
 */

type MaintenanceStrings = {
  documentTitle: string;
  badge: string;
  heading: string;
  body: string;
  expectedLabel: string;
  countdownLabel: string;
  /** Bir gündən uzun geri sayımda rəqəmin yanındakı qısaltma. */
  dayShort: string;
  rights: string;
  ownership: string;
};

/**
 * Səhifənin mətnləri.
 *
 * `src/i18n/locales/*` kataloqları qəsdən istifadə olunmur: onlar
 * `next-intl`-in request konfiqurasiyası ilə yüklənir və middleware-də
 * mövcud deyil. Üç qısa mətn dəsti burada saxlanılır — kataloqu middleware
 * bundle-ına çəkmək bir neçə yüz kilobayt üçün ödənilən yüksək qiymət olardı.
 *
 * Paneldən yazılmış başlıq/açıqlama bu defoltları əvəz edir.
 */
const STRINGS: Record<Locale, MaintenanceStrings> = {
  az: {
    documentTitle: "Texniki xidmət",
    badge: "Texniki xidmət aparılır",
    heading: "Saytımız müvəqqəti əlçatmazdır",
    body: `${siteConfig.name} platformasında planlaşdırılmış texniki və təkmilləşdirmə işləri aparılır. Xidmətlərimiz qısa müddət sonra yenidən əlçatan olacaq.`,
    expectedLabel: "Təxmini açılış",
    countdownLabel: "Təxmini açılışa qalıb",
    dayShort: "gün",
    rights: "Bütün hüquqlar qorunur.",
    ownership: `${siteConfig.name} brendi ${siteConfig.owner.name}-a məxsusdur.`,
  },
  en: {
    documentTitle: "Scheduled maintenance",
    badge: "Maintenance in progress",
    heading: "Our website is temporarily unavailable",
    body: `Planned maintenance and improvements are under way on the ${siteConfig.name} platform. Our services will be available again shortly.`,
    expectedLabel: "Expected back",
    countdownLabel: "Estimated time remaining",
    dayShort: "d",
    rights: "All rights reserved.",
    ownership: `The ${siteConfig.name} brand belongs to ${siteConfig.owner.name}.`,
  },
  ru: {
    documentTitle: "Технические работы",
    badge: "Идут технические работы",
    heading: "Сайт временно недоступен",
    body: `На платформе ${siteConfig.name} проводятся плановые технические работы и улучшения. Наши услуги снова станут доступны в ближайшее время.`,
    expectedLabel: "Ожидаемое время открытия",
    countdownLabel: "Примерно осталось",
    dayShort: "дн.",
    rights: "Все права защищены.",
    ownership: `Бренд ${siteConfig.name} принадлежит ${siteConfig.owner.name}.`,
  },
};

/** Paneldən gələn mətn HTML-ə düşür — hər dəyər qaçırılır. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoment(iso: string, locale: Locale): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Baku",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function renderHtml(config: SystemModeConfig, locale: Locale, now: Date): string {
  const strings = STRINGS[locale] ?? STRINGS[DEFAULT_LOCALE];

  const heading = localizedValue(config.title, locale) ?? strings.heading;
  const body = localizedValue(config.description, locale) ?? strings.body;
  const expected = config.expectedBackAt ? formatMoment(config.expectedBackAt, locale) : null;
  const countdownTarget = countdownTargetMs(config, now);
  const year = now.getFullYear();

  return `<!doctype html>
<html lang="${locale}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(strings.documentTitle)} · ${escapeHtml(siteConfig.name)}</title>
<style>
  /* Brend tokenleri globals.css dəyərləri ilə eynidir. Səhifə
     qəsdən tək (tünd) görünüşdədir: tema seçimi next-themes client
     skriptindən gəlir, o isə burada yüklənmir. */
  :root {
    --navy: #17202b;
    --navy-soft: #202c39;
    --ivory: #f7f3ec;
    --ink-invert: #f7f4ef;
    --ink-invert-soft: #b9c0c9;
    --gold: #aa8754;
    --gold-soft: #c4a575;
    --line: rgba(212, 197, 170, 0.18);
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      radial-gradient(120% 90% at 50% -10%, var(--navy-soft) 0%, var(--navy) 60%),
      var(--navy);
    color: var(--ink-invert);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  main {
    width: 100%;
    max-width: 640px;
    text-align: center;
  }
  /* flex (inline-flex deyil) qəsdəndir: valideyn text-align:center daşıyır
     və inline element kimi qalsaydı, brend bloku ilə status badge-i eyni
     sətirdə axardı. */
  .brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-bottom: 28px;
  }
  .brand-name {
    font-size: clamp(20px, 4.2vw, 26px);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ivory);
  }
  .brand-rule {
    width: min(100%, 260px);
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .brand-slogan {
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold-soft);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 7px 16px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: rgba(170, 135, 84, 0.1);
    font-size: 13px;
    font-weight: 500;
    color: var(--gold-soft);
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--gold-soft);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.82); }
  }
  h1 {
    margin: 22px 0 14px;
    font-size: clamp(26px, 6vw, 40px);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .body {
    margin: 0 auto;
    max-width: 52ch;
    font-size: clamp(15px, 2.4vw, 17px);
    color: var(--ink-invert-soft);
  }
  .panel {
    margin-top: 32px;
    padding: 20px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: rgba(247, 243, 236, 0.04);
  }
  .panel-label {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-invert-soft);
  }
  .countdown {
    margin-top: 8px;
    font-size: clamp(24px, 6.5vw, 38px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    color: var(--gold-soft);
  }
  .expected {
    margin-top: 8px;
    font-size: 15px;
    font-weight: 500;
    color: var(--ivory);
  }
  footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--line);
    font-size: 12px;
    color: var(--ink-invert-soft);
  }
  footer p { margin: 3px 0; }
  @media (max-width: 420px) {
    .panel { padding: 16px; }
    footer { margin-top: 30px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot { animation: none; }
  }
</style>
</head>
<body>
<main role="main">
  <div class="brand">
    <span class="brand-name">${escapeHtml(siteConfig.name)}</span>
    <span class="brand-rule" aria-hidden="true"></span>
    <span class="brand-slogan">${escapeHtml(siteConfig.slogan)}</span>
  </div>

  <p class="badge"><span class="dot" aria-hidden="true"></span>${escapeHtml(strings.badge)}</p>

  <h1>${escapeHtml(heading)}</h1>
  <p class="body">${escapeHtml(body)}</p>

  ${
    countdownTarget
      ? `<section class="panel" aria-live="off">
    <p class="panel-label">${escapeHtml(strings.countdownLabel)}</p>
    <p class="countdown" id="countdown" data-target="${countdownTarget}" data-day="${escapeHtml(strings.dayShort)}">--:--:--</p>
  </section>`
      : expected
        ? `<section class="panel">
    <p class="panel-label">${escapeHtml(strings.expectedLabel)}</p>
    <p class="expected">${escapeHtml(expected)}</p>
  </section>`
        : ""
  }

  <footer>
    <p>&copy; ${year} ${escapeHtml(siteConfig.legalName)}. ${escapeHtml(strings.rights)}</p>
    <p>${escapeHtml(strings.ownership)}</p>
  </footer>
</main>
${
  countdownTarget
    ? `<script>
/* Geri sayım yalnız informativdir: vaxt bitəndə səhifə özünü yeniləmir və
   sistem rejimini dəyişmir. Rejimi yalnız admin paneli (və ya fövqəladə
   mühit override-u) dəyişə bilər. */
(function () {
  var el = document.getElementById("countdown");
  if (!el) return;
  var target = Number(el.getAttribute("data-target"));
  var dayLabel = el.getAttribute("data-day") || "";
  function pad(value) { return value < 10 ? "0" + value : String(value); }
  function tick() {
    var left = Math.max(0, target - Date.now());
    var total = Math.floor(left / 1000);
    /* Sutkadan uzun müddət gün kimi ayrılır: planlaşdırılmış iş bir neçə gün
       çəkəndə "312:00:00" ziyarətçiyə heç nə demir. */
    var days = Math.floor(total / 86400);
    var rest = total % 86400;
    var clock =
      pad(Math.floor(rest / 3600)) + ":" +
      pad(Math.floor((rest % 3600) / 60)) + ":" +
      pad(rest % 60);
    el.textContent = days > 0 ? days + " " + dayLabel + " " + clock : clock;
    if (left <= 0) clearInterval(timer);
  }
  tick();
  var timer = setInterval(tick, 1000);
})();
</script>`
    : ""
}
</body>
</html>`;
}

/**
 * 503 texniki xidmət cavabı.
 *
 * Başlıqlar tələb olunan davranışı verir:
 *
 * - `503` — «xidmət müvəqqəti yoxdur». Axtarış sistemləri bunu müvəqqəti
 *   sayır və indeksdəki səhifələri silmir; `404` və ya `200` isə sıralamanı
 *   zədələyərdi.
 * - `Retry-After: 3600` — botlara nə vaxt qayıtmağı deyir.
 * - `X-Robots-Tag: noindex, nofollow` — texniki xidmət mətninin özü heç vaxt
 *   indeksə düşməməlidir.
 * - `Cache-Control: no-store, ...` + `CDN-Cache-Control` — Cloudflare kənar
 *   keşi bu cavabı saxlamamalıdır, əks halda rejim söndürüləndən sonra bir
 *   hissə ziyarətçi hələ də bağlı səhifəni görərdi.
 * - `Vary: Accept-Language, Cookie` — cavab dilə və sessiyaya görə dəyişir
 *   (super admin bypass alır), ona görə paylaşılan keş üçün ayrı variantdır.
 */
export function maintenanceResponse(
  config: SystemModeConfig,
  locale: Locale,
  now: Date = new Date(),
): Response {
  return new Response(renderHtml(config, locale, now), {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Language": locale,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
      Pragma: "no-cache",
      Expires: "0",
      "Retry-After": "3600",
      "X-Robots-Tag": "noindex, nofollow",
      Vary: "Accept-Language, Cookie",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      // Səhifə tam müstəqildir: kənar mənbə yükləmir, yalnız öz inline
      // stilini və geri sayım skriptini işlədir.
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}
