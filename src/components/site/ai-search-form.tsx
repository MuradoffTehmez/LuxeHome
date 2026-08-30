"use client";

import { FormEvent, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function AiSearchForm({ initialQuery, labels }: { initialQuery: string; labels: { placeholder: string; submit: string; example: string } }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value.length >= 3) router.push(`/ai-axtaris?q=${encodeURIComponent(value)}`);
  }
  return <form onSubmit={submit} className="rounded-md border border-line bg-paper p-4 shadow-sm sm:p-6">
    <label className="sr-only" htmlFor="ai-property-query">{labels.placeholder}</label>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Sparkles className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gold-deep" aria-hidden="true" /><input id="ai-property-query" value={query} onChange={(event) => setQuery(event.target.value)} minLength={3} maxLength={500} required placeholder={labels.placeholder} className="min-h-14 w-full rounded-xs border border-line-strong bg-ivory pr-4 pl-12 text-ink outline-none focus:border-gold" /></div>
      <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xs bg-gold px-6 font-medium text-ink hover:bg-gold-soft"><Search className="size-4" aria-hidden="true" />{labels.submit}</button>
    </div>
    <button type="button" onClick={() => setQuery(labels.example)} className="mt-3 text-left text-xs text-ink-muted underline-offset-4 hover:underline">{labels.example}</button>
  </form>;
}
