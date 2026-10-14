import { getTranslations } from "next-intl/server";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Bilik Mərkəzinin «Saxta və yanıltıcı elanları tanımaq» bələdçisi. */
export const SCAM_GUIDE_PATH = "/bilik-merkezi/saxta-ve-yaniltici-elanlari-tanimaq";

/**
 * Fırıldaqdan qorunma (#159, C8): əlaqə panelində ən çox rast gəlinən sxemə qarşı üç qısa
 * qayda — əmlakı görmədən beh/avans, sənədsiz ödəniş, platformadan kənara çəkmə —
 * və Bilik Mərkəzinin ətraflı bələdçisinə keçid. `footer` — məsələn «Şikayət et» düyməsi.
 */
export async function SafetyTips({ className, footer }: { className?: string; footer?: React.ReactNode }) {
  const t = await getTranslations("property");
  const tips = [t("safety.tipDeposit"), t("safety.tipDocuments"), t("safety.tipPlatform")];

  return (
    <aside aria-labelledby="safety-tips-title" className={cn("rounded-md border border-warning/30 bg-warning-bg p-4", className)}>
      <h3 id="safety-tips-title" className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
        <ShieldAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
        {t("safety.title")}
      </h3>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs leading-5 text-ink-soft">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link
          href={SCAM_GUIDE_PATH}
          className="relative inline-flex items-center gap-1 text-sm font-medium text-gold-deep underline-offset-4 after:absolute after:inset-x-0 after:-inset-y-3 hover:underline"
        >
          {t("safety.guideLink")}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
        {footer}
      </div>
    </aside>
  );
}
