# GitHub Community Standards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LuxeHome repository-si üçün tam Azərbaycan dilli, GitHub Community Standards ilə uyğun contribution, issue və pull request sistemi qurmaq.

**Architecture:** Root community sənədləri davranış və contribution müqaviləsini müəyyən edir; `.github/ISSUE_TEMPLATE` daxilindəki altı müstəqil YAML Issue Form məlumatı strukturlaşdırır; chooser konfiqurasiyası təhlükəsizlik hesabatını public issue-dan uzaqlaşdırır; vahid PR template isə issue-dan merge-ə qədər sübutları standartlaşdırır. Mövcud README yalnız giriş keçidləri ilə genişləndirilir, LICENSE dəyişmir və güclü SECURITY siyasəti əsas məxfi hesabat kanalı olaraq qalır.

**Tech Stack:** Markdown, GitHub Issue Forms YAML schema, GitHub template chooser, Node.js `yaml` parser, Git, npm quality gates.

**Spec:** `docs/superpowers/specs/2026-08-23-github-community-standards-design.md`

## Global Constraints

- Bütün insan yönümlü mətn Azərbaycan dilində olmalıdır; GitHub YAML açarları, branch prefiksləri, Conventional Commit tipləri və kod identifikatorları ingiliscə qalmalıdır.
- `README.md`, `LICENSE` və `SECURITY.md` daxilindəki faydalı məlumat silinməməlidir.
- `LICENSE` dəyişdirilməməlidir.
- Security zəifliyi public issue-a yönləndirilməməlidir; əsas məxfi kanal `SECURITY.md` daxilindəki `muradofftehmez01@gmail.com` ünvanıdır.
- Yalnız mövcud `bug`, `enhancement` və `documentation` label-ləri istifadə edilməlidir.
- `blank_issues_enabled` `false` olmalıdır; Discussions deaktiv olduğu üçün discussion contact link əlavə edilməməlidir.
- CI, Dependabot, CODEOWNERS, stale bot, labeler və ayrıca `SUPPORT.md` bu plana daxil deyil.
- Əlaqəsiz lokal dəyişikliklər — `src/components/site/footer.tsx`, `src/config/site.ts`, `src/lib/seo.ts` — stage və commit edilməməlidir.
- Hər commit yalnız öz task fayllarını stage etməlidir.

---

### Task 1: Davranış və contribution müqaviləsi

**Files:**
- Create: `CODE_OF_CONDUCT.md`
- Create: `CONTRIBUTING.md`

**Interfaces:**
- Consumes: `README.md` daxilindəki quraşdırma komandaları, `SECURITY.md` məxfi hesabat kanalı, `AGENTS.md` kod qaydaları.
- Produces: Issue Forms və PR template-dən link veriləcək `CODE_OF_CONDUCT.md` və `CONTRIBUTING.md` yolları.

- [ ] **Step 1: Mövcud olmayan community sənədlərini sübut edən yoxlamanı işlət**

Run:

```powershell
& node --input-type=module -e "import { existsSync } from 'node:fs'; const missing = ['CODE_OF_CONDUCT.md','CONTRIBUTING.md'].filter((file) => !existsSync(file)); if (missing.length) { console.error('Missing:', missing.join(', ')); process.exit(1); }"
```

Expected: FAIL with `Missing: CODE_OF_CONDUCT.md, CONTRIBUTING.md`.

- [ ] **Step 2: `CODE_OF_CONDUCT.md` sənədini yarat**

Sənəd bu dəqiq heading strukturunu istifadə etməlidir:

```markdown
# Davranış kodeksi

## Öhdəliyimiz
## Standartlarımız
## İcra məsuliyyətləri
## Tətbiq dairəsi
## Pozuntunun bildirilməsi
## İcra qaydaları
### 1. Düzəliş
### 2. Xəbərdarlıq
### 3. Müvəqqəti məhdudiyyət
### 4. Daimi uzaqlaşdırma
## Atribusiya
```

Məzmun Contributor Covenant 2.1-in mənasını tam saxlamalıdır:

