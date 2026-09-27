"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, HelpCircle, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { askAdvisor, type AdvisorResponse } from "@/app/[locale]/(site)/bilik-merkezi/advisor-actions";

const QUESTION_MAX = 300;

/**
 * Bilik Mərkəzi AI məsləhətçisi (#109). Cavab yalnız dərc olunmuş məqalələrdən qurulur
 * və hər iddia `[n]` ilə mənbəyə bağlanır; mənbələr cavabın altında siyahılanır.
 */
export function KnowledgeAdvisor({ examples }: { examples: string[] }) {
  const t = useTranslations("knowledge.advisor");
  const [question, setQuestion] = useState("");
  const [website, setWebsite] = useState("");
  const [result, setResult] = useState<AdvisorResponse | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 5) return;
    startTransition(async () => {
      setResult(await askAdvisor({ question: trimmed, website }));
    });
  }

  const sources = result && "sources" in result ? result.sources : [];

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-line bg-paper p-5 shadow-xs sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-gold-deep uppercase">
          <Sparkles className="size-4" aria-hidden="true" />
          {t("eyebrow")}
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">{t("title")}</h2>
        <p className="mt-2 text-sm text-ink-soft">{t("description")}</p>

        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(question);
          }}
        >
          <label htmlFor="advisor-question" className="sr-only">{t("label")}</label>
          <textarea
            id="advisor-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value.slice(0, QUESTION_MAX))}
            rows={3}
            maxLength={QUESTION_MAX}
            placeholder={t("placeholder")}
            className="w-full resize-y rounded-sm border border-line-strong bg-paper px-3 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-gold focus:outline-none sm:text-sm"
          />
          {/* Honeypot — ekran oxuyucusundan və klaviaturadan gizlidir. */}
          <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="tabular text-xs text-ink-muted">{question.length}/{QUESTION_MAX}</span>
            <Button type="submit" loading={pending} disabled={question.trim().length < 5}>
              {pending ? t("thinking") : t("ask")}
            </Button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuestion(example);
                submit(example);
              }}
              className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-3 text-left text-xs text-ink-soft transition-colors hover:border-gold hover:text-ink"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-line bg-ivory p-5" aria-live="polite" aria-busy={pending}>
        {!result && !pending ? (
          <div className="flex h-full flex-col items-start justify-center gap-2 text-sm text-ink-muted">
            <HelpCircle className="size-5 text-gold-deep" aria-hidden="true" />
            <p>{t("empty")}</p>
          </div>
        ) : null}
        {pending ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            <span className="h-3 w-3/4 animate-pulse rounded-full bg-beige" />
            <span className="h-3 w-full animate-pulse rounded-full bg-beige" />
            <span className="h-3 w-2/3 animate-pulse rounded-full bg-beige" />
          </div>
        ) : null}

        {!pending && result ? (
          <div className="flex flex-col gap-4">
            {result.status === "answered" ? (
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink [overflow-wrap:anywhere]">{result.answer}</p>
            ) : (
              <p className="text-sm text-ink-soft">
                {result.status === "rateLimited" ? t("rateLimited")
                  : result.status === "invalid" ? t("invalid")
                  : result.status === "unavailable" ? t("unavailable")
                  : sources.length ? t("noAnswer") : t("noSources")}
              </p>
            )}

            {sources.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {result.status === "answered" ? t("sources") : t("related")}
                </h3>
                <ol className="mt-2 flex flex-col gap-1.5">
                  {sources.map((source) => (
                    <li key={`${source.kind}-${source.n}`}>
                      <Link href={source.href} className="group flex min-h-11 items-start gap-2 rounded-sm px-1 py-1.5 text-sm text-ink hover:text-gold-deep">
                        <span className="tabular mt-0.5 shrink-0 font-semibold text-gold-deep">[{source.n}]</span>
                        <BookOpen className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                        <span className="min-w-0 [overflow-wrap:anywhere] group-hover:underline">{source.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <p className="border-t border-line pt-3 text-xs text-ink-muted">{t("disclaimer")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
