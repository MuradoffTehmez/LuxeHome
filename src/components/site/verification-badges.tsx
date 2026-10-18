import { getTranslations } from "next-intl/server";
import { BadgeCheck, FileCheck2, Mail, ShieldCheck, Smartphone } from "lucide-react";
import type { VerificationBadge } from "@/lib/constants";

const ICONS = { PHONE: Smartphone, EMAIL: Mail, AGENCY: ShieldCheck, DOCUMENTS: FileCheck2, DATA: BadgeCheck } as const;

/**
 * Doğrulama nişanları (#256, PRD 19.3): hər nişan ayrı yoxlama səviyyəsidir və altında mənası yazılır —
 * «Telefon təsdiqlənib» əmlakın hüquqi vəziyyətini təsdiqləmir. Sənədin özü və ya növü göstərilmir.
 */
export async function VerificationBadges({ badges }: { badges: VerificationBadge[] }) {
  if (badges.length === 0) return null;
  const t = await getTranslations("property.verification");
  return (
    <section aria-labelledby="verification-title" className="mb-6 rounded-xl border border-line bg-paper p-4">
      <h2 id="verification-title" className="font-sans text-sm font-semibold text-ink">{t("title")}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {badges.map((badge) => {
          const Icon = ICONS[badge];
          return (
            <li key={badge} className="flex gap-2.5">
              <Icon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{t(`badges.${badge}.label`)}</span>
                <span className="block text-xs text-ink-muted">{t(`badges.${badge}.hint`)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">{t("disclaimer")}</p>
    </section>
  );
}
