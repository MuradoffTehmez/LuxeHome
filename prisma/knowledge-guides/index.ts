import type { KnowledgeCategorySeed, KnowledgeGuide } from "./types";
import { BUYING_GUIDES } from "./guides-buying";
import { LEGAL_GUIDES } from "./guides-legal";
import { FINANCE_GUIDES } from "./guides-finance";
import { RENT_GUIDES } from "./guides-rent";
import { PROPERTY_TYPE_GUIDES } from "./guides-property-types";
import { MARKET_GUIDES } from "./guides-market";

/**
 * Bilik Mərkəzinin mövzu strukturu.
 *
 * İlk on mövzu hüquqi mənbə sənədindən gəlir (`build-knowledge-hub-sql.ts`) —
 * slug-ları dəyişdirilmir, yalnız izahları genişləndirilir. Sonrakı beşi praktiki
 * bələdçilər üçündür: satış, əmlakın idarəsi, əmlak növləri, bazar və qiymət,
 * təhlükəsizlik.
 */
export const GUIDE_CATEGORIES: KnowledgeCategorySeed[] = [
  {
    slug: "alqi-satqi",
    name: "Alqı-satqı",
    description:
      "Mənzil, ev və digər əmlakın alışı: seçimdən və yoxlamadan müqavilənin imzalanmasına, açarın təhvilinə qədər addım-addım bələdçilər.",
    icon: "Home",
    order: 0,
  },
  {
    slug: "satis",
    name: "Əmlak satışı",
    description:
      "Əmlakını satmaq istəyənlər üçün: sənədlərin hazırlanması, düzgün qiymət, elanın tərtibi, alıcı ilə danışıqlar və təhvil.",
    icon: "Tags",
    order: 5,
  },
  {
    slug: "kiraye",
    name: "Kirayə",
    description:
      "Kirayəçi və ev sahibi üçün: kirayə müqaviləsi, depozit, təhvil-qəbul aktı, kommunal xərclər və mübahisələrin qarşısının alınması.",
    icon: "KeyRound",
    order: 10,
  },
  {
    slug: "emlak-idareetmesi",
    name: "Əmlakın idarə olunması",
    description:
      "Mülkiyyətçinin gündəlik qayğıları: kommunal hesablar, bina idarəetməsi, sığorta, təmir, kirayəyə vermə və vergi öhdəlikləri.",
    icon: "ClipboardCheck",
    order: 15,
  },
  {
    slug: "vereselik",
    name: "Vərəsəlik",
    description:
      "Mirasın qəbulu, vərəsəlik şəhadətnaməsi, paylı mülkiyyət və miras qalmış əmlakın satışı üzrə hüquqi izahlar.",
    icon: "ScrollText",
    order: 20,
  },
  {
    slug: "ipoteka-maliyye",
    name: "İpoteka və maliyyə",
    description:
      "İpoteka krediti, İKZF-nin güzəştli və adi ipotekası, ilkin ödəniş, faiz, aylıq ödənişin hesablanması və kredit riskləri.",
    icon: "Landmark",
    order: 30,
  },
  {
    slug: "qeydiyyat-notariat",
    name: "Qeydiyyat və notariat",
    description:
      "Çıxarışın yoxlanması, əmlakın hüquqi tarixçəsi, notariat qaydasında təsdiq və mülkiyyət hüququnun dövlət qeydiyyatı.",
    icon: "FileCheck2",
    order: 40,
  },
  {
    slug: "vergi-rusum",
    name: "Vergi və rüsumlar",
    description:
      "Alqı-satqıda ödənilən dövlət rüsumu, notariat xərcləri, satıcının vergisi, əmlak vergisi və əməliyyatın ümumi xərc smetası.",
    icon: "ReceiptText",
    order: 50,
  },
  {
    slug: "yeni-tikili",
    name: "Tikinti və yeni tikililər",
    description:
      "Yeni tikilidə mənzil alarkən tikintiçinin, icazələrin, ilkin müqavilənin və təhvil şərtlərinin yoxlanması; köhnə tikili ilə müqayisə.",
    icon: "Building2",
    order: 60,
  },
  {
    slug: "emlak-novleri",
    name: "Əmlak növləri üzrə bələdçilər",
    description:
      "Mənzil, həyət evi, torpaq sahəsi və kommersiya obyekti — hər birinin özünəməxsus yoxlama siyahısı, riskləri və sənədləri.",
    icon: "Blocks",
    order: 65,
  },
  {
    slug: "torpaq",
    name: "Torpaq hüququ",
    description:
      "Torpağın təyinatı, mülkiyyət və icarə formaları, sərhədlər, tikintiyə icazə və torpaq alqı-satqısının xüsusiyyətləri.",
    icon: "Map",
    order: 70,
  },
  {
    slug: "bazar-qiymet",
    name: "Bazar və qiymət",
    description:
      "Əmlakın real bazar qiymətinin müəyyən edilməsi, ilkin və təkrar bazar, ərazinin qiymətləndirilməsi və investisiya gəlirliliyi.",
    icon: "BarChart3",
    order: 75,
  },
  {
    slug: "mehkemeler",
    name: "Məhkəmə təcrübəsi",
    description:
      "Daşınmaz əmlak üzrə tipik mübahisələr: etibarsız əqd, beh, mülkiyyətin tanınması, kirayə və vərəsəlik iddiaları.",
    icon: "Scale",
    order: 80,
  },
  {
    slug: "tehlukesizlik",
    name: "Təhlükəsizlik və saxta elanlar",
    description:
      "Saxta və yanıltıcı elanları, fırıldaqçılıq sxemlərini tanımaq, beh və ödənişlərdə özünüzü qorumaq üçün praktiki qaydalar.",
    icon: "ShieldAlert",
    order: 85,
  },
  {
    slug: "agentlik-brokerlik",
    name: "Agentlik və brokerlik",
    description:
      "Əmlak agentliyi ilə işləyərkən müqavilə, komissiya, eksklüziv razılaşma, etibarnamə və agentin məsuliyyəti.",
    icon: "Handshake",
    order: 90,
  },
];

export const KNOWLEDGE_GUIDES: KnowledgeGuide[] = [
  ...BUYING_GUIDES,
  ...LEGAL_GUIDES,
  ...FINANCE_GUIDES,
  ...RENT_GUIDES,
  ...PROPERTY_TYPE_GUIDES,
  ...MARKET_GUIDES,
];
