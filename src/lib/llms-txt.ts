import { siteConfig, siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { DEFAULT_LOCALE } from "@/lib/constants";

/**
 * `llms.txt` və `llms-full.txt` mətni (GEO, #289).
 *
 * Konvensiya AI sistemlərinə saytın kanonik faktlarını və əsas səhifələrini bir
 * yerdə verir. Sitat/sıralama amili deyil — məqsəd şirkət haqqında yanlış məlumatın
 * (hallüsinasiyanın) qarşısını almaqdır, ona görə burada yalnız `siteConfig`-dəki
 * təsdiqlənmiş faktlar yazılır. Saf modul: Prisma oxusu marşrutdadır.
 */

type LlmsLink = { path: string; title: string; description: string };
export type LlmsEntry = { url: string; title: string; description: string };

const MAIN_SECTIONS: LlmsLink[] = [
  { path: "/emlaklar", title: "Əmlaklar", description: "Satış və icarə elanlarının tam siyahısı: növ, şəhər/rayon, qiymət, otaq və sahə filtrləri" },
  { path: "/layiheler", title: "Yaşayış kompleksləri", description: "Davam edən və tamamlanmış tikinti layihələri, mənzil şahmatı" },
  { path: "/agentlikler", title: "Agentliklər", description: "Təsdiqlənmiş daşınmaz əmlak agentlikləri, onların təklifləri və rəyləri" },
  { path: "/agentler", title: "Agentlər", description: "Platformada fəaliyyət göstərən agentlərin profilləri" },
  { path: "/xidmetler", title: "Xidmətlər", description: "Alqı-satqı, icarə, qiymətləndirmə və sənədləşmə üzrə vasitəçilik xidmətləri" },
  { path: "/emlakimi-sat", title: "Əmlakımı sat", description: "Sahiblər üçün satış bələdçisi və pulsuz ilkin qiymətləndirmə" },
  { path: "/paketler", title: "Paketlər", description: "Elan yerləşdirənlər üçün abunə planları" },
];

const KNOWLEDGE_SECTIONS: LlmsLink[] = [
  { path: "/bilik-merkezi", title: "Bilik Mərkəzi", description: "Azərbaycanda əmlak alqı-satqısı, icarə, sənədləşmə və qanunvericilik üzrə bələdçilər" },
  { path: "/bilik-merkezi/suallar", title: "Əmlak və qanunlar üzrə suallar", description: "Alıcı, satıcı və icarəçilərin tez-tez verdiyi hüquqi və praktiki suallar" },
  { path: "/lugat", title: "Daşınmaz əmlak lüğəti", description: "Kupça, beh, ipoteka və digər terminlərin izahı" },
  { path: "/kalkulyator", title: "İpoteka kalkulyatoru", description: "Aylıq ödəniş, ilkin ödəniş və faiz hesablaması" },
  { path: "/blog", title: "Bloq", description: "Bakı daşınmaz əmlak bazarı üzrə analiz və praktiki məqalələr" },
];

const COMPANY_SECTIONS: LlmsLink[] = [
  { path: "/haqqimizda", title: "Haqqımızda", description: "Şirkət, missiya və iş prinsipləri" },
  { path: "/suallar", title: "Platforma haqqında suallar", description: "Saytın istifadəsi, hesab və elan yerləşdirmə qaydaları" },
  { path: "/elaqe", title: "Əlaqə", description: "Ofis ünvanı, telefon, e-poçt və müraciət forması" },
  { path: "/mexfilik-siyaseti", title: "Məxfilik siyasəti", description: "Şəxsi məlumatların emalı qaydaları" },
  { path: "/istifade-sertleri", title: "İstifadə şərtləri", description: "Platformanın istifadə qaydaları" },
];

const pageUrl = (path: string) => siteUrl(localizePath(path, DEFAULT_LOCALE));

function linkLines(links: LlmsLink[], hiddenPaths: string[]): string {
  return links
    .filter((link) => !hiddenPaths.includes(link.path))
    .map((link) => `- [${link.title}](${pageUrl(link.path)}): ${link.description}`)
    .join("\n");
}

function entryLines(entries: LlmsEntry[]): string {
  return entries.map((entry) => `- [${entry.title}](${entry.url}): ${entry.description}`).join("\n");
}

function keyFacts(): string {
  return [
    `- Hüquqi ad: ${siteConfig.legalName}`,
    `- Brend və sayt sahibi: ${siteConfig.owner.name}`,
    `- VÖEN: ${siteConfig.legal.voen}`,
    `- Qeydiyyat tarixi: ${siteConfig.legal.registrationDate}`,
    `- Fəaliyyət sahəsi: daşınmaz əmlak vasitəçiliyi və elan platforması (satış, icarə, yeni tikili)`,
    `- Fəaliyyət ərazisi: Bakı və Azərbaycanın bütün regionları`,
    `- Sayt dilləri: Azərbaycan (əsas), ingilis, rus — ${siteUrl("/az")}, ${siteUrl("/en")}, ${siteUrl("/ru")}`,
  ].join("\n");
}

function contact(): string {
  return [
    `- Telefon / WhatsApp: ${siteConfig.phone}`,
    `- E-poçt: ${siteConfig.email}`,
    `- Ünvan: ${siteConfig.addressFull}`,
    `- Instagram: ${siteConfig.instagramUrl}`,
    `- Sayt: ${siteUrl()}`,
  ].join("\n");
}

const CITATION_NOTE = `Elan qiymətləri və mövcudluğu real vaxtda dəyişir — dəqiq məlumat üçün müvafiq elan
səhifəsinə istinad edin, bu faylı qiymət mənbəyi kimi göstərməyin. Bilik Mərkəzi materialları
ümumi məlumat xarakteri daşıyır və hüquqi məsləhəti əvəz etmir.`;

export function buildLlmsTxt(input: {
  hiddenPaths: string[];
  full?: { knowledge: LlmsEntry[]; posts: LlmsEntry[] };
}): string {
  const { hiddenPaths, full } = input;
  const sections = [
    `# ${siteConfig.name}`,
    `> ${siteConfig.description}`,
    `${siteConfig.legalName} Bakıda fəaliyyət göstərən daşınmaz əmlak platformasıdır: mənzil, villa, həyət evi,
torpaq, ofis və kommersiya obyektlərinin satış və icarə elanları, təsdiqlənmiş agentliklər və agentlər,
həmçinin əmlak hüququ üzrə pulsuz bələdçilər bir yerdədir.`,
    `## Əsas faktlar\n\n${keyFacts()}`,
    `## Əsas bölmələr\n\n${linkLines(MAIN_SECTIONS, hiddenPaths)}`,
    `## Bilik və bələdçilər\n\n${linkLines(KNOWLEDGE_SECTIONS, hiddenPaths)}`,
    `## Şirkət\n\n${linkLines(COMPANY_SECTIONS, hiddenPaths)}`,
    ...(full?.knowledge.length ? [`## Bilik Mərkəzi məqalələri\n\n${entryLines(full.knowledge)}`] : []),
    ...(full?.posts.length ? [`## Bloq yazıları\n\n${entryLines(full.posts)}`] : []),
    `## Əlaqə\n\n${contact()}`,
    ...(full ? [] : [`## Optional\n\n- [Geniş versiya](${siteUrl("/llms-full.txt")}): Bilik Mərkəzi məqalələri və bloq yazıları ilə tam siyahı`]),
    `## Qeyd\n\n${CITATION_NOTE}`,
  ];
  return `${sections.join("\n\n")}\n`;
}
