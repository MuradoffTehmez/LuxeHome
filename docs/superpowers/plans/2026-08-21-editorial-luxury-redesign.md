# Editorial Luxury Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Luxe Home Estate ictimai saytını funksional davranışı dəyişmədən işıqlı, editorial və premium daşınmaz əmlak təcrübəsinə çevirmək.

**Architecture:** Mövcud Next.js App Router və Tailwind CSS v4 strukturu qorunacaq. Dəyişikliklər əvvəl global design token və UI primitivlərində, sonra sayt komponentlərində, sonda ana səhifənin asimmetrik kompozisiyasında tətbiq ediləcək; Prisma data shape-ləri və query müqavilələri dəyişməyəcək.

**Tech Stack:** Next.js 15.5, React 19, TypeScript strict, Tailwind CSS v4, `next/image`, `lucide-react`, Vitest, Cloudflare/OpenNext.

**Spec:** `docs/superpowers/specs/2026-08-21-editorial-luxury-redesign-design.md`

## Global Constraints

- Yalnız təqdimat qatını dəyiş; route, query param, Prisma, D1, auth, admin və Server Action davranışını dəyişmə.
- İstifadəçiyə görünən mətnlər Azərbaycan dilində qalmalıdır.
- Yeni UI dependency-si əlavə etmə.
- Dark mode üçün `dark:` prefiksi yazma; mövcud semantik token sistemini istifadə et.
- `Section` boşluğunu `spacing` propu ilə idarə et.
- `PropertyCardData`, `ProjectCardData` və `PostCardData` shape-lərini dəyişmə.
- Minimum toxunma sahəsi 44 px, görünən focus state və WCAG AA kontrastı qorunmalıdır.
- `prefers-reduced-motion` bütün yeni motion davranışlarını söndürməlidir.
- Hər task sonunda `tsc --noEmit` və ESLint işləməlidir.
- Yekunda Vitest, Next.js production build və responsive browser yoxlaması keçməlidir.

## File Responsibility Map

| Fayl | Məsuliyyət |
|---|---|
| `src/app/globals.css` | Token, kölgə, tipoqrafiya və progressive reveal |
| `src/components/ui/container.tsx` | Section səthləri və şaquli ritm |
| `src/components/ui/section-header.tsx` | Editorial heading iyerarxiyası |
| `src/components/ui/button.tsx` | CTA səviyyələri və interaksiya state-ləri |
| `src/components/ui/reveal.tsx` | Progressive enhancement əsaslı scroll reveal |
| `src/components/site/logo.tsx` | Responsiv wordmark |
| `src/components/site/navbar.tsx` | Desktop/tablet/mobile naviqasiya |
| `src/components/site/hero.tsx` | Editorial hero və discovery sahəsi |
| `src/components/site/search-panel.tsx` | Hero/page filter kompozisiyası |
| `src/components/site/property-card.tsx` | Standard və featured əmlak kartları |
| `src/components/site/project-card.tsx` | Editorial layihə kartı |
| `src/components/site/post-card.tsx` | Standard və featured bloq kartları |
| `src/components/site/footer.tsx` | Yığcam brend, əlaqə və hüquqi naviqasiya |
| `src/app/(site)/page.tsx` | Ana səhifənin asimmetrik kompozisiyası |

---