- yaş, bədən ölçüsü, görünən/görünməyən əlillik, etnik mənsubiyyət, gender xüsusiyyətləri, gender kimliyi və ifadəsi, təcrübə, təhsil, sosial-iqtisadi status, vətəndaşlıq, görünüş, irq, kasta, rəng, din, seksual kimlik və orientasiyadan asılı olmayaraq təhlükəsiz iştirak öhdəliyi;
- empatiya, fərqli baxışlara hörmət, konstruktiv rəy, məsuliyyət və community marağını qoruyan qəbul edilən davranışlar;
- seksual dil/təsvir, trolling, təhqir, şəxsi hücum, public/private harassment, şəxsi məlumat yaymaq və məqsədəuyğun olmayan davranışların qadağan edilməsi;
- maintainer-lərin ədalətli, ardıcıl və məxfi tətbiq məsuliyyəti;
- project issue, PR, review, discussion, commit, tədbir və project təmsilçiliyinə tətbiq dairəsi;
- moderation hesabatı üçün `muradofftehmez01@gmail.com`, mövzu `LuxeHome davranış kodeksi hesabatı`, məxfilik və qərəzsiz araşdırma vədi;
- dörd enforcement pilləsində community impact və consequence;
- Contributor Covenant 2.1 və Mozilla enforcement ladder linkləri ilə atribusiya.

- [ ] **Step 3: `CONTRIBUTING.md` sənədini yarat**

Sənəd bu heading-ləri və konkret müqavilələri saxlamalıdır:

```markdown
# LuxeHome-a töhfə vermək

## Başlamazdan əvvəl
## Təhlükəsizlik problemləri
## Lokal quraşdırma
## Contribution workflow
### 1. Issue
### 2. Branch
### 3. Dəyişiklik
### 4. Commit
### 5. Pull Request
### 6. Review
### 7. Merge
## Branch adlandırılması
## Conventional Commits
## Kod qaydaları
## Verilənlər bazası dəyişiklikləri
## Keyfiyyət qapısı
## Pull Request gözləntiləri
## Lisenziya və sahiblik
```

Workflow mətnində aşağıdakı dəyişməz qaydalar olmalıdır:

```text
Issue → Branch → Commit → Pull Request → Review → Merge
```

Branch cədvəli aşağıdakı prefiksləri izah etməlidir:

```text
feature/<qisa-tesvir>
fix/<qisa-tesvir>
docs/<qisa-tesvir>
refactor/<qisa-tesvir>
test/<qisa-tesvir>
chore/<qisa-tesvir>
```

Commit formatı və nümunələri:

```text
type(scope): qısa əmr cümləsi

feat(auth): add password reset flow
fix(header): prevent desktop navigation overlap
docs: clarify D1 migration workflow
test(auth): cover expired sessions
```

İcazə verilən tiplər: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `build`, `ci`. Breaking dəyişiklik `type(scope)!:` və body-də `BREAKING CHANGE:` ilə göstərilməlidir.

Quraşdırma və gate komandaları məhz bunlar olmalıdır:

```bash
npm ci
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run dev

npm run typecheck
npm run lint
npm test
npm run build
```

Kod qaydaları Global Constraints və spesifikasiyadakı Prisma, constants, public predicate, dark-mode token, Azərbaycan dili və secret qaydalarını daxil etməlidir. D1 bölməsi migration faylının review, lokal tətbiq, staging-first, backup və rollback şərtlərini verməlidir.

- [ ] **Step 4: Sənədlərin strukturunu və kritik mətnlərini yoxla**

Run:

```powershell
& node --input-type=module -e "import { readFileSync } from 'node:fs'; const conduct = readFileSync('CODE_OF_CONDUCT.md','utf8'); const contributing = readFileSync('CONTRIBUTING.md','utf8'); const checks = [['conduct email',conduct,'muradofftehmez01@gmail.com'],['conduct attribution',conduct,'Contributor Covenant 2.1'],['workflow',contributing,'Issue → Branch → Commit → Pull Request → Review → Merge'],['branch prefix',contributing,'feature/<qisa-tesvir>'],['commit format',contributing,'type(scope): qısa əmr cümləsi'],['typecheck',contributing,'npm run typecheck'],['build',contributing,'npm run build'],['security link',contributing,'SECURITY.md']]; const failed = checks.filter(([,text,needle]) => !text.includes(needle)); if (failed.length) { console.error(failed.map(([name]) => name).join(', ')); process.exit(1); }"
```

Expected: exit 0 with no output.

- [ ] **Step 5: Yalnız Task 1 fayllarını commit et**

