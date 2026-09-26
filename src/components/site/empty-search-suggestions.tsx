import { ArrowRight, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";
import type { RelaxationSuggestion } from "@/lib/search-relaxation";

type EmptySearchSuggestionsProps = {
  suggestions: RelaxationSuggestion[];
  labels: {
    title: string;
    description: string;
    suggestionsTitle: string;
    suggestionCount: (count: number) => string;
    assistTitle: string;
    assistDescription: string;
    assistCta: string;
    viewAll: string;
  };
  /** Daxil olmuş istifadəçi üçün «axtarışı saxla» düyməsi (client slot). */
  saveSearch?: React.ReactNode;
};

/**
 * Boş axtarış nəticəsi (#103): «heç nə tapılmadı» əvəzinə ziyarətçini nəticəyə aparan
 * yollar — hansı filtri çıxarsa neçə elan görəcəyi, axtarışı saxlamaq və komandadan
 * fərdi seçim istəmək.
 */
export function EmptySearchSuggestions({ suggestions, labels, saveSearch }: EmptySearchSuggestionsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="rounded-xl border border-line bg-paper p-6 shadow-xs sm:p-8">
        <span className="grid size-12 place-items-center rounded-lg bg-beige text-ink-muted" aria-hidden="true">
          <SearchX className="size-6" />
        </span>
        <h2 className="mt-5 font-sans text-xl font-semibold text-ink">{labels.title}</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">{labels.description}</p>

        {suggestions.length > 0 ? (
          <div className="mt-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <SlidersHorizontal className="size-4 text-gold-deep" aria-hidden="true" />
              {labels.suggestionsTitle}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion.key}>
                  <Link
                    href={suggestion.href}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-sm border border-line bg-ivory px-4 py-2 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
                  >
                    <span className="min-w-0">{suggestion.label}</span>
                    <span className="tabular shrink-0 rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold-deep">
                      {labels.suggestionCount(suggestion.count)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {saveSearch}
          <Link href="/emlaklar" className={buttonClassName("outline", "md")}>
            {labels.viewAll}
          </Link>
        </div>
      </div>

      <div className="on-dark flex flex-col justify-between gap-6 rounded-xl bg-navy p-6 sm:p-8">
        <div>
          <Sparkles className="size-6 text-gold-soft" aria-hidden="true" />
          <h2 className="mt-4 font-sans text-xl font-semibold text-ivory">{labels.assistTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ivory/75">{labels.assistDescription}</p>
        </div>
        <Link href="/mene-emlak-tap" className={buttonClassName("primary", "md")}>
          {labels.assistCta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
