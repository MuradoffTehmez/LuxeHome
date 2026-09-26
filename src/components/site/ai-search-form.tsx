import { Search, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";

export function AiSearchForm({ initialQuery, labels, locale }: { initialQuery: string; labels: { placeholder: string; submit: string; example: string }; locale: Locale }) {
  return <form action={localizePath("/ai-axtaris", locale)} method="get" className="rounded-xl border border-line bg-paper p-4 shadow-sm sm:p-6">
    <label className="sr-only" htmlFor="ai-property-query">{labels.placeholder}</label>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Sparkles className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gold-deep" aria-hidden="true" /><input id="ai-property-query" name="q" defaultValue={initialQuery} minLength={3} maxLength={500} required placeholder={labels.placeholder} className="min-h-14 w-full rounded-xs border border-line-strong bg-ivory pr-4 pl-12 text-ink outline-none focus:border-gold" /></div>
      <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xs bg-gold px-6 font-medium text-on-gold hover:bg-gold-soft"><Search className="size-4" aria-hidden="true" />{labels.submit}</button>
    </div>
    <Link href={`/ai-axtaris?q=${encodeURIComponent(labels.example)}`} locale={locale} className="mt-3 inline-block text-left text-xs text-ink-muted underline-offset-4 hover:underline">{labels.example}</Link>
  </form>;
}