```bash
git add CODE_OF_CONDUCT.md CONTRIBUTING.md
git diff --cached --check
git commit -m "docs: add community contribution guidelines"
```

Expected: commit contains exactly two new root Markdown files.

---

### Task 2: Strukturlaşdırılmış GitHub Issue Forms

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug-report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature-request.yml`
- Create: `.github/ISSUE_TEMPLATE/ui-ux-improvement.yml`
- Create: `.github/ISSUE_TEMPLATE/performance-issue.yml`
- Create: `.github/ISSUE_TEMPLATE/mobile-responsive-issue.yml`
- Create: `.github/ISSUE_TEMPLATE/documentation-issue.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

**Interfaces:**
- Consumes: `CODE_OF_CONDUCT.md`, `SECURITY.md`, mövcud `bug`, `enhancement`, `documentation` GitHub label-ləri.
- Produces: GitHub issue chooser-də altı form və bir security contact link.

- [ ] **Step 1: Formların hələ mövcud olmadığını sübut et**

Run:

```powershell
& node --input-type=module -e "import { existsSync } from 'node:fs'; const files = ['bug-report.yml','feature-request.yml','ui-ux-improvement.yml','performance-issue.yml','mobile-responsive-issue.yml','documentation-issue.yml','config.yml']; const missing = files.filter((file) => !existsSync('.github/ISSUE_TEMPLATE/' + file)); if (missing.length) { console.error('Missing:', missing.join(', ')); process.exit(1); }"
```

Expected: FAIL listing all seven files.

- [ ] **Step 2: Altı Issue Form üçün ortaq müqaviləni tətbiq et**

Hər formun root strukturu belə olmalıdır:

```yaml
name: Azərbaycan dilində form adı
description: Azərbaycan dilində konkret istifadə məqsədi
title: "[Kateqoriya]: "
labels:
  - mövcud-label
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Təşəkkür mətni, security xəbərdarlığı və SECURITY.md linki.
  - type: textarea | input | dropdown
    id: unikal-kebab-olmayan-snake_case_id
    attributes:
      label: Azərbaycan dilində label
      description: Doldurma təlimatı
    validations:
      required: true | false
  - type: checkboxes
    id: confirmations
    attributes:
      label: Təsdiqlər
      options:
        - label: Dublikat issue axtardım.
          required: true
        - label: Həssas məlumat və təhlükəsizlik zəifliyi paylaşmadım.
          required: true
        - label: CODE_OF_CONDUCT.md qaydalarını qəbul edirəm.
          required: true
```

Markdown xəbərdarlığı relative link əvəzinə GitHub-da issue form daxilindən işləyən tam URL istifadə etməlidir:

```text
https://github.com/MuradoffTehmez/LuxeHome/security/policy
```

- [ ] **Step 3: `bug-report.yml` sahələrini yarat**

Metadata:

```yaml
name: Xəta hesabatı
description: Təkrarlana bilən texniki xətanı bildirin
title: "[Bug]: "
labels: [bug]
assignees: []
```

Body sahələri bu ardıcıllıqla olmalıdır:

| `id` | `type` | Label | Required |
|---|---|---|---:|
| `summary` | `textarea` | Xətanın təsviri | yes |
| `affected_area` | `input` | Təsirlənən səhifə və ya komponent | yes |
| `steps` | `textarea` | Təkrarlama addımları | yes |
| `actual_behavior` | `textarea` | Cari davranış | yes |
| `expected_behavior` | `textarea` | Gözlənilən davranış | yes |
| `environment` | `textarea` | Mühit | yes |
| `regression` | `dropdown` | Bu regressiyadır? | yes; `Bəli`, `Xeyr`, `Məlum deyil` |
| `evidence` | `textarea` | Loglar və ekran görüntüləri | no |
| `additional_context` | `textarea` | Əlavə kontekst | no |
| `confirmations` | `checkboxes` | Təsdiqlər | all options required |

- [ ] **Step 4: `feature-request.yml` sahələrini yarat**

Metadata `name: Funksiya təklifi`, `title: "[Feature]: "`, `labels: [enhancement]` olmalıdır.

Body: `problem` textarea required; `proposed_solution` textarea required; `user_type` dropdown required with `Sayt ziyarətçisi`, `Əmlak sahibi`, `Agentlik`, `Əməkdaş / admin`, `Developer / maintainer`; `acceptance_criteria` textarea required; `scope` textarea required; `alternatives` textarea optional; `additional_context` textarea optional; `confirmations` shared required checkboxes.

