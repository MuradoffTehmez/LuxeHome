import { prisma } from "@/lib/prisma";
import { PAYMENT_OPTIONS } from "@/lib/constants";

/**
 * Ödəniş şərtlərinin tək mənbəyi.
 *
 * **Problem.** Ödəniş imkanı bazada iki yerdə saxlanılırdı: `Feature`
 * taksonomiyasının `PAYMENT` qrupu (filtr paneli və `?xususiyyet=` filtri bunu
 * oxuyur) və `Property.mortgageAvailable` / `installmentAvailable` sütunları
 * (müqayisə cədvəli və `mortgageOnly` sorğu filtri bunu oxuyur). Hər iki forma
 * — admin və kabinet — istifadəçiyə **hər ikisini ayrı-ayrı** təqdim edirdi və
 * heç bir sinxronizasiya yox idi. Nəticədə «İpoteka» xüsusiyyəti seçilmiş elan
 * müqayisə cədvəlində «—» göstərə bilirdi və əksinə.
 *
 * **Həll.** Taksonomiya tək həqiqət mənbəyidir; sütunlar ondan törədilir və
 * geriyə uyğunluq üçün qalır (sxem şərhində də belə yazılıb). Formadakı
 * təkrar checkbox-lar silindi.
 *
 * `hazir-ipoteka` da ipoteka sayılır: alıcı üçün fərq prosedurun sürətindədir,
 * «ipoteka ilə alına bilər» faktı dəyişmir.
 */

const MORTGAGE_SLUGS: string[] = [PAYMENT_OPTIONS.MORTGAGE, PAYMENT_OPTIONS.READY_MORTGAGE];
const INSTALLMENT_SLUGS: string[] = [PAYMENT_OPTIONS.INSTALLMENT];

export type PaymentFlags = {
  mortgageAvailable: boolean;
  installmentAvailable: boolean;
};

/** Seçilmiş xüsusiyyət ID-lərindən ödəniş bayraqlarını törədir. */
export async function paymentFlagsFromFeatures(featureIds: string[]): Promise<PaymentFlags> {
  if (featureIds.length === 0) {
    return { mortgageAvailable: false, installmentAvailable: false };
  }

  const rows = await prisma.feature.findMany({
    where: {
      id: { in: featureIds },
      slug: { in: [...MORTGAGE_SLUGS, ...INSTALLMENT_SLUGS] },
    },
    select: { slug: true },
  });

  const slugs = new Set(rows.map((row) => row.slug));
  return {
    mortgageAvailable: MORTGAGE_SLUGS.some((slug) => slugs.has(slug)),
    installmentAvailable: INSTALLMENT_SLUGS.some((slug) => slugs.has(slug)),
  };
}
