<!--
  Təşəkkür edirik! Aşağıdakı bölmələri doldurun. Aid olmayan bölmə varsa,
  boş buraxmaq əvəzinə "Tətbiq edilmir" yazın ki, reviewer bunun nəzərdən
  qaçırılmadığını bilsin. HTML şərhləri sonda ekranda görünmür.
-->

## Xülasə (Summary)

<!-- Bu PR nə edir və niyə lazımdır? -->

## Əlaqəli issue (Related Issue)

Closes #

## Dəyişiklik növü

- [ ] 🐛 Bug fix
- [ ] ✨ Yeni funksiya
- [ ] 🎨 UI/UX dəyişikliyi
- [ ] ⚡ Performans
- [ ] 📚 Sənəd
- [ ] ♻️ Refactor (davranış dəyişmir)
- [ ] 🧪 Test
- [ ] 🔒 Təhlükəsizlik
- [ ] 🗄️ Verilənlər bazası / migration
- [ ] 🤖 CI/CD
- [ ] 🔧 Chore/konfiqurasiya

## Edilən dəyişikliklər (Changes Made)

<!-- Necə həll etdiniz? Hansı fayllar/modullar toxunulub? Scope-dan kənar nə qaldı? -->

## Screenshot / video

<!-- UI dəyişikliyi varsa əvvəl/sonra görüntüsü və test edilən mobil/desktop viewport-lar. -->

Tətbiq edilmir.

## Test və doğrulama (Testing)

<!-- İşlətdiyiniz komandalar və manual ssenarilər -->

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Manual test ssenariləri:
<!-- 1. ... -->

## Performans təsiri

<!-- Bundle, sorğu sayı, cache, LCP/CLS/TTFB və ya CI müddətinə təsir. Ölçü varsa yazın. -->

Tətbiq edilmir.

## Təhlükəsizlik və şəxsi məlumat təsiri

<!-- Auth, icazə, input, upload, secret, PII və ya üçüncü tərəf inteqrasiyasına təsir. -->

Tətbiq edilmir.

## Verilənlər bazası / migration təsiri

- [ ] D1 miqrasiyası tələb olunur (`migrations/` qovluğuna fayl əlavə edilib)
- [ ] Seed/taksonomiya/demo SQL-i yenilənib
- [ ] Yeni mühit dəyişəni və ya secret tələb olunur
- [ ] Tətbiq edilmir

Tətbiq və rollback ardıcıllığı: <!-- Əvvəl staging; problem olsa geri dönüş necədir? -->

## Accessibility

<!-- Klaviatura, fokus, semantik HTML, ekran oxuyucu, kontrast və toxunma hədəfləri. -->

Tətbiq edilmir.

## SEO təsiri

<!-- Metadata, canonical, hreflang, sitemap, robots, JSON-LD və URL dəyişiklikləri. -->

Tətbiq edilmir.

## Breaking change və deployment

- [ ] Bu PR breaking change daşıyır (commit mesajında `BREAKING CHANGE:` var)
- [ ] Cloudflare Worker, cron və ya environment konfiqurasiyasına təsir edir
- [ ] Tətbiq edilmir

Rollback planı: <!-- Problem yaransa necə geri qaytarılır? -->

## Sənəd təsiri

- [ ] README yeniləndi
- [ ] Wiki yeniləndi
- [ ] Tətbiq edilmir

## Author checklist

- [ ] Kod [CONTRIBUTING.md](../CONTRIBUTING.md)-dəki qaydalara uyğundur
- [ ] Kod lokal olaraq test olunub
- [ ] `npm run typecheck` uğurludur
- [ ] `npm run lint` uğurludur
- [ ] `npm test` uğurludur
- [ ] `npm run build` uğurludur
- [ ] Yeni error və warning yaradılmayıb
- [ ] Commit mesajları Conventional Commits formatındadır
- [ ] Lazımi sənədləşmə yenilənib
- [ ] Migration və rollback planı yoxlanılıb və ya tətbiq edilmir
- [ ] Təhlükəsizlik və şəxsi məlumat təsiri qiymətləndirilib
- [ ] Mobil görünüş yoxlanılıb və ya tətbiq edilmir
- [ ] Accessibility təsiri yoxlanılıb və ya tətbiq edilmir
- [ ] SEO təsiri yoxlanılıb və ya tətbiq edilmir
- [ ] Bu PR-da parol, secret, token və ya real istifadəçi məlumatı yoxdur
