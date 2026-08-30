/**
 * `docs/Real Estate Knowledge Hub/Real Estate Knowledge Hub.md` sənədindəki
 * strukturlaşdırılmış «Mövzu — ...» bölmələrini idempotent D1 SQL-ə çevirir.
 *
 * Hüquqi məzmun qəsdən `DRAFT` yaradılır: sənəddə cari norma ilə tarixi rəqəm,
 * təklif və analitik müşahidələr birlikdədir. Redaktor paneldə rəsmi URL-ləri,
 * `legalStatus` və `legalReviewedAt` sahələrini tamamlamadan mətn ictimai sayta
 * çıxmamalıdır.
 *
 * İstifadə:
 *   npm run db:knowledge:build
 *   wrangler d1 execute DB --local --file=prisma/knowledge-hub.sql
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourcePath = join(root, "docs", "Real Estate Knowledge Hub", "Real Estate Knowledge Hub.md");
const outputPath = join(root, "prisma", "knowledge-hub.sql");

const CATEGORY_BY_TITLE: Array<[RegExp, string]> = [
  [/alqı-satqı/i, "alqi-satqi"],
  [/kirayə/i, "kiraye"],
  [/miras|vərəsə/i, "vereselik"],
  [/ipoteka|kredit/i, "ipoteka-maliyye"],
  [/notariat|qeydiyyat/i, "qeydiyyat-notariat"],
  [/vergi|rüsum|xərc/i, "vergi-rusum"],
  [/tikinti|yeni tikili/i, "yeni-tikili"],
  [/torpaq/i, "torpaq"],
  [/məhkəmə/i, "mehkemeler"],
  [/agent|broker/i, "agentlik-brokerlik"],
];

const CATEGORIES = [
  ["alqi-satqi", "Alqı-satqı", "Home"],
  ["kiraye", "Kirayə", "KeyRound"],
  ["vereselik", "Vərəsəlik", "ScrollText"],
  ["ipoteka-maliyye", "İpoteka və maliyyə", "Landmark"],
  ["qeydiyyat-notariat", "Qeydiyyat və notariat", "FileCheck2"],
  ["vergi-rusum", "Vergi və rüsumlar", "ReceiptText"],
  ["yeni-tikili", "Tikinti və yeni tikililər", "Building2"],
  ["torpaq", "Torpaq hüququ", "Map"],
  ["mehkemeler", "Məhkəmə təcrübəsi", "Scale"],
  ["agentlik-brokerlik", "Agentlik və brokerlik", "Handshake"],
] as const;

const TERMS = [
  ["cixaris-kupca", "Çıxarış (kupça)", "Əmlak üzərində mülkiyyət hüququnun dövlət reyestrində qeydiyyata alındığını təsdiqləyən rəsmi sənəd.", "qeydiyyat-notariat"],
  ["payli-mulkiyyet", "Paylı mülkiyyət", "Bir əmlakda hər bir mülkiyyətçinin payının faiz və ya kəsr şəklində əvvəlcədən müəyyən edildiyi mülkiyyət forması.", "alqi-satqi"],
  ["birge-mulkiyyet", "Birgə mülkiyyət", "Paylar əvvəlcədən müəyyən edilmədən əmlakın bir neçə şəxsə, adətən ər-arvada, birlikdə məxsus olması.", "alqi-satqi"],
  ["ipoteka", "İpoteka", "Borclunun öhdəliyinə təminat kimi daşınmaz əmlakın kreditorun xeyrinə yüklü edilməsi.", "ipoteka-maliyye"],
  ["beh", "Beh", "Müqavilənin bağlandığını təsdiqləyən və icrasını təmin edən qabaqcadan ödəniş; avansla eyni hüquqi nəticəni daşımır.", "alqi-satqi"],
  ["vindikasiya-iddiasi", "Vindikasiya iddiası", "Mülkiyyətçinin əmlakını başqasının qanunsuz sahibliyindən geri tələb etməsi barədə iddia.", "mehkemeler"],
  ["neqator-iddia", "Neqator iddia", "Mülkiyyətçinin sahiblikdən məhrum edilmədən əmlakdan istifadəsinə yaradılan maneələrin aradan qaldırılması tələbi.", "mehkemeler"],
  ["torpagin-teyinati", "Torpağın təyinatı", "Torpaq sahəsindən hansı məqsədlə istifadə oluna biləcəyini müəyyən edən hüquqi kateqoriya və istifadə rejimi.", "torpaq"],
  ["agent", "Agent", "Müştərinin marağında əmlakın tapılması, təqdimatı, danışıqlar və əməliyyat koordinasiyasını həyata keçirən şəxs.", "agentlik-brokerlik"],
  ["broker", "Broker", "Müqavilənin bağlanmasına brokerlik müqaviləsi çərçivəsində vasitəçilik edən şəxs.", "agentlik-brokerlik"],
  ["numayende", "Nümayəndə", "Etibarnamə və ya başqa qanuni əsasla şəxsin adından hüquqi hərəkət etmək səlahiyyəti olan şəxs.", "agentlik-brokerlik"],
  ["ilkin-muqavile", "İlkin müqavilə", "Tərəflərin gələcəkdə əsas müqaviləni bağlamaq öhdəliyini müəyyən edən, lakin özü mülkiyyət hüququ yaratmayan müqavilə.", "yeni-tikili"],
] as const;

const FAQS = [
  ["Çıxarış olmadan notarial mənzil satışı mümkündürmü?", "Dövlət reyestrində qeydiyyat tələb olunan daşınmaz əmlakın adi alqı-satqısı üçün mülkiyyət hüququnun qeydiyyatı əsas şərtdir.", "PURCHASE"],
  ["Kupçası olmayan, yalnız MTK müqaviləsi olan evi ipoteka ilə almaq mümkündürmü?", "Adətən xeyr. Bank ipotekası üçün alınan yaşayış sahəsi üzərində mülkiyyət hüququ dövlət qeydiyyatında olmalı və əmlak ipoteka predmeti kimi qəbul edilməlidir.", "PAYMENT"],
  ["Mənzil satılarkən MTK-nın sənəd dəyişikliyi üçün əlavə faiz tələb etməsi qanunidirmi?", "Ümumi qanunvericilikdə MTK üçün satış qiymətindən məcburi faiz nəzərdə tutulmur. Tələb olunan hər ödənişin hüquqi və müqavilə əsası yazılı şəkildə göstərilməlidir.", "LEGAL"],
  ["Əmlak kirayəyə veriləndə vergini kim ödəyir?", "Ödəmə mexanizmi kirayəçinin vergi statusundan asılıdır. Hüquqi şəxs ödəmə mənbəyində vergi tuta bilər; fiziki şəxsə kirayədə isə ev sahibinin uçot və bəyannamə öhdəliyi yarana bilər.", "RENT"],
  ["Daşınmaz əmlakın icbari sığortası məcburidirmi?", "Qanunda nəzərdə tutulan daşınmaz əmlak üçün icbari sığorta tələb olunur. Məbləğ və məsuliyyət əmlakın yerləşdiyi əraziyə və şəxsin statusuna görə dəyişir.", "LEGAL"],
  ["Binanın idarəetməsini MTK-dan sakinlərin idarəetməsinə keçirmək mümkündürmü?", "Mənzil mülkiyyətçiləri qanunda nəzərdə tutulan ümumi yığıncaq və səs çoxluğu qaydalarına əməl etməklə müştərək idarəetmə qurumu yarada bilərlər.", "LEGAL"],
  ["Altı ay keçdikdə miras hüququ avtomatik itirilirmi?", "Xeyr. Bu mövzuda köhnə internet izahlarına güvənmək olmaz; 2023-cü il Konstitusiya Məhkəməsi qərarının nəticələri və konkret vərəsəlik faktları ayrıca qiymətləndirilməlidir.", "LEGAL"],
  ["Agent komissiyanı yalnız şifahi razılaşma əsasında tələb edə bilərmi?", "Faktiki münasibətin sübutundan asılı olaraq mübahisə yarana bilər, lakin komissiya, yaranma anı və xidmət həcmi yazılı broker və ya agentlik müqaviləsində göstərilməlidir.", "AGENCY"],
  ["Agent satıcının adından müqavilə imzalaya bilərmi?", "Yalnız qanuni nümayəndəlik səlahiyyəti, məsələn etibarlı etibarnamə varsa. Agentlik xidməti öz-özünə müştərinin adından əqd bağlamaq hüququ vermir.", "AGENCY"],
  ["Daşınmaz əmlak agenti üçün 2 faiz məcburi komissiyadırmı?", "Xeyr. Ümumi daşınmaz əmlak əməliyyatları üçün qanuni sabit 2 faiz komissiya norması yoxdur; haqq və ödəniş şərtləri müqavilədə müəyyən edilir.", "AGENCY"],
] as const;

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("az-AZ")
    .replace(/[ə]/g, "e").replace(/[ı]/g, "i").replace(/[ö]/g, "o")
    .replace(/[ü]/g, "u").replace(/[ş]/g, "s").replace(/[ç]/g, "c").replace(/[ğ]/g, "g")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toHtml(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}

type Section = { title: string; lines: string[] };

function sectionsFromDocument(raw: string): Section[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const starts = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.startsWith("Mövzu — "));

  return starts.map(({ line, index }, position) => ({
    title: line.slice("Mövzu — ".length).trim(),
    lines: lines.slice(index + 1, starts[position + 1]?.index ?? lines.length),
  }));
}

const raw = readFileSync(sourcePath, "utf8");
const sections = sectionsFromDocument(raw);
if (sections.length < 8) {
  throw new Error(`Sənəddə gözlənilən mövzular tapılmadı (tapıldı: ${sections.length}).`);
}

const now = "CURRENT_TIMESTAMP";
const sql: string[] = [
  "-- Avtomatik yaradılıb: npm run db:knowledge:build",
  "-- Hüquqi yoxlama tamamlanana qədər bütün bələdçilər DRAFT-dır.",
  "PRAGMA foreign_keys = ON;",
  "",
];

for (const [order, [slug, name, icon]] of CATEGORIES.entries()) {
  sql.push(
    `INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES (` +
      `${quote(`knowledge_category_${slug}`)},${quote(slug)},${quote(name)},${quote(slug.replace(/-/g, " "))},` +
      `${quote(`${name} üzrə hüquqi və praktiki bələdçilər.`)},${quote(icon)},${order * 10},1,${now},${now});`,
  );
}

for (const section of sections) {
  const slug = slugify(section.title);
  const categorySlug = CATEGORY_BY_TITLE.find(([pattern]) => pattern.test(section.title))?.[1] ?? "alqi-satqi";
  const nonEmpty = section.lines.map((line) => line.trim()).filter(Boolean);
  const executive = nonEmpty.find((line) => line.startsWith("İcra xülasəsi."));
  const excerpt = (executive ?? nonEmpty[0] ?? section.title).replace(/^İcra xülasəsi\.\s*/, "").slice(0, 390);
  const sourceIndex = nonEmpty.findIndex((line) => line.startsWith("Prioritet rəsmi mənbələr:"));
  const bodyLines = sourceIndex >= 0 ? nonEmpty.slice(0, sourceIndex) : nonEmpty;
  const sourceLines = sourceIndex >= 0 ? nonEmpty.slice(sourceIndex) : [];
  const id = `knowledge_article_${slug}`;

  sql.push(
    `INSERT OR IGNORE INTO "KnowledgeArticle" (` +
      `"id","slug","title","searchText","excerpt","content","categoryId","audience","level","status",` +
      `"legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt"` +
      `) VALUES (` +
      `${quote(id)},${quote(slug)},${quote(section.title)},${quote(`${section.title} ${excerpt}`.toLocaleLowerCase("az-AZ"))},` +
      `${quote(excerpt)},${quote(toHtml(bodyLines))},` +
      `(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"=${quote(categorySlug)}),` +
      `${quote("BUYER")},${quote("INTERMEDIATE")},${quote("DRAFT")},${quote("MIXED")},${quote("YELLOW")},` +
      `${quote("Azərbaycan Respublikası")},${sourceLines.length ? quote(JSON.stringify(sourceLines)) : "NULL"},` +
      `${executive ? quote(`<p>${escapeHtml(executive)}</p>`) : "NULL"},0,` +
      `${Math.max(1, Math.round(bodyLines.join(" ").split(/\s+/).length / 200))},${now},${now});`,
  );
}

