import { isStaging, siteConfig, siteUrl } from "@/config/site";

/**
 * LLM axtarış/söhbət alətləri üçün sayt xülasəsi (Generative Engine Optimization).
 *
 * `llms.txt` formalaşmaqda olan qeyri-rəsmi konvensiyadır — böyük dil modelləri
 * saytı düzgün sitat gətirmək üçün bu faylı oxuya bilir. `robots.txt`-dən fərqli
 * olaraq icazə/qadağa deyil, kontekst təqdim edir.
 */
export function GET() {
  if (isStaging()) {
    return new Response("# Staging mühiti — indekslənməməlidir\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const body = `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.legalName} Bakıda fəaliyyət göstərən daşınmaz əmlak platformasıdır. Mənzil, villa,
həyət evi, torpaq, ofis və kommersiya obyektlərinin satışı və icarəsi üzrə vasitəçilik edir.

## Əsas bölmələr

- [Əmlaklar](${siteUrl("/emlaklar")}) — satış və icarə elanlarının tam siyahısı, filtrlə axtarış
- [Yaşayış kompleksləri](${siteUrl("/layiheler")}) — davam edən və tamamlanmış tikinti layihələri
- [Agentliklər](${siteUrl("/agentlikler")}) — təsdiqlənmiş tərəfdaş agentliklərin siyahısı
- [Xidmətlər](${siteUrl("/xidmetler")}) — göstərilən daşınmaz əmlak xidmətləri
- [Tez-tez verilən suallar](${siteUrl("/suallar")}) — alqı-satqı və icarə prosesi haqqında cavablar
- [Bloq](${siteUrl("/blog")}) — bazar analizi və bələdçi məqalələr
- [Əlaqə](${siteUrl("/elaqe")}) — ünvan, telefon və müraciət forması

## Əlaqə

- Telefon: ${siteConfig.phone}
- E-poçt: ${siteConfig.email}
- Ünvan: ${siteConfig.addressFull}
- Sayt: ${siteUrl()}

## Qeyd

Elan qiymətləri və mövcudluğu real vaxtda dəyişir — dəqiq məlumat üçün müvafiq elan
səhifəsinə istinad edin, bu faylı qiymət mənbəyi kimi göstərməyin.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
