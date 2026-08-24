import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { buildMetadata, faqSchema, jsonLd } from "@/lib/seo";
import { siteConfig, whatsappLink } from "@/config/site";

/**
 * Tez-tez verilən suallar.
 *
 * Açılan bloklar `<details>` elementi ilə qurulub — JavaScript tələb etmir,
 * klaviatura ilə işləyir və axtarış motoru mətni tam görür.
 */

const FAQ_GROUPS: { title: string; items: { question: string; answer: string }[] }[] = [
  {
    title: "Alqı-satqı",
    items: [
      {
        question: "Əmlakı almaq üçün hansı sənədlər tələb olunur?",
        answer:
          "Alıcıdan şəxsiyyət vəsiqəsi, satıcıdan isə mülkiyyət sənədi (kupça/çıxarış) və ərizə tələb olunur. Əmlak nikah dövründə alınıbsa, ər-arvadın notarial razılığı da lazımdır. Sənədləşmə Əmlak Məsələləri Dövlət Xidmətinin filiallarında aparılır.",
      },
      {
        question: "Kupça ilə müqavilə arasındakı fərq nədir?",
        answer:
          "Kupça (çıxarış) dövlət reyestrindən verilən mülkiyyət sənədidir və tam hüquq verir. Müqavilə isə adətən yeni tikilidə tikinti şirkəti ilə bağlanan sənəddir; mülkiyyət hüququ çıxarış alındıqdan sonra rəsmiləşir. Qiymət fərqi məhz bu səbəbdəndir.",
      },
      {
        question: "Beh nə qədər olur və geri qaytarılırmı?",
        answer:
          "Beh adətən əmlakın dəyərinin 5–10 %-i həcmində olur və beh müqaviləsi ilə rəsmiləşdirilir. Alıcı imtina edərsə beh qalır, satıcı imtina edərsə adətən ikiqat qaytarılır — şərtlər müqavilədə dəqiq yazılmalıdır.",
      },
    ],
  },
  {
    title: "İpoteka və kredit",
    items: [
      {
        question: "İpoteka üçün hansı şərtlər var?",
        answer:
          "İpoteka Fondunun sosial və adi ipoteka məhsulları mövcuddur. Ümumi tələblər: rəsmi gəlir, ilkin ödəniş (adətən 15–20 %), əmlakın çıxarışının olması və bankın qiymətləndirməsindən keçməsi. Yeni tikilidə müqavilə ilə satılan mənzillər çox vaxt ipotekaya uyğun gəlmir.",
      },
      {
        question: "«Hazır ipoteka» nə deməkdir?",
        answer:
          "Satıcı bankla razılaşmanı əvvəlcədən tamamlayıb: əmlak qiymətləndirilib, sənədlər yoxlanılıb və ipoteka üçün təsdiqlənib. Alıcı üçün bu, prosesin bir neçə həftə qısalması deməkdir.",
      },
      {
        question: "Barter mümkündürmü?",
        answer:
          "Bəli. Bazarda mənzilin mənzilə, torpağa və ya avtomobilə dəyişdirilməsi geniş yayılıb. Filtrdə «Barter» seçimini işarələməklə yalnız belə elanları görə bilərsiniz.",
      },
    ],
  },
  {
    title: "Kirayə",
    items: [
      {
        question: "Aylıq və günlük kirayə arasında fərq nədir?",
        answer:
          "Aylıq kirayə uzunmüddətli yaşayış üçündür və adətən bir aylıq depozit tələb olunur. Günlük kirayə qısa səfərlər üçündür, qiymət gündəlik göstərilir və əşyalı təhvil verilir. Saytda hər iki kateqoriya ayrıca filtrlənir.",
      },
      {
        question: "Kirayə müqaviləsi bağlamaq lazımdırmı?",
        answer:
          "Bəli. Yazılı müqavilə həm kirayəçini, həm ev sahibini qoruyur: müddət, ödəniş tarixi, depozit və kommunal xərclərin kimin üzərinə düşdüyü orada göstərilir.",
      },
    ],
  },
  {
    title: "Sayt və xidmətlər",
    items: [
      {
        question: "Elan yerləşdirmək üçün nə etməliyəm?",
        answer:
          "Mülk sahibi və ya agentlik kimi qeydiyyatdan keçin, kabinetdən «Yeni elan» bölməsini açın və məlumatları doldurun. Elanlar dərc edilməzdən əvvəl yoxlanılır; təsdiqlənmiş agentliklərin elanları dərhal saytda görünür.",
      },
      {
        question: "Elanın yoxlanılması nə qədər çəkir?",
        answer:
          "Adətən iş günü ərzində. Şəkillərin keyfiyyəti, ünvanın dəqiqliyi və qiymətin real olması yoxlanılır — bu, saytdakı elanların etibarlılığını qorumaq üçündür.",
      },
      {
        question: "Xidmət haqqı nə qədərdir?",
        answer:
          "Komissiya əməliyyatın növündən asılıdır və hər müştəri ilə əvvəlcədən razılaşdırılır. Dəqiq şərtlər üçün bizimlə əlaqə saxlayın.",
      },
    ],
  },
];

export const metadata: Metadata = buildMetadata({
  title: "Tez-tez verilən suallar",
  description:
    "Alqı-satqı, ipoteka, kirayə və elan yerləşdirmə barədə ən çox soruşulan suallar və cavabları.",
  path: "/suallar",
});

export default function FaqPage() {
  const items = FAQ_GROUPS.flatMap((group) => group.items);
  return (
    <>
      <script {...jsonLd(faqSchema(items, "/suallar"))} />

      <PageHeader
        compact
        eyebrow="Kömək mərkəzi"
        title="Tez-tez verilən suallar"
        description="Daşınmaz əmlak əməliyyatlarında ən çox soruşulan sualların qısa cavabları."
        breadcrumbs={[
          { label: "Ana səhifə", href: "/" },
          { label: "Suallar" },
        ]}
      />

      <Section spacing="cozy">
        <Container size="narrow">
          <div className="flex flex-col gap-10">
            {FAQ_GROUPS.map((group) => (
              <section key={group.title} className="flex flex-col gap-3">
                <h2 className="font-display text-xl text-ink">{group.title}</h2>

                <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-paper">
                  {group.items.map((item) => (
                    <details key={item.question} className="group px-4 sm:px-5">
                      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2 text-left text-sm font-medium text-ink marker:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset">
                        <span className="min-w-0 [overflow-wrap:anywhere]">{item.question}</span>
                        <ChevronDown
                          className="mt-0.5 size-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>
                      <p className="pb-4 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-md border border-line bg-beige/40 p-6 text-center">
            <p className="text-sm text-ink-soft">
              Cavabını tapmadınız? Bizimlə birbaşa əlaqə saxlayın.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/elaqe"
                className="inline-flex min-h-11 items-center rounded-xs bg-gold px-5 text-sm font-medium text-ink transition-colors hover:bg-gold-soft"
              >
                Əlaqə forması
              </Link>
              <a
                href={whatsappLink("Salam, saytdakı suallar bölməsindən yazıram.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
              >
                WhatsApp
              </a>
              <a
                href={siteConfig.phoneHref}
                className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
              >
                {siteConfig.phone}
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
