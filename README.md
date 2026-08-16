<div align="center">
  <img src="public/logo-full.png" alt="Luxe Home Estate Logo" width="250"/>
  <h1>🏡 Luxe Home Estate</h1>
  <p>Müasir və premium dizayna sahib daşınmaz əmlak və lüks evlər platforması.</p>
</div>

---

## 📖 Layihə Haqqında

**Luxe Home Estate** - elit və lüks daşınmaz əmlak obyektlərinin satışı, kirayəsi və layihə nümayişi üçün nəzərdə tutulmuş müasir veb platformasıdır. Layihə tam olaraq ən son texnologiyalar əsasında, sürət və təhlükəsizlik prioritet alınaraq hazırlanmışdır. Platforma həm istifadəçilər (alıcı/kirayəçi), həm də adminlər üçün xüsusi interfeyslərə sahibdir.

## ✨ Əsas Xüsusiyyətlər

- **Daşınmaz Əmlak Kataloqu**: Satış və kirayə üçün lüks evlərin və obyektlərin axtarışı.
- **Ətraflı Filtrləmə (Search Panel)**: Şəhər, rayon, əmlak növü və xüsusiyyətlərinə görə inkişaf etmiş axtarış sistemi.
- **Layihə Nümayişi (Projects)**: Yeni tikilən və ya tikilməkdə olan lüks komplekslərin təqdimatı.
- **Bloq və Xəbərlər**: Daşınmaz əmlak bazarı və lüks ev bəzəkləri haqqında məqalələr.
- **Bəyənilənlər Sistemi (Favorites)**: İstifadəçilərin bəyəndikləri əmlakları yadda saxlaması.
- **Müştəri Müraciətləri (Leads)**: Maraqlanan alıcıların agentlərlə əlaqə qurması üçün müraciət formaları.
- **Rol Əsaslı İdarəetmə**: `SUPER_ADMIN`, `ADMIN` və `EDITOR` icazələri ilə məlumat bazasının idarə edilməsi.
- **Dinamik Qalereya və Media**: Əmlakların vizual nümayişi üçün optimizasiya olunmuş şəkil qalereyası.

## 🛠️ Texnologiya Yığını (Tech Stack)

Layihə ən son versiyalı Full-Stack texnologiyalarından istifadə edərək qurulmuşdur:

- **Framework**: [Next.js 15](https://nextjs.org/) (React 19) — *App Router, Server Components & Server Actions*
- **Stilləndirmə**: [Tailwind CSS v4](https://tailwindcss.com/) — *Müasir UI, clsx və tailwind-merge ilə siniflərin idarə olunması*
- **İkonlar**: [Lucide React](https://lucide.dev/)
- **Verilənlər Bazası & ORM**: [Prisma ORM v6](https://www.prisma.io/) — *İnkişaf mühitində SQLite, istehsalda (production) PostgreSQL*
- **Təhlükəsizlik və Doğrulama**: `bcryptjs` (şifrələmə), `jose` (JWT), `zod` (məlumatların validasiyası)
- **Digər utilitlər**: `sharp` (şəkil optimizasiyası)

## 🗄️ Verilənlər Bazası Arxitekturası

Prisma istifadə edərək qurulmuş relyasiyalı (RDBMS) bazanın əsas modelləri:
* **User**: Sistem istifadəçiləri və adminlər.
* **Property**: Daşınmaz əmlak obyektləri (Evlər, Villalar və s.).
* **Project**: Tikinti şirkətlərinin lüks layihələri.
* **PropertyType**: Əmlak tipləri.
* **Location**: Şəhər və rayonlar (Self-relation ağac strukturu ilə).
* **Feature**: Əmlak xüsusiyyətləri (Hovuz, qaraj, dəniz mənzərəsi və s.).
* **BlogPost**: Məqalələr.
* **Lead**: Müştəri müraciətləri.

## 🚀 Quraşdırma (Qısa Təlimat)

Layihəni lokal kompüterinizdə işə salmaq üçün aşağıdakı addımları izləyin:

1. **Repozitoriyanı yükləyin və qovluğa daxil olun:**
   ```bash
   git clone https://github.com/MuradoffTehmez/LuxeHome.git
   cd luxehome
   ```

2. **Asılılıqları quraşdırın:**
   ```bash
   npm install
   ```

3. **Mühit dəyişənlərini ayarlayın:**
   `.env.example` faylının adını `.env` olaraq dəyişin və konfiqurasiyaları (məs: `DATABASE_URL`) özünüzə uyğun yazın.

4. **Verilənlər bazasını yaradın və nümunə məlumatları yükləyin (Seed):**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Layihəni işə salın:**
   ```bash
   npm run dev
   ```

Nəticəni görmək üçün brauzerinizdə [http://localhost:3000](http://localhost:3000) ünvanına daxil olun.

## 📜 Skriptlər

`package.json` faylında yer alan əsas əmrlər:

- `npm run dev`: İnkişaf (development) rejimini işə salır.
- `npm run build`: Layihəni istehsal (production) mühiti üçün hazırlayır.
- `npm run db:migrate`: Prisma bazasında dəyişiklikləri icra edir.
- `npm run db:push`: Miqrasiya yaratmadan schema-nı birbaşa bazaya tətbiq edir.
- `npm run db:studio`: Prisma Studio vasitəsilə vizual olaraq məlumat bazasını idarə etmə interfeysini açır.
- `npm run db:seed`: Bazanı başlanğıc və nümunə datalarla (dummy data) doldurur.
- `npm run db:clean-demo`: Demo məlumatları təmizləmək üçün skript.

## 📂 Layihə Quruluşu (Project Structure)

```
LuxeHomeEstate/
├── prisma/             # Verilənlər bazası (schema.prisma), miqrasiyalar və seed faylları
├── public/             # Şəkillər, icon-lar və ictimai asetslər
├── scripts/            # Köməkçi sistem skriptləri
├── src/
│   ├── app/            # Next.js App Router (səhifələr, layout-lar və API)
│   ├── components/     # Təkrar istifadə edilə bilən React komponentləri
│   │   ├── site/       # Sayt interfeysinə məxsus qlobal hissələr (navbar, footer, hero, card)
│   │   └── ui/         # Kiçik UI elementləri (button, badge, modal, field)
│   └── lib/            # Köməkçi funksiyalar (utils, seo, db queries)
└── ...
```

## 📄 Lisenziya (License)
Bu layihə **MIT Lisenziyası** altındadır - ətraflı məlumat üçün `LICENSE` faylına baxa bilərsiniz.