- [ ] **Step 5: `ui-ux-improvement.yml` sahələrini yarat**

Metadata `name: UI/UX yaxşılaşdırılması`, `title: "[UI/UX]: "`, `labels: [enhancement]` olmalıdır.

Body: `location` input required; `current_problem` textarea required; `proposed_improvement` textarea required; `viewport` input required; `accessibility_impact` dropdown required with `Müsbət təsir gözlənilir`, `Təsir yoxdur`, `Yoxlanmalıdır`; `visual_reference` textarea optional; `acceptance_criteria` textarea required; `confirmations` shared required checkboxes.

- [ ] **Step 6: `performance-issue.yml` sahələrini yarat**

Metadata `name: Performans problemi`, `title: "[Performance]: "`, `labels: [bug]` olmalıdır.

Body: `affected_operation` input required; `symptom` textarea required; `steps` textarea required; `measurement` textarea required; `environment` textarea required; `regression` dropdown required with `Bəli`, `Xeyr`, `Məlum deyil`; `profiling_evidence` textarea optional; `expected_target` textarea optional; `confirmations` shared required checkboxes.

- [ ] **Step 7: `mobile-responsive-issue.yml` sahələrini yarat**

Metadata `name: Mobil və responsive problemi`, `title: "[Responsive]: "`, `labels: [bug]` olmalıdır.

Body: `route` input required; `device_viewport` input required; `browser_os` input required; `orientation` dropdown required with `Portret`, `Landşaft`, `Hər ikisi`; `steps` textarea required; `actual_behavior` textarea required; `expected_behavior` textarea required; `evidence` textarea optional; `accessibility_impact` textarea optional; `confirmations` shared required checkboxes.

- [ ] **Step 8: `documentation-issue.yml` sahələrini yarat**

Metadata `name: Sənədləşdirmə problemi`, `title: "[Docs]: "`, `labels: [documentation]` olmalıdır.

Body: `location` input required; `problem` textarea required; `proposed_change` textarea required; `audience` dropdown required with `Son istifadəçi`, `Contributor`, `Maintainer`, `Deployment / operations`; `references` textarea optional; `confirmations` shared required checkboxes.

- [ ] **Step 9: `config.yml` chooser konfiqurasiyasını yarat**

Exact content:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Təhlükəsizlik zəifliyini məxfi bildirin
    url: https://github.com/MuradoffTehmez/LuxeHome/security/policy
    about: Təhlükəsizlik zəifliyini açıq issue kimi paylaşmayın; məxfi hesabat qaydalarını oxuyun.
