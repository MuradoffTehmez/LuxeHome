"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateInstallment } from "@/lib/mortgage";
import { formatPrice } from "@/lib/utils";

const CONTROL =
  "mt-1.5 min-h-12 w-full rounded-xs border border-line-strong bg-paper px-3 text-base text-ink transition-colors hover:border-ink-muted focus:border-gold focus:outline-none sm:text-sm";
const MONTH_OPTIONS = [6, 12, 18, 24, 36, 48, 60] as const;

/**
 * Tikintiçi daxili krediti (hissə-hissə ödəniş) kalkulyatoru (#107).
 *
 * Bakıda yeni tikili satışında bank ipotekasından çox işlənir: ilkin ödəniş + bərabər
 * aylıq hissələr, çox vaxt faizsiz. Hesablama brauzerdədir (`calculateInstallment`).
 */
export function InstallmentCalculator({
  defaultPrice,
  currency = "AZN",
  headingLevel = "h2",
}: {
  defaultPrice?: number;
  currency?: string;
  headingLevel?: "h2" | "h3";
}) {
  const t = useTranslations("knowledge.calculator.installment");
  const baseId = useId();
  const initialPrice = defaultPrice && defaultPrice > 0 ? Math.round(defaultPrice) : 120000;
  const [price, setPrice] = useState(String(initialPrice));
  const [downPercent, setDownPercent] = useState(30);
  const [months, setMonths] = useState<number>(24);
  const [markup, setMarkup] = useState("0");

  const result = useMemo(
    () => calculateInstallment({ price: Number(price), downPaymentPercent: downPercent, months, markupPercent: Number(markup) }),
    [price, downPercent, months, markup],
  );
  const Heading = headingLevel;

  return (
    <section aria-labelledby={`${baseId}-title`} className="min-w-0 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
      <Heading id={`${baseId}-title`} className="font-sans text-lg font-semibold text-ink">{t("title")}</Heading>
      <p className="mt-1 text-sm text-ink-soft">{t("description")}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`${baseId}-price`} className="block text-xs font-medium tracking-wide text-ink-soft">
            {t("price")} <span className="text-ink-muted">({currency})</span>
          </label>
          <input id={`${baseId}-price`} type="number" inputMode="decimal" min="0" step="1000" value={price} onChange={(event) => setPrice(event.target.value)} className={CONTROL} />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${baseId}-months`} className="block text-xs font-medium tracking-wide text-ink-soft">{t("months")}</label>
          <select id={`${baseId}-months`} value={months} onChange={(event) => setMonths(Number(event.target.value))} className={`${CONTROL} cursor-pointer`}>
            {MONTH_OPTIONS.map((value) => <option key={value} value={value}>{t("monthsOption", { count: value })}</option>)}
          </select>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor={`${baseId}-down`} className="flex items-baseline justify-between text-xs font-medium tracking-wide text-ink-soft">
            {t("downPayment")}
            <span className="tabular text-sm font-semibold text-ink">{downPercent}%</span>
          </label>
          <input
            id={`${baseId}-down`}
            type="range"
            min={0}
            max={90}
            step={5}
            value={downPercent}
            onChange={(event) => setDownPercent(Number(event.target.value))}
            className="mt-3 h-11 w-full cursor-pointer accent-[var(--color-gold)]"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${baseId}-markup`} className="block text-xs font-medium tracking-wide text-ink-soft">
            {t("markup")} <span className="text-ink-muted">(%)</span>
          </label>
          <input id={`${baseId}-markup`} type="number" inputMode="decimal" min="0" max="100" step="0.5" value={markup} onChange={(event) => setMarkup(event.target.value)} className={CONTROL} />
        </div>
      </div>

      {result ? (
        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-navy p-4 text-ivory on-dark sm:col-span-3">
            <dt className="text-xs text-ivory/70">{t("monthly")}</dt>
            <dd className="tabular mt-1 text-2xl font-semibold">{formatPrice(result.monthlyPayment, currency)}</dd>
          </div>
          <div className="rounded-md border border-line bg-ivory p-3">
            <dt className="text-xs text-ink-muted">{t("downPaymentAmount")}</dt>
            <dd className="tabular mt-1 font-medium text-ink">{formatPrice(result.downPayment, currency)}</dd>
          </div>
          <div className="rounded-md border border-line bg-ivory p-3">
            <dt className="text-xs text-ink-muted">{t("markupAmount")}</dt>
            <dd className="tabular mt-1 font-medium text-ink">{formatPrice(result.markup, currency)}</dd>
          </div>
          <div className="rounded-md border border-line bg-ivory p-3">
            <dt className="text-xs text-ink-muted">{t("total")}</dt>
            <dd className="tabular mt-1 font-medium text-ink">{formatPrice(result.totalPayment, currency)}</dd>
          </div>
        </dl>
      ) : (
        <p role="status" className="mt-6 text-sm text-warning">{t("invalid")}</p>
      )}
      <p className="mt-4 text-xs text-ink-muted">{t("disclaimer")}</p>
    </section>
  );
}
