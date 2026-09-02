# GitHub governance və repository settings

Bu sənəd LuxeHome repository-sinin GitHub-da kodla saxlanmayan idarəetmə parametrlərini,
label taksonomiyasını və release qərarını qeyd edir. Son yoxlama: **3 sentyabr 2026**.

## Standart development axını

```text
Issue → Branch → Commit → Pull Request → CI → Code Review → Merge → Issue close
                                                       └→ lazım olduqda Release
```

`main` yalnız production-ready kod üçündür. İş real issue-dan başlayan ayrıca branch-də
aparılır, PR `Closes #<issue-id>` ilə həmin issue-nu bağlayır və yalnız məcburi yoxlamalar
keçəndən sonra squash merge edilir.

## GitHub-da təsdiqlənmiş cari vəziyyət

- `main` üçün classic branch protection aktivdir;
- pull request, güncəl branch, `Quality gate`, `Analyze (javascript-typescript)`,
  `Dependency review`, conversation resolution və linear history məcburidir;
- qayda administratora da tətbiq olunur; force push və branch silinməsi bağlıdır;
- GitHub Actions üçün default `GITHUB_TOKEN` read-only-dir və Actions PR yaratmaq/təsdiqləmək
  hüququ daşımır;
- `staging` və `production` environment-ləri yalnız `main` branch-indən deploy qəbul edir;
- dependency graph, secret scanning, push protection, private vulnerability reporting,
  Dependabot alerts, malware alerts, security updates və grouped security updates aktivdir;
- GitHub Actions yalnız tam commit SHA ilə pinlənmiş action-ları qəbul edir;
- yalnız squash merge aktivdir; update-branch təklifi və merge-dən sonra head branch-in
  avtomatik silinməsi aktivdir.

## `main` branch qoruması

**Settings → Branches → main** bölməsində aşağıdakılar saxlanmalıdır:

- Require a pull request before merging;
- Require status checks to pass before merging;
- Require branches to be up to date before merging;
- Require conversation resolution before merging;
- Require linear history;
- Do not allow bypassing the above settings;
- Allow force pushes: bağlı;
- Allow deletions: bağlı.

Required checks siyahısı:

- `Quality gate`;
- `Analyze (javascript-typescript)`;
- `Dependency review`.

`Label changed areas` təsnifat addımıdır, keyfiyyət qapısı deyil və required check
edilməməlidir. Solo maintainer rejimində məcburi bir approval qoyulmur: GitHub müəllifin öz
PR-ını təsdiqləməsinə icazə vermədiyi üçün bu, repository-ni self-block edər. İkinci maintainer
əlavə olunanda ən azı 1 approval və Code Owner review aktivləşdirilməlidir.

## Pull request merge parametrləri

**Settings → General → Pull Requests**:

- `Allow squash merging`: aktiv;
- `Allow merge commits`: bağlıdır — linear history ilə zidd və UI-da yanlış seçim yaradır;
- `Allow rebase merging`: bağlıdır;
- `Always suggest updating pull request branches`: aktivdir;
- `Automatically delete head branches`: aktivdir;
- `Allow auto-merge`: yalnız required checks sabitləşəndən sonra seçim kimi aktiv edilə bilər.

## Actions siyasəti

**Settings → Actions → General**:

- Workflow permissions: `Read repository contents and packages permissions`;
- `Allow GitHub Actions to create and approve pull requests`: bağlı;
- fork PR-ları üçün ən azı `Require approval for first-time contributors`;
- `Require actions to be pinned to a full-length commit SHA`: aktiv;
- icazə verilən action-ları mümkün olduqda repository sahibi və istifadə olunan rəsmi
  `actions/*`, `github/codeql-action` mənbələri ilə məhdudlaşdır.

Workflow-lar `pull_request_target` istifadə etmir. Daxili branch PR-ları labeler ilə avtomatik
təsnif olunur; fork PR-larında read-only token səbəbindən label maintainer tərəfindən verilir.

## Deployment environment-ləri

**Settings → Environments**:

- `staging` və `production` üçün deployment branches-i yalnız `main` ilə məhdudlaşdırılıb;
- `CLOUDFLARE_API_TOKEN` və `CLOUDFLARE_ACCOUNT_ID` repo-level secret əvəzinə hər iki
  environment-də ayrıca secret kimi saxlanıla bilər; workflow adı dəyişmədən environment
  secret-i avtomatik üstün tutur;
- production required reviewer solo maintainer üçün məcburi edilməməlidir; ikinci səlahiyyətli
  şəxs olduqda production approval qapısı əlavə olunmalıdır;
- secret dəyərlərini issue, PR, workflow log-u və sənədə yazma.

## Advanced Security

**Settings → Advanced Security**:

- Private vulnerability reporting: aktivdir;
- Dependabot alerts və malware alerts: aktivdir;
- Dependabot security updates: aktivdir;
- Grouped security updates: aktivdir;
- Dependency graph: aktiv saxla;
- Secret scanning və push protection: aktiv saxla;
- CodeQL üçün repository-dəki advanced setup workflow-u (`codeql.yml`) istifadə olunur;
  eyni anda GitHub default setup-u ayrıca aktiv etmə.

## Label taksonomiyası

| Qrup | Label-lar |
|---|---|
| İş növü | `bug`, `enhancement`, `documentation`, `performance`, `security` |
| Məhsul sahəsi | `frontend`, `backend`, `api`, `admin`, `database`, `seo`, `i18n`, `mobile`, `ui`, `ux`, `accessibility`, `styles` |
| Proses | `ci-cd`, `github-actions`, `testing`, `dependencies` |
| Prioritet | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` |

Issue Form yalnız ilkin kateqoriya label-ını avtomatik verir. Prioritet və əlavə sahə label-ları
triage zamanı form cavabına əsasən maintainer tərəfindən seçilir. PR labeler dəyişən real
fayl yollarına əsasən məhsul/proses label-larını tətbiq edir.

## Release qərarı

Hazırkı model continuous deployment-dır: hər `main` merge əvvəl staging-ə, E2E keçəndən sonra
production-a yayılır. `package.json` versiyası `0.1.0`-da qalıb, mövcud `v0.1.0` və `v0.2.0`
tag-ları isə cari production buraxılışlarını tam təmsil etmir. Buna görə avtomatik
`release.yml` yaratmaq yanlış release siqnalı verərdi.

SemVer release-ləri aktivləşdirmək üçün əvvəlcə:

1. version bump və changelog qaydası seçilməli;
2. ilk cari baseline release hazırlanmalı;
3. `vMAJOR.MINOR.PATCH` tag-ının yalnız uğurlu `main` commit-inə qoyulması təmin edilməli;
4. release immutability aktivləşdirilməli;
5. bundan sonra tag-triggered release workflow əlavə edilməlidir.

Deploy rollback-u GitHub Release ilə eyni anlayış deyil. Production problemi üçün əvvəlki sağlam
commit ayrıca hotfix/revert PR-ı ilə `main`-ə qaytarılır və normal staging → E2E → production
qapısından keçir.
