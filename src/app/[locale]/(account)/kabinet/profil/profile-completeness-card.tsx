import { getTranslations } from "next-intl/server";
import { ArrowRight, CircleCheck, CircleDashed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Completeness } from "@/lib/accounts/profile-completeness";
import { cn } from "@/lib/utils";

/**
 * «Profiliniz 60% doludur» kartı (#157) — kabinet ana səhifəsində və profil səhifəsində.
 * Ən çox fayda verən ilk üç çatışmayan bənd göstərilir; 100%-də kart təbrikə çevrilir.
 * `compact` — kabinet ana səhifəsi üçün qısa variant (profilə keçidlə).
 */
export async function ProfileCompletenessCard({
  completeness,
  kind,
  compact = false,
}: {
  completeness: Completeness;
  kind: "agency" | "agent";
  compact?: boolean;
}) {
  const t = await getTranslations("account.completeness");
  const { percent, missing } = completeness;
  const done = missing.length === 0;
  const shown = missing.slice(0, compact ? 3 : 5);
  const tone = percent >= 80 ? "bg-success" : percent >= 50 ? "bg-gold" : "bg-warning";
  const ctaClass = "mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-gold-deep underline-offset-4 hover:underline";

  return (
    <section
      aria-labelledby="profile-completeness-title"
      className={cn("rounded-xl border bg-paper p-4 shadow-xs sm:p-6", done ? "border-success/30" : "border-gold/40")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="profile-completeness-title" className="font-sans text-base font-semibold text-ink">
          {done ? t("doneTitle") : t("title", { percent })}
        </h2>
        <span className="tabular text-sm font-semibold text-ink">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={t("progressLabel")}
        className="mt-3 h-2 overflow-hidden rounded-full bg-beige"
      >
        <div className={cn("h-full rounded-full transition-[width]", tone)} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
        {done && <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />}
        {done ? t(kind === "agency" ? "doneAgency" : "doneAgent") : t(kind === "agency" ? "hintAgency" : "hintAgent")}
      </p>

      {!done && (
        <ul className="mt-4 flex flex-col gap-2">
          {shown.map((item) => (
            <li key={item.key} className="flex items-center gap-2.5 text-sm text-ink">
              <CircleDashed className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
              <span className="min-w-0 flex-1">{t(`items.${item.key}` as "items.logo")}</span>
              <span className="tabular text-xs text-ink-muted">+{item.weight}%</span>
            </li>
          ))}
          {missing.length > shown.length && (
            <li className="pl-6.5 text-xs text-ink-muted">{t("more", { count: missing.length - shown.length })}</li>
          )}
        </ul>
      )}

      {!done && (compact ? (
        <Link href="/kabinet/profil#profil-formu" className={ctaClass}>
          {t("cta")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        // Eyni səhifədəki forma — locale-li `Link` lazım deyil.
        <a href="#profil-formu" className={ctaClass}>
          {t("cta")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      ))}
    </section>
  );
}
