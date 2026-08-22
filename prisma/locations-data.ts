/**
 * Azərbaycanın yerləşmə ağacı.
 *
 * Səviyyələr `Location.kind` ilə verilir:
 * - `CITY` — istifadəçinin birinci seçimi: Bakı, respublika şəhərləri və rayonlar.
 *   Rayon burada `DISTRICT` deyil, `CITY` səviyyəsindədir, çünki axtarışda onlar
 *   Bakı ilə eyni pillədə seçilir (Quba, Qusar, Şəki…).
 * - `DISTRICT` — yalnız Bakının 12 inzibati rayonu.
 * - `SETTLEMENT` — qəsəbə və mikrorayonlar; valideyni Bakı rayonudur.
 * - `METRO` — Bakı metrosunun stansiyaları; valideyni Bakıdır.
 *
 * Slug-lar adlardan avtomatik qurulur (`build-taxonomy-sql.ts`), ona görə burada
 * yalnız ad yazılır — əl ilə yazılmış slug-da səhv etmək asandır.
 */

export const BAKU = "Bakı";

/** Respublika tabeli şəhərlər — Bakı ilə eyni siyahıda seçilir. */
export const CITIES: string[] = [
  BAKU,
  "Gəncə",
  "Sumqayıt",
  "Xırdalan",
  "Mingəçevir",
  "Şirvan",
  "Naftalan",
  "Naxçıvan",
  "Xankəndi",
];

/** Ölkənin rayonları — axtarışda şəhərlərlə eyni pillədədir. */
export const REGIONS: string[] = [
  "Abşeron",
  "Ağcabədi",
  "Ağdam",
  "Ağdaş",
  "Ağstafa",
  "Ağsu",
  "Astara",
  "Babək",
  "Balakən",
  "Beyləqan",
  "Bərdə",
  "Biləsuvar",
  "Cəbrayıl",
  "Cəlilabad",
  "Culfa",
  "Daşkəsən",
  "Füzuli",
  "Gədəbəy",
  "Goranboy",
  "Göyçay",
  "Göygöl",
  "Hacıqabul",
  "İmişli",
  "İsmayıllı",
  "Kəlbəcər",
  "Kəngərli",
  "Kürdəmir",
  "Qax",
  "Qazax",
  "Qobustan",
  "Quba",
  "Qubadlı",
  "Qusar",
  "Laçın",
  "Lerik",
  "Lənkəran",
  "Masallı",
  "Neftçala",
  "Oğuz",
  "Ordubad",
  "Saatlı",
  "Sabirabad",
  "Salyan",
  "Samux",
  "Sədərək",
  "Siyəzən",
  "Şabran",
  "Şahbuz",
  "Şamaxı",
  "Şəki",
  "Şəmkir",
  "Şərur",
  "Şuşa",
  "Tərtər",
  "Tovuz",
  "Ucar",
  "Xaçmaz",
  "Xızı",
  "Xocalı",
  "Xocavənd",
  "Yardımlı",
  "Yevlax",
  "Zaqatala",
  "Zəngilan",
  "Zərdab",
];

/** Bakının inzibati rayonları və hər rayonun əsas qəsəbələri. */
export const BAKU_DISTRICTS: { name: string; settlements: string[] }[] = [
  {
    name: "Binəqədi",
    settlements: [
      "8-ci kilometr",
      "9-cu mikrorayon",
      "Biləcəri",
      "Binəqədi qəsəbəsi",
      "M.Ə.Rəsulzadə",
      "Xocəsən",
    ],
  },
  {
    name: "Nərimanov",
    settlements: ["Böyükşor", "Keşlə", "Sovetski"],
  },
  {
    name: "Nəsimi",
    settlements: ["1-ci mikrorayon", "2-ci mikrorayon", "3-cü mikrorayon", "4-cü mikrorayon"],
  },
  {
    name: "Nizami",
    settlements: ["8-ci kilometr", "Keşlə qəsəbəsi"],
  },
  {
    name: "Qaradağ",
    settlements: ["Ələt", "Lökbatan", "Puta", "Qızıldaş", "Qobustan qəsəbəsi", "Sahil", "Səngəçal"],
  },
  {
    name: "Sabunçu",
    settlements: [
      "Bakıxanov",
      "Balaxanı",
      "Bilgəh",
      "Kürdəxanı",
      "Maştağa",
      "Nardaran",
      "Pirşağı",
      "Ramana",
      "Savalan",
      "Zabrat",
    ],
  },
  {
    name: "Səbail",
    settlements: ["Badamdar", "Bayıl", "Bibiheybət", "İçərişəhər", "Şıxov"],
  },
  {
    name: "Suraxanı",
    settlements: ["Bahar", "Bülbülə", "Hövsan", "Qaraçuxur", "Yeni Günəşli", "Zığ"],
  },
  {
    name: "Xəzər",
    settlements: ["Buzovna", "Dübəndi", "Görədil", "Mərdəkan", "Qala", "Şağan", "Şüvəlan", "Türkan", "Zirə"],
  },
  {
    name: "Xətai",
    settlements: ["Ağ şəhər", "Əhmədli", "Günəşli", "Qara şəhər"],
  },
  {
    name: "Yasamal",
    settlements: ["Yasamal qəsəbəsi", "Yeni Yasamal"],
  },
  {
    name: "Pirallahı",
    settlements: ["Gürgən", "Pirallahı qəsəbəsi"],
  },
];

/** Bakı metrosunun stansiyaları — axtarışda ayrıca açar kimi işlənir. */
export const METRO_STATIONS: string[] = [
  "20 Yanvar",
  "28 May",
  "8 Noyabr",
  "Avtovağzal",
  "Azadlıq prospekti",
  "Bakmil",
  "Cəfər Cabbarlı",
  "Dərnəgül",
  "Elmlər Akademiyası",
  "Əhmədli",
  "Gənclik",
  "Həzi Aslanov",
  "İçərişəhər",
  "İnşaatçılar",
  "Koroğlu",
  "Qara Qarayev",
  "Memar Əcəmi",
  "Nariman Nərimanov",
  "Neftçilər",
  "Nəsimi",
  "Nizami",
  "Sahil",
  "Ulduz",
  "Xalqlar Dostluğu",
  "Xocəsən",
  "Şah İsmayıl Xətai",
];