### Task 1: Design tokenləri və progressive enhancement bazası

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/container.tsx`
- Modify: `src/components/ui/reveal.tsx`

**Interfaces:**
- Consumes: mövcud Tailwind v4 `@theme`, `.dark`, `Section` və `Reveal` API-ləri.
- Produces: dəyişməyən `Section` prop müqaviləsi və JavaScript geciksə də görünən `Reveal`.

- [ ] **Step 1: Mövcud token və reveal baseline-ını yoxla**

```powershell
rg -n -- "--color-(ivory|beige|paper|gold)|--shadow-|\[data-reveal\]" src/app/globals.css
```

Expected: mövcud səth tokenləri və ilkin `opacity: 0` reveal qaydası görünür.

- [ ] **Step 2: İsti editorial palitranı tətbiq et**

```css
--color-ivory: #f7f3ec;
--color-beige: #eee6da;
--color-beige-deep: #e2d6c6;
--color-paper: #fcfaf6;
--color-charcoal: #1b1a18;
--color-charcoal-soft: #292724;
--color-navy: #17202b;
--color-navy-soft: #202c39;
--color-gold: #aa8754;
--color-gold-soft: #c4a575;
--color-gold-deep: #806237;
--shadow-editorial: 0 24px 70px rgb(37 31 23 / 0.12);
```

Dark tokenlər eyni isti hue ailəsində qalmalı və mövcud contrast prinsiplərini qorumalıdır.

- [ ] **Step 3: Editorial utility-ləri əlavə et**

```css
.editorial-kicker {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.image-lift {
  transition: transform 600ms var(--ease-out-soft), filter 300ms ease;
}
@media (hover: hover) {
  .group:hover .image-lift { transform: scale(1.025); }
}
```

- [ ] **Step 4: Reveal-i progressive enhancement et**

```tsx
const [ready, setReady] = useState(false);
useEffect(() => setReady(true), []);
// rendered element:
data-reveal-ready={ready ? "true" : "false"}
```

```css
[data-reveal][data-reveal-ready="true"][data-revealed="false"] {
  opacity: 0;
  transform: translateY(18px);
}
```

Default `[data-reveal]` məzmunu gizlətməməlidir.

- [ ] **Step 5: Section tone-larını semantik tokenlərlə yenilə**

`bg-zinc-900` və hardcode navy rəngini `bg-charcoal` və `bg-navy` ilə əvəz et. Prop adlarını dəyişmə.

- [ ] **Step 6: Statik yoxlamaları işlət**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd src/components/ui/container.tsx src/components/ui/reveal.tsx
```

Expected: exit `0`.

- [ ] **Step 7: Commit et**

```powershell
git add -- src/app/globals.css src/components/ui/container.tsx src/components/ui/reveal.tsx
git commit -m "style: establish editorial design foundation"
```

---

### Task 2: Tipoqrafiya, düymələr, logo və navbar

**Files:**
- Modify: `src/components/ui/section-header.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/site/logo.tsx`
- Modify: `src/components/site/navbar.tsx`

**Interfaces:**
- Consumes: Task 1 tokenləri.
- Produces: mövcud public prop-ları qorunan heading, button, logo və navbar.

- [ ] **Step 1: Navbar baseline screenshot-larını götür**

Viewport-lar: `1440 × 1000`, `1024 × 768`, `768 × 1024`.

Expected baseline: desktopda wordmark sıxılır, tabletdə CTA və menu böyük yer tutur.

- [ ] **Step 2: SectionHeader-i editorial iyerarxiyaya sal**

```tsx
<Heading className={cn(
  "max-w-3xl font-display text-[clamp(2.25rem,4vw,4.5rem)] leading-[0.98] tracking-[-0.035em]",
  isDark ? "text-ink-invert" : "text-ink",
)}>
```

Overline `editorial-kicker`, action isə sakit underline/text-link olmalıdır. `action` prop-u dəyişməməlidir.

- [ ] **Step 3: Düymə iyerarxiyasını sakitləşdir**

`BASE` daxilində daimi translate və shadow hover-u sil. Primary yalnız gold surface, outline nazik line, ghost text-link, onDark 28% ağ border istifadə etsin. Active state `translate-y-px` və ya `scale-[0.99]` olsun.

- [ ] **Step 4: Logo wrap problemini aradan qaldır**

Wordmark-a `whitespace-nowrap`, linkə `shrink-0` ver. Navbar-da:

```tsx
<Logo tone={isOverlay ? "dark" : "light"} compact className="shrink-0" />
```

- [ ] **Step 5: Navbar kompozisiyasını yenilə**

- container `max-w-[90rem]`;
- telefon border-li button deyil, yüngül link;
- search CTA `xl`-də mətnli, `lg`-də ikon səviyyəsində;
- scrolled header `bg-ivory/92 backdrop-blur-xl` və nazik line;
- drawer naviqasiya və əlaqə/actions olmaqla iki səviyyə.

- [ ] **Step 6: Keyboard davranışını yoxla**

Expected: `aria-current`, `aria-expanded`, Escape close və görünən focus ring işləyir.

- [ ] **Step 7: Statik yoxlamaları işlət**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd src/components/ui/section-header.tsx src/components/ui/button.tsx src/components/site/logo.tsx src/components/site/navbar.tsx
```

- [ ] **Step 8: Commit et**

```powershell
git add -- src/components/ui/section-header.tsx src/components/ui/button.tsx src/components/site/logo.tsx src/components/site/navbar.tsx
git commit -m "style: refine editorial navigation and typography"
```

---

### Task 3: Hero və yığcam discovery search

**Files:**
- Modify: `src/components/site/hero.tsx`
- Modify: `src/components/site/search-panel.tsx`

**Interfaces:**
- Consumes: `HeroProps`, `SearchPanelProps`, `SearchPanelInitial`, `TypeOption`, `CityOption`.
- Produces: eyni URL parametrlərini yazan yeni vizual kompozisiya.

- [ ] **Step 1: Search URL müqaviləsini baseline kimi yoxla**

```powershell
rg -n 'params\.set|form\.get|router\.push' src/components/site/search-panel.tsx
```

Expected: `elan`, `axtaris`, `tip`, `seher`, `rayon`, `otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`, `siralama` qorunur.

- [ ] **Step 2: Hero-nu 12-column editorial grid et**

```tsx
<Container size="wide" className="grid min-h-[min(54rem,100dvh)] items-end gap-10 pt-[calc(var(--header-h)+5rem)] pb-8 lg:grid-cols-12 lg:pb-10">
  <div className="lg:col-span-7 lg:pb-10">...</div>
  <div className="lg:col-span-5" aria-hidden="true" />
  <div className="lg:col-span-12"><SearchPanel ... /></div>
</Container>
```

Başlıq max-width `10ch`, description `58ch`; bir primary və bir sakit secondary CTA saxla.

- [ ] **Step 3: Fon və overlay-i sadələşdir**

Slow zoom `1 → 1.06`; solda mətn kontrastı, aşağıda filter kontrastı yaradan iki məqsədli gradient istifadə et.

- [ ] **Step 4: Hero SearchPanel-i discovery bar et**

Desktop 12-column layout: listing `3`, keyword `6`, submit `3`; ikinci sırada type/city/district/room/price. Advanced/reset utility row kimi qalır. Page variantının state və mobile collapse davranışı dəyişmir.

- [ ] **Step 5: Responsive form düzülüşünü tətbiq et**

`<640`: bir sütun; `640–1023`: iki sütun, keyword tam en; `≥1024`: 12-column. Mobile submit full-width və minimum 52 px.

- [ ] **Step 6: Search smoke test et**

Satış, şəhər, rayon, 3 otaq və qiymət seç. Expected URL forması:

```text
/emlaklar?elan=SALE&seher=<slug>&rayon=<slug>&otaq=3&min=<value>&max=<value>
```

- [ ] **Step 7: Statik yoxlamaları işlət**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd src/components/site/hero.tsx src/components/site/search-panel.tsx
```

- [ ] **Step 8: Commit et**

```powershell
git add -- src/components/site/hero.tsx src/components/site/search-panel.tsx
git commit -m "style: redesign hero discovery experience"
```

---

### Task 4: Property kartları və seçilmiş elan kompozisiyası

**Files:**
- Modify: `src/components/site/property-card.tsx`
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: `PropertyCardData`, `FavoriteButton`, format helper-ları.
- Produces: optional `variant?: "standard" | "featured"`, default `standard`.

- [ ] **Step 1: PropertyCard interface-ni genişləndir**

```tsx
type PropertyCardProps = {
  property: PropertyCardData;
  priority?: boolean;
  className?: string;
  variant?: "standard" | "featured";
};
```

- [ ] **Step 2: Qiyməti kontent iyerarxiyasına köçür**

Şəkildəki iri bottom gradient və qiyməti sil. Content-də:

```tsx
<p className="tabular font-display text-2xl leading-none tracking-[-0.02em] text-ink">
  {formatPrice(property.price, property.currency)}
  {period && <span className="ml-1 font-sans text-xs font-normal text-ink-muted">/ {period}</span>}
</p>
```

- [ ] **Step 3: Featured variant ölçülərini tətbiq et**

Standard image `4/3`, featured image `16/10` və desktopda minimum 34rem. Featured title `text-3xl`; hover yalnız image scale `1.025` və line rəngi.

- [ ] **Step 4: Ana səhifədə editorial grid qur**

```tsx
const propertyLayout = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];
```

Grid `md:grid-cols-2 lg:grid-cols-12`; ilk kart featured. 1–6 data elementi böyük boş sıra yaratmamalıdır.

- [ ] **Step 5: Klik davranışını yoxla**

Expected: kart detail route-na keçir; favorite route dəyişmədən state dəyişir; hər ikisinin focus state-i görünür.

- [ ] **Step 6: Statik yoxlamaları işlət**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd src/components/site/property-card.tsx 'src/app/(site)/page.tsx'
```

- [ ] **Step 7: Commit et**

```powershell
git add -- src/components/site/property-card.tsx 'src/app/(site)/page.tsx'
git commit -m "style: introduce editorial property showcase"
```

---

### Task 5: Kateqoriya, xidmət və etibar bölmələri

**Files:**
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: `propertyTypes`, `services`, `WHY_ITEMS`, `demoStats` və mövcud route-lar.
- Produces: eyni data ilə asimmetrik təqdimat.

- [ ] **Step 1: Kateqoriya layout xəritəsini tətbiq et**

```tsx
const categoryLayout = [
  "col-span-2 row-span-2 lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];
```

Overlay yalnız aşağı hissədə gradient olsun; name və count aşağı kənarda oxunaqlı qalsın.

- [ ] **Step 2: Xidmətləri narrative + numbered list et**

`lg:grid-cols-[0.75fr_1.25fr]`: solda heading/action, sağda nömrələnmiş service link rows. Hər row number, title, shortDescription və arrow saxlayır.

- [ ] **Step 3: Haqqımızda kompozisiyasına desktop overlap əlavə et**

Foto 7 kolon, paper mətn paneli 6 kolon və `lg:-ml-20`; tablet/mobile-da normal flow.

- [ ] **Step 4: WHY_ITEMS-i editorial list et**

Altı border-li kart əvəzinə iki sütunlu list; yalnız top rule, kiçik icon/number, title və description.

- [ ] **Step 5: Demo statistikanı data strip et**

Demo badge və xəbərdarlıq qalır. Desktopda vertical separators, mobile-da 2×2 grid.

- [ ] **Step 6: Responsive yoxlama et**

1440, 1024, 768 və 390 px: overflow yoxdur, service linklər görünür, overlap mətnə girmir.

- [ ] **Step 7: Statik yoxlamaları işlət və commit et**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd 'src/app/(site)/page.tsx'
git add -- 'src/app/(site)/page.tsx'
git commit -m "style: reshape homepage editorial sections"
```

---

### Task 6: Project, blog, CTA və footer polish

**Files:**
- Modify: `src/components/site/project-card.tsx`
- Modify: `src/components/site/post-card.tsx`
- Modify: `src/components/site/footer.tsx`
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: `ProjectCardData`, `PostCardData`, navigation və `siteConfig`.
- Produces: mövcud caller-ləri qoruyan kart API-ləri; PostCard üçün optional featured variant.

- [ ] **Step 1: ProjectCard səthini sadələşdir**

Default shadow/border-i sil, image `16/11`, hover image scale `1.025`; status/demo badge, title, summary, location/year qalır.

- [ ] **Step 2: PostCard featured variant əlavə et**

```tsx
type PostCardProps = {
  post: PostCardData;
  priority?: boolean;
  className?: string;
  variant?: "standard" | "featured";
};
```

Default standard bütün digər səhifələri qoruyur.

- [ ] **Step 3: Blog feature + stack layout qur**

İlk post 7 kolon feature, sonrakı iki post 5 kolon stack; mobile bir sütun.

- [ ] **Step 4: Son CTA-nı image + ivory panel et**

Desktop 12 kolon: image 7, panel 5; mobile image üstə, panel alta. CTA copy və route-lar dəyişmir.

- [ ] **Step 5: Footer-i iki səviyyəyə endir**

Əsas sıra: brend 5, naviqasiya 3, əlaqə 4 kolon. Əmlak kateqoriyaları uzun sütun deyil, alt wrap strip. Hüquqi sahiblik cümləsi dəyişmir.

- [ ] **Step 6: Accessibility yoxlaması et**

Address semantikası, Instagram `noopener noreferrer`, keyboard legal links və dekorativ CTA image alt davranışı qalır.

- [ ] **Step 7: Statik yoxlamaları işlət və commit et**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd src/components/site/project-card.tsx src/components/site/post-card.tsx src/components/site/footer.tsx 'src/app/(site)/page.tsx'
git add -- src/components/site/project-card.tsx src/components/site/post-card.tsx src/components/site/footer.tsx 'src/app/(site)/page.tsx'
git commit -m "style: polish editorial content and footer"
```

---

### Task 7: Yekun responsive, theme və production verification

**Files:**
- Modify only if verification exposes a regression in files already listed above.

**Interfaces:**
- Consumes: Task 1–6 nəticələri.
- Produces: build-dən keçən və əsas viewport-larda qəbul meyarlarını ödəyən redesign.

- [ ] **Step 1: Bütün keyfiyyət qapılarını təzə işlət**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd .
.\node_modules\.bin\vitest.cmd run
.\node_modules\.bin\prisma.cmd generate --no-hints
.\node_modules\.bin\next.cmd build
```

Expected: TypeScript/ESLint exit `0`, Vitest `40/40`, Prisma generate success, Next build exit `0`.

- [ ] **Step 2: Desktop visual checklist-i tamamla**

`1440 × 1000`, route-lar `/`, `/emlaklar`, `/layiheler`, `/blog`, `/elaqe`: logo wrap etmir, nav sıxışmır, hero/search balanslıdır, property grid boş sıra yaratmır, footer yığcamdır.

- [ ] **Step 3: Tablet visual checklist-i tamamla**

`1024 × 768` və `768 × 1024`: menu/CTA toqquşmur, hero maksimum üç vizual sətir, search iki sütun, overlap normal flow, overflow yoxdur.

- [ ] **Step 4: Mobile visual checklist-i tamamla**

`390 × 844`: 44 px header actions, drawer işləyir, hero/search full-width, cards bir sütun, footer kəsilmir.

- [ ] **Step 5: Theme və reduced-motion yoxlaması et**

Light/dark `/` və `/emlaklar` screenshot-ları; reduced-motion zamanı məzmun görünür və zoom/reveal dayandırılır.

- [ ] **Step 6: Funksional smoke test et**

Navbar route-ları, search query, favorite state, contact render və admin/auth davranışı əvvəlki kimi işləyir.

- [ ] **Step 7: Diff scope audit et**

```powershell
git diff --check
git status --short
git diff --name-only feat/cloudflare-workers-d1-deployment...HEAD
```

Expected: yalnız presentation faylları və plan/spec sənədləri; database, query, auth və Server Action faylları yoxdur.

- [ ] **Step 8: Verification düzəlişləri varsa commit et**

```powershell
git add -- src/app/globals.css 'src/app/(site)/page.tsx' src/components/ui src/components/site
git commit -m "style: finalize responsive editorial polish"
```

Heç bir düzəliş yoxdursa boş commit yaratma.

## Completion Evidence

Handoff aşağıdakı faktları verməlidir:

- son commit SHA və dəyişən fayllar;
- typecheck/lint/test/build nəticələri;
- yoxlanmış viewport-lar;
- light/dark/reduced-motion nəticələri;
- deploy edilməyibsə açıq qeyd;
- deploy tələb olunarsa ayrıca production approval və OpenNext/Wrangler verification.
