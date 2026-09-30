/**
 * Yoxlanmış rəsmi mənbələr (29.09.2026). Hər ünvan HTTP 200 qaytarır və
 * `src/lib/official-sources.ts`-dəki adla göstərilir; test hər bələdçinin
 * yalnız bu siyahıdan istinad etdiyini yoxlayır.
 */
export const SRC = {
  civilCode: "https://e-qanun.az/framework/46944",
  taxCode: "https://e-qanun.az/framework/46948",
  landCode: "https://e-qanun.az/framework/46942",
  housingCode: "https://e-qanun.az/framework/46955",
  urbanCode: "https://e-qanun.az/framework/46958",
  familyCode: "https://e-qanun.az/framework/46946",
  registryLaw: "https://e-qanun.az/framework/5456",
  notaryLaw: "https://e-qanun.az/framework/107",
  mortgageLaw: "https://e-qanun.az/framework/9902",
  stateDutyLaw: "https://e-qanun.az/framework/2860",
  insuranceLaw: "https://e-qanun.az/framework/22228",
  mcgf: "https://mcgf.gov.az/az/ipoteka-krediti",
  emdx: "https://emlak.gov.az/az",
  eEmlak: "https://e-emlak.gov.az/",
  taxes: "https://www.taxes.gov.az/az",
  eGov: "https://my.gov.az/",
  asan: "https://asan.gov.az/",
  justice: "https://justice.gov.az/az",
  mida: "https://www.mida.gov.az/",
  arxkom: "https://arxkom.gov.az/",
  stat: "https://www.stat.gov.az/",
  fhn: "https://fhn.gov.az/az",
  adminDivisions: "https://e-qanun.az/framework/57325",
} as const;

export const ACT = {
  civilCode: "Azərbaycan Respublikasının Mülki Məcəlləsi",
  taxCode: "Azərbaycan Respublikasının Vergi Məcəlləsi",
  landCode: "Azərbaycan Respublikasının Torpaq Məcəlləsi",
  housingCode: "Azərbaycan Respublikasının Mənzil Məcəlləsi",
  urbanCode: "Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi",
  familyCode: "Azərbaycan Respublikasının Ailə Məcəlləsi",
  registryLaw: "«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu",
  notaryLaw: "«Notariat haqqında» Azərbaycan Respublikasının Qanunu",
  mortgageLaw: "«İpoteka haqqında» Azərbaycan Respublikasının Qanunu",
  stateDutyLaw: "«Dövlət rüsumu haqqında» Azərbaycan Respublikasının Qanunu",
  insuranceLaw: "«İcbari sığortalar haqqında» Azərbaycan Respublikasının Qanunu",
} as const;
