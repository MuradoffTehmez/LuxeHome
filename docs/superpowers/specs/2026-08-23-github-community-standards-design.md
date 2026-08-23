# GitHub Community Standards dizaynı

Tarix: 23 avqust 2026

Repository: `MuradoffTehmez/LuxeHome`

Hədəf branch: `main`

## Məqsəd

LuxeHome repository-si üçün GitHub Community Standards göstəricisini tamamlayan, real töhfələri idarə edən və layihənin mövcud Azərbaycan dilli sənədləri ilə uyğun gələn vahid contribution sistemi qurmaq.

Sistem aşağıdakı nəticələri verməlidir:

- töhfəçi problemi düzgün Issue Form ilə strukturlaşdırılmış şəkildə bildirir;
- təhlükəsizlik zəifliyi açıq issue kimi paylaşılmır;
- hər dəyişiklik issue-dan başlayıb ayrıca branch, Conventional Commit, pull request, review və merge mərhələlərindən keçir;
- reviewer dəyişiklik növünü, test sübutunu, vizual təsiri, breaking change-i və rollback ehtiyacını bir PR təsvirində görə bilir;
- GitHub Community Profile `README`, `LICENSE`, `SECURITY`, conduct, contributing, issue template və pull request template fayllarını dəstəklənən yerlərdə tapır.

## Cari vəziyyət

Repository-də aşağıdakılar mövcuddur:

- geniş Azərbaycan dilli `README.md`;
- etibarlı MIT `LICENSE`;
- məxfi hesabat ünvanı, cavab müddətləri, scope və safe-harbor qaydaları olan əhatəli `SECURITY.md`;
- `npm run typecheck`, `npm run lint`, `npm test` və `npm run build` keyfiyyət qapısı;
- GitHub Issues aktiv, Discussions deaktivdir;
- standart `bug`, `documentation` və `enhancement` label-ləri;
- GitHub Private Vulnerability Reporting deaktivdir;
- `.github/`, contribution guide, conduct sənədi və issue/PR şablonları yoxdur.

GitHub Community Profile auditinin başlanğıc göstəricisi 57%-dir. Mövcud faydalı README, LICENSE və SECURITY məzmunu saxlanılmalıdır.

## Seçilmiş yanaşma

Layihəyə uyğun tam Azərbaycan dilli governance paketi yaradılacaq. GitHub-un YAML açarları, branch prefiksləri, commit tipləri və kod identifikatorları texniki müqavilə olduqları üçün ingiliscə qalacaq.

Yalnız Community Standards və contribution axını üçün lazım olan fayllar əlavə ediləcək. CI workflow, Dependabot, CODEOWNERS, stale bot, avtomatik labeler və ayrıca `SUPPORT.md` bu dəyişiklik paketinə daxil edilməyəcək.

## Fayl arxitekturası

```text
CODE_OF_CONDUCT.md
CONTRIBUTING.md
.github/
├── PULL_REQUEST_TEMPLATE.md
└── ISSUE_TEMPLATE/
    ├── bug-report.yml
    ├── feature-request.yml
    ├── ui-ux-improvement.yml
    ├── performance-issue.yml
    ├── mobile-responsive-issue.yml
    ├── documentation-issue.yml
    └── config.yml
```

Mövcud fayllardan:

- `README.md`-yə contribution, conduct və issue keçidləri əlavə ediləcək;
- `SECURITY.md` yalnız community sənədləri ilə əlaqəni aydınlaşdırmaq lazım gələrsə minimal dəyişdiriləcək;
- `LICENSE` dəyişdirilməyəcək.

## Davranış kodeksi

`CODE_OF_CONDUCT.md` Contributor Covenant 2.1 əsasında Azərbaycan dilinə uyğunlaşdırılacaq. Sənəd aşağıdakı bölmələri saxlayacaq:

- öhdəlik və inklüziv iştirak prinsipi;
- qəbul edilən və qəbuledilməz davranış nümunələri;
- maintainer məsuliyyətləri və tətbiq dairəsi;
- məxfi pozuntu hesabatı kanalı;
- düzəliş, xəbərdarlıq, müvəqqəti məhdudiyyət və daimi uzaqlaşdırma pillələri;
- Contributor Covenant və Mozilla enforcement ladder atribusiyası.