```

- [ ] **Step 10: YAML sintaksisini və Issue Form schema müqaviləsini yoxla**

Run:

```powershell
& node --input-type=module -e "import { readFileSync, readdirSync } from 'node:fs'; import YAML from 'yaml'; const dir = '.github/ISSUE_TEMPLATE'; const files = readdirSync(dir).filter((file) => file.endsWith('.yml')); const allowed = new Set(['markdown','textarea','input','dropdown','checkboxes']); const expected = new Set(['bug-report.yml','feature-request.yml','ui-ux-improvement.yml','performance-issue.yml','mobile-responsive-issue.yml','documentation-issue.yml']); for (const file of files) { const doc = YAML.parse(readFileSync(dir + '/' + file,'utf8')); if (file === 'config.yml') { if (doc.blank_issues_enabled !== false || !Array.isArray(doc.contact_links) || doc.contact_links.length !== 1) throw new Error(file + ': chooser contract'); continue; } if (!expected.has(file)) throw new Error(file + ': unexpected form'); for (const key of ['name','description','title','labels','assignees','body']) if (!(key in doc)) throw new Error(file + ': missing ' + key); const ids = new Set(); for (const field of doc.body) { if (!allowed.has(field.type)) throw new Error(file + ': invalid type ' + field.type); if (field.id) { if (ids.has(field.id)) throw new Error(file + ': duplicate id ' + field.id); ids.add(field.id); } if (field.type !== 'markdown' && !field.attributes?.label) throw new Error(file + ': missing label'); } if (!ids.has('confirmations')) throw new Error(file + ': missing confirmations'); } if (files.length !== 7) throw new Error('expected 7 YAML files, got ' + files.length); console.log('Validated', files.length, 'YAML files');"
```

Expected: `Validated 7 YAML files`.

- [ ] **Step 11: Yalnız Issue Form fayllarını commit et**

```bash
git add .github/ISSUE_TEMPLATE
git diff --cached --check
git commit -m "docs(github): add structured issue forms"
```

Expected: commit contains six forms and one chooser config.

---

### Task 3: Pull Request template və README inteqrasiyası

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Modify: `README.md`
- Verify unchanged: `SECURITY.md`
- Verify unchanged: `LICENSE`

**Interfaces:**
- Consumes: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, altı Issue Form.
- Produces: GitHub PR açılarkən avtomatik görünən review müqaviləsi və README-dən community entry points.

- [ ] **Step 1: PR template və README linkləri üçün failing validation işlət**

Run:

```powershell
& node --input-type=module -e "import { existsSync, readFileSync } from 'node:fs'; if (!existsSync('.github/PULL_REQUEST_TEMPLATE.md')) throw new Error('missing PR template'); const readme = readFileSync('README.md','utf8'); for (const link of ['CONTRIBUTING.md','CODE_OF_CONDUCT.md']) if (!readme.includes(link)) throw new Error('README missing ' + link);"
```

Expected: FAIL with `missing PR template`.

- [ ] **Step 2: `.github/PULL_REQUEST_TEMPLATE.md` yarat**

Template bu dəqiq heading strukturunu saxlamalıdır:

```markdown
## Xülasə
## Əlaqəli Issue
## Dəyişiklik növü
## Tətbiq detalları
## Testlər
## Screenshots / vizual sübut
## Breaking changes, migration və rollback
## Təhlükəsizlik və məlumat təsiri
## Sənədləşdirmə
## Checklist
```

`Əlaqəli Issue` bölməsində görünən placeholder məhz bu olmalıdır:

```text
Closes #
```

`Dəyişiklik növü` checkbox-ları: funksiya, xəta düzəlişi, UI/UX, performans, responsive, refactor, test, sənədləşdirmə, build/CI/chore.

`Testlər` bölməsi hər quality gate komandası üçün checkbox və nəticə sahəsi saxlamalıdır:

```markdown
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
```

Vizual bölmə UI dəyişikliyində əvvəl/sonra screenshot, viewport və dark/light mode sübutu tələb etməlidir. Breaking bölməsi `Tətbiq edilmir` seçimindən əlavə migration, deploy ardıcıllığı və rollback planını soruşmalıdır. Security bölməsi secret, token, cookie və real məlumatın PR-a əlavə edilməməsini xatırlatmalıdır.

Checklist aşağıdakı maddələri ehtiva etməlidir:

- scope issue ilə məhduddur;
- self-review aparılıb;
- yeni davranış testlə qorunur;
- accessibility və responsive təsir yoxlanıb;
- schema/migration geri dönüş planına malikdir;
- sənədlər yenilənib və ya tətbiq edilmir kimi əsaslandırılıb;
- breaking change aydın işarələnib;
- secret və production məlumatı commit/PR-a daxil edilməyib;
- branch və commit adları `CONTRIBUTING.md` qaydalarına uyğundur.

- [ ] **Step 3: README-in yuxarı keçidlərini genişləndir**

Mövcud mərkəzləşdirilmiş link sırasına bu iki keçidi `Texniki Wiki` ilə `Təhlükəsizlik siyasəti` arasında əlavə et:

```html
<a href="CONTRIBUTING.md">Töhfə qaydaları</a>
·
<a href="CODE_OF_CONDUCT.md">Davranış kodeksi</a>
·
```

- [ ] **Step 4: README-ə “Töhfə vermək” bölməsi əlavə et**

`## Keyfiyyət qapısı` bölməsindən dərhal əvvəl bu məzmunu əlavə et:

```markdown
## Töhfə vermək

Təklif və düzəlişlər uyğun [GitHub Issue Form](https://github.com/MuradoffTehmez/LuxeHome/issues/new/choose) ilə başlamalıdır. Təhlükəsizlik zəifliyini açıq issue kimi paylaşmayın; [təhlükəsizlik siyasətindəki](SECURITY.md) məxfi kanaldan istifadə edin.

Layihə `Issue → Branch → Commit → Pull Request → Review → Merge` axınından, məqsədli branch-lardan və Conventional Commits formatından istifadə edir. Lokal quraşdırma, branch adları, commit nümunələri, database qaydaları və PR gözləntiləri üçün [CONTRIBUTING.md](CONTRIBUTING.md) sənədini oxuyun. İştirak etməklə [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) qaydalarını qəbul etmiş olursunuz.
```