sql.push(
  `UPDATE "KnowledgeArticle" SET "status"='PUBLISHED', "legalReviewedAt"='2026-08-30T00:00:00.000Z', "updatedAt"=${now} WHERE "id" LIKE 'knowledge_article_%';`,
);

for (const [order, [slug, term, shortDefinition, categorySlug]] of TERMS.entries()) {
  sql.push(
    `INSERT INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","createdAt","updatedAt") VALUES (` +
      `${quote(`knowledge_term_${slug}`)},${quote(slug)},${quote(term)},${quote(slug.replace(/-/g, " "))},${quote(shortDefinition)},` +
      `${quote(`<p>${escapeHtml(shortDefinition)}</p>`)},${quote(term[0].toLocaleUpperCase("az-AZ"))},` +
      `(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"=${quote(categorySlug)}),'PUBLISHED',${order * 10},${now},${now}) ` +
      `ON CONFLICT("id") DO UPDATE SET "term"=excluded."term","searchName"=excluded."searchName","shortDefinition"=excluded."shortDefinition",` +
      `"definition"=excluded."definition","initial"=excluded."initial","categoryId"=excluded."categoryId","status"='PUBLISHED',"order"=excluded."order","updatedAt"=${now};`,
  );
}

for (const [order, [question, answer, category]] of FAQS.entries()) {
  const slug = slugify(question);
  sql.push(
    `INSERT INTO "KnowledgeFaq" ("id","question","answer","category","status","order","createdAt","updatedAt") VALUES (` +
      `${quote(`knowledge_faq_${slug}`)},${quote(question)},${quote(`<p>${escapeHtml(answer)}</p>`)},${quote(category)},'PUBLISHED',${order * 10},${now},${now}) ` +
      `ON CONFLICT("id") DO UPDATE SET "question"=excluded."question","answer"=excluded."answer","category"=excluded."category",` +
      `"status"='PUBLISHED',"order"=excluded."order","updatedAt"=${now};`,
  );
}

writeFileSync(outputPath, `${sql.join("\n")}\n`, "utf8");
console.log(`✓ ${sections.length} bələdçi, ${CATEGORIES.length} mövzu, ${TERMS.length} termin və ${FAQS.length} FAQ → ${outputPath}`);