Davranış pozuntuları mövcud security e-poçtundan ayrı məna daşısa da, repository-də təsdiqlənmiş yeganə məxfi maintainer kanalı olan `muradofftehmez01@gmail.com` ünvanına yönləndiriləcək. Sənəd bunun security vulnerability hesabatı deyil, community moderation hesabatı olduğunu mövzu sətrində göstərməyi tələb edəcək.

## Contribution guide

`CONTRIBUTING.md` aşağıdakı müqaviləni müəyyən edəcək:

1. `CODE_OF_CONDUCT.md` və `SECURITY.md` ilə tanışlıq.
2. Dublikat axtarışı və uyğun Issue Form ilə issue açılması.
3. Issue təsdiqindən sonra ayrıca branch yaradılması.
4. Kiçik, məqsədli dəyişikliklər və Conventional Commits.
5. Lokal keyfiyyət qapısı.
6. `Closes #<issue>` olan PR.
7. Review rəylərinin ayrıca commit və ya məqsədli düzəlişlə cavablandırılması.
8. Yalnız təsdiq və keyfiyyət qapısından sonra `main`-ə merge.

Branch adları:

- `feature/<qisa-tesvir>`
- `fix/<qisa-tesvir>`
- `docs/<qisa-tesvir>`
- `refactor/<qisa-tesvir>`
- `test/<qisa-tesvir>`
- `chore/<qisa-tesvir>`

Branch adlarında kiçik ingilis hərfləri, rəqəmlər və tire istifadə olunacaq. Bir branch bir issue və bir əsas məqsəd daşıyacaq.

Conventional Commit tipləri `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `build`, `ci` olacaq. Format `type(scope): qısa əmr cümləsi` kimi müəyyən ediləcək. Breaking change `!` və commit body-də `BREAKING CHANGE:` ilə göstəriləcək.

Guide layihəyə aid əsas kod qaydalarını da yığcam şəkildə saxlayacaq:

- identifikatorlar ingiliscə, şərhlər və istifadəçiyə görünən mətnlər azərbaycanca;
- domen statusları `src/lib/constants.ts`-dən;
- Prisma singleton `src/lib/prisma.ts`-dən;
- public property query-ləri public predicate-dən;
- dark mode üçün semantik tokenlər, `dark:` prefiksi olmadan;
- D1 dəyişiklikləri üçün reversibility, lokal migration və staging-first qaydası;
- secret və production məlumatının commit edilməməsi.

## Issue Forms

Bütün formalar `.yml` formatında `name`, `description`, `title`, mövcud label, boş `assignees` və `body` sahələri ilə yaradılacaq. Formanın sonunda aşağıdakılar təsdiqlənəcək:

- dublikat issue axtarılıb;
- həssas məlumat əlavə edilməyib;
- Code of Conduct qəbul edilir;
- təhlükəsizlik zəifliyi public issue kimi təqdim edilmir.

### Bug Report

Label: `bug`.

Məcburi məlumat: qısa təsvir, təsirlənən səhifə/komponent, cari və gözlənilən davranış, təkrarlama addımları, brauzer/əməliyyat sistemi və mümkün regressiya məlumatı. Log və screenshot sahələri həssas məlumat xəbərdarlığı ilə opsional olacaq.

### Feature Request

Label: `enhancement`.

Məcburi məlumat: həll edilən problem, təklif olunan nəticə, istifadəçi tipi, acceptance criteria və scope. Alternativlər və əlavə kontekst opsional olacaq.

### UI/UX Improvement

Label: `enhancement`.

Məcburi məlumat: route/komponent, hazırkı UX problemi, təklif olunan yaxşılaşdırma, təsirlənən viewport və accessibility təsiri. Screenshot və vizual istinad opsional olacaq.

### Performance Issue

Label: `bug`.

Məcburi məlumat: təsirlənən route/əməliyyat, ölçülən simptom, təkrarlama addımları, mühit və müşahidə olunan ölçü. Lighthouse, profiler, network trace və regression məlumatı opsional olacaq.

### Mobile/Responsive Issue

Label: `bug`.

Məcburi məlumat: route, cihaz və ya viewport eni, brauzer, orientasiya, cari və gözlənilən davranış, təkrarlama addımları. Screenshot/video və accessibility təsiri opsional olacaq.

### Documentation Issue

Label: `documentation`.

Məcburi məlumat: fayl/səhifə, yanlış və ya çatışmayan məlumat, təklif olunan dəyişiklik və hədəf auditoriya. Xarici istinadlar opsional olacaq.

### Template chooser

`.github/ISSUE_TEMPLATE/config.yml` aşağıdakı davranışı verəcək:

- `blank_issues_enabled: false`;
- security üçün açıq issue əvəzinə repository-nin `/security/policy` səhifəsinə contact link;
- Discussions deaktiv olduğu üçün işləməyən discussion linki əlavə edilməyəcək.

## Pull request template

PR template aşağıdakı bölmələrdən ibarət olacaq:

- xülasə və dəyişiklik motivasiyası;
- əlaqəli issue və `Closes #...`;
- dəyişiklik növü checkbox-ları;
- tətbiq və scope qeydləri;
- test olunan komandalar və manual ssenarilər;
- UI dəyişikliyi üçün əvvəl/sonra screenshot və viewport;
- breaking changes, migration, deployment və rollback;
- security və şəxsi məlumat təsiri;
- documentation təsiri;
- author checklist.