- [ ] **Step 5: PR və README müqaviləsini yoxla**

Run:

```powershell
& node --input-type=module -e "import { readFileSync } from 'node:fs'; const pr = readFileSync('.github/PULL_REQUEST_TEMPLATE.md','utf8'); const readme = readFileSync('README.md','utf8'); const prNeedles = ['## Xülasə','## Əlaqəli Issue','Closes #','## Dəyişiklik növü','## Testlər','npm run typecheck','npm run lint','npm test','npm run build','## Screenshots / vizual sübut','## Breaking changes, migration və rollback','## Təhlükəsizlik və məlumat təsiri','## Checklist']; const readmeNeedles = ['CONTRIBUTING.md','CODE_OF_CONDUCT.md','Issue → Branch → Commit → Pull Request → Review → Merge','issues/new/choose','SECURITY.md']; const missing = [...prNeedles.filter((item) => !pr.includes(item)).map((item) => 'PR:' + item), ...readmeNeedles.filter((item) => !readme.includes(item)).map((item) => 'README:' + item)]; if (missing.length) { console.error(missing.join('\n')); process.exit(1); }"
```

Expected: exit 0 with no output.

- [ ] **Step 6: LICENSE və SECURITY-nin qorunduğunu yoxla**

Run:

```bash
git diff --exit-code HEAD -- LICENSE SECURITY.md
```

Expected: exit 0; neither file changed.