HTML comment-lər contributor-a istiqamət verəcək, amma yekun PR mətnini çirkləndirməyəcək. Uyğun olmayan bölmələr `Tətbiq edilmir` kimi açıq qeyd olunacaq.

## README inteqrasiyası

README-in başlanğıc keçidlərinə `CONTRIBUTING.md` və `CODE_OF_CONDUCT.md` əlavə ediləcək. Keyfiyyət qapısından əvvəl qısa “Töhfə vermək” bölməsi yaradılacaq və aşağıdakılara yönləndirəcək:

- uyğun Issue Form seçimi;
- security problemlərinin açıq paylaşılmaması;
- contribution workflow;
- tam contribution guide.

Mövcud arxitektura, quraşdırma, komanda, təhlükəsizlik, roadmap, müəllif hüquqları və brend məlumatı silinməyəcək.

## Təhlükəsizlik və məxfilik

Issue Forms və PR template daxilində aşağıdakı məlumatların paylaşılmaması açıq yazılacaq:

- parol və secret;
- sessiya cookie-si və auth token;
- real istifadəçi və production məlumatı;
- təhlükəsizlik zəifliyinin istismar detalları.

Security contact link `https://github.com/MuradoffTehmez/LuxeHome/security/policy` olacaq. Private Vulnerability Reporting hazırda deaktiv olduğuna görə mövcud `SECURITY.md` e-poçt kanalı əsas məxfi yol kimi qalacaq; formalar işləməyən private-advisory linkinə yönləndirməyəcək.

## Validasiya

Tətbiqdən sonra aşağıdakı yoxlamalar aparılacaq:

1. Bütün YAML faylları parser ilə sintaktik yoxlanacaq.
2. Hər Issue Form üçün unikal `id`, dəstəklənən `type`, etibarlı `attributes` və məcburi `validations` yoxlanacaq.
3. `config.yml` daxilində yalnız dəstəklənən chooser açarları saxlanılacaq.
4. Markdown linkləri və repository daxili fayl yolları yoxlanacaq.
5. Dublikat community faylı və köhnə `.md` issue template-i olmadığı təsdiqlənəcək.
6. `git diff --check` işlədiləcək.
7. Dəyişiklik yalnız sənəd/YAML olduğu üçün tətbiq build-i dəyişməsə də repository qaydasına uyğun `npm run typecheck` və `npm run build` işlədiləcək.
8. Default branch-a merge-dən sonra GitHub Community Profile yenidən yoxlanacaq.

## Qəbul meyarları

- Sadalanan iki root sənəd və səkkiz `.github` faylı mövcuddur.
- Altı Issue Form GitHub schema-sına uyğundur və chooser-də ayrıca görünür.
- Blank issue contributor-lar üçün bağlıdır.
- Security contact public issue yaratmır və mövcud policy-yə yönləndirir.
- CONTRIBUTING workflow, branch naming, Conventional Commits və quality gate-i açıq müəyyən edir.
- PR template tələb olunan bütün bölmələri ehtiva edir.
- README yeni community fayllarına keçid verir.
- LICENSE dəyişməyib, SECURITY-nin faydalı məzmunu qorunub.
- İstifadəçinin əvvəlcədən mövcud olan əlaqəsiz lokal dəyişiklikləri commitə daxil edilməyib.