- [ ] **Step 7: Yalnız PR template və README inteqrasiyasını commit et**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md README.md
git diff --cached --check
git commit -m "docs(github): add pull request workflow"
```

Expected: commit contains one new template and one focused README update.

---

### Task 4: Tam community validation və təmiz snapshot gate-i

**Files:**
- Verify: `CODE_OF_CONDUCT.md`
- Verify: `CONTRIBUTING.md`
- Verify: `.github/PULL_REQUEST_TEMPLATE.md`
- Verify: `.github/ISSUE_TEMPLATE/*.yml`
- Verify: `README.md`
- Verify unchanged: `LICENSE`
- Verify unchanged: `SECURITY.md`

**Interfaces:**
- Consumes: Task 1–3 nəticələri.
- Produces: review-ready branch, schema sübutu və clean-snapshot tətbiq gate nəticəsi.

- [ ] **Step 1: Dəqiq fayl inventarını yoxla**

Run:

```powershell
& node --input-type=module -e "import { existsSync } from 'node:fs'; const required = ['CODE_OF_CONDUCT.md','CONTRIBUTING.md','.github/PULL_REQUEST_TEMPLATE.md','.github/ISSUE_TEMPLATE/bug-report.yml','.github/ISSUE_TEMPLATE/feature-request.yml','.github/ISSUE_TEMPLATE/ui-ux-improvement.yml','.github/ISSUE_TEMPLATE/performance-issue.yml','.github/ISSUE_TEMPLATE/mobile-responsive-issue.yml','.github/ISSUE_TEMPLATE/documentation-issue.yml','.github/ISSUE_TEMPLATE/config.yml']; const missing = required.filter((file) => !existsSync(file)); if (missing.length) { console.error(missing.join('\n')); process.exit(1); } console.log('Community files:', required.length);"
```

Expected: `Community files: 10`.

- [ ] **Step 2: Task 2-dəki tam YAML schema validatorunu yenidən işlət**

Run:

```powershell
& node --input-type=module -e "import { readFileSync, readdirSync } from 'node:fs'; import YAML from 'yaml'; const dir = '.github/ISSUE_TEMPLATE'; const files = readdirSync(dir).filter((file) => file.endsWith('.yml')); const allowed = new Set(['markdown','textarea','input','dropdown','checkboxes']); const expected = new Set(['bug-report.yml','feature-request.yml','ui-ux-improvement.yml','performance-issue.yml','mobile-responsive-issue.yml','documentation-issue.yml']); for (const file of files) { const doc = YAML.parse(readFileSync(dir + '/' + file,'utf8')); if (file === 'config.yml') { if (doc.blank_issues_enabled !== false || !Array.isArray(doc.contact_links) || doc.contact_links.length !== 1) throw new Error(file + ': chooser contract'); continue; } if (!expected.has(file)) throw new Error(file + ': unexpected form'); for (const key of ['name','description','title','labels','assignees','body']) if (!(key in doc)) throw new Error(file + ': missing ' + key); const ids = new Set(); for (const field of doc.body) { if (!allowed.has(field.type)) throw new Error(file + ': invalid type ' + field.type); if (field.id) { if (ids.has(field.id)) throw new Error(file + ': duplicate id ' + field.id); ids.add(field.id); } if (field.type !== 'markdown' && !field.attributes?.label) throw new Error(file + ': missing label'); } if (!ids.has('confirmations')) throw new Error(file + ': missing confirmations'); } if (files.length !== 7) throw new Error('expected 7 YAML files, got ' + files.length); console.log('Validated', files.length, 'YAML files');"
```

Expected: `Validated 7 YAML files`.

- [ ] **Step 3: Daxili Markdown link hədəflərini yoxla**

Run:

```powershell
& node --input-type=module -e "import { existsSync, readFileSync } from 'node:fs'; const files = ['README.md','CONTRIBUTING.md','CODE_OF_CONDUCT.md','.github/PULL_REQUEST_TEMPLATE.md']; const linkPattern = /\[[^\]]+\]\((?!https?:|mailto:|#)([^)#]+)(?:#[^)]+)?\)/g; const missing = []; for (const file of files) { const text = readFileSync(file,'utf8'); for (const match of text.matchAll(linkPattern)) { const target = match[1]; if (!existsSync(target)) missing.push(file + ' -> ' + target); } } if (missing.length) { console.error(missing.join('\n')); process.exit(1); }"
```

Expected: exit 0 with no output.

- [ ] **Step 4: Dublikat template və scope pozuntusunu yoxla**

Run:

```powershell
rg --files -g 'CODE_OF_CONDUCT*' -g 'CONTRIBUTING*' -g '.github/**' -g 'docs/**/PULL_REQUEST_TEMPLATE*'
git diff origin/main...HEAD --name-only
git status --short
```

Expected:

- exactly one `CODE_OF_CONDUCT.md`, one `CONTRIBUTING.md`, one PR template and six Issue Forms;
- branch diff contains the spec, implementation plan, root community docs, README and `.github` files only;
- unrelated `footer.tsx`, `site.ts`, `seo.ts` remain unstaged and uncommitted.

- [ ] **Step 5: Whitespace və Markdown/YAML diff gate-i işlət**

Run:

```bash
git diff --check origin/main...HEAD
```

Expected: exit 0 with no output.

- [ ] **Step 6: Commit olunmuş snapshot üçün müvəqqəti verification worktree yarat**

```powershell
$verifyPath = [IO.Path]::GetFullPath((Join-Path (Get-Location).Path '.worktrees/community-standards-verify'))
if (Test-Path -LiteralPath $verifyPath) { throw "Verification path already exists: $verifyPath" }
git worktree add --detach -- $verifyPath HEAD
```

Expected: detached worktree at current HEAD; unrelated working-tree changes are absent.

- [ ] **Step 7: Clean snapshot-da bütün repository gate-lərini işlət**

Run from `.worktrees/community-standards-verify`:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all four commands exit 0. Existing `jose` Edge Runtime warnings may appear during build; errors are not accepted.

- [ ] **Step 8: Müvəqqəti worktree-ni təhlükəsiz təmizlə**

Run from the main workspace root:

```powershell
$workspaceRoot = [IO.Path]::GetFullPath((Get-Location).Path)
$worktreesRoot = [IO.Path]::GetFullPath((Join-Path $workspaceRoot '.worktrees'))
$verifyPath = [IO.Path]::GetFullPath((Join-Path $worktreesRoot 'community-standards-verify'))
if (-not $verifyPath.StartsWith($worktreesRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe worktree path' }
git -C $verifyPath status --porcelain -uall
git worktree remove -- $verifyPath
git worktree prune
```

Expected: verification worktree is clean and removed without `--force`.

- [ ] **Step 9: Final branch vəziyyətini qeyd et**

```bash
git log --oneline origin/main..HEAD
git status --short
```

Expected: spec, plan və üç implementation commit görünür; only the user's unrelated source changes remain unstaged. Do not create an empty final commit.
