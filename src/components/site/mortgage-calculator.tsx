"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  calculateAffordability,
  calculateMortgage,
  type AffordabilityResult,
  type MortgageResult,
} from "@/lib/mortgage";
import { formatPrice } from "@/lib/utils";

/**
 * İpoteka və büdcə hesablayıcısı (PRD §141-142).
 *
 * Hesablama tamamilə brauzerdə aparılır: heç bir sorğu getmir, ona görə həm
 * dərhal cavab verir, həm də istifadəçinin gəlir məlumatı serverə düşmür.
 * Məntiq `src/lib/mortgage.ts`-dədir və ayrıca test olunur — komponent yalnız
 * daxiletməni oxuyub nəticəni göstərir.
 */

const CONTROL =
  "min-h-12 w-full rounded-xs border border-line-strong bg-paper px-3 text-base text-ink transition-colors hover:border-ink-muted focus:border-gold focus:outline-none sm:text-sm";

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  step = "1",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  step?: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs font-medium tracking-wide text-ink-soft">
        {label}
        {suffix ? <span className="text-ink-muted"> ({suffix})</span> : null}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 ${CONTROL}`}
      />
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="tabular font-medium text-ink">{value}</dd>
    </div>
  );
}

export function MortgageCalculator({
  defaultPrice,
  currency = "AZN",
  compact = false,
}: {
  defaultPrice?: number;
  currency?: string;
  compact?: boolean;
}) {
  const t = useTranslations("knowledge.calculator");
  const baseId = useId();

  const initialPrice = defaultPrice && defaultPrice > 0 ? Math.round(defaultPrice) : 150000;
  const [price, setPrice] = useState(String(initialPrice));
  const [downPayment, setDownPayment] = useState(String(Math.round(initialPrice * 0.2)));
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("15");

  const result: MortgageResult | null = useMemo(
    () =>
      calculateMortgage({
        price: Number(price),
        downPayment: Number(downPayment),
        annualRatePercent: Number(rate),
        years: Number(years),
      }),
    [price, downPayment, rate, years],
  );

  const [income, setIncome] = useState("2000");
  const [budgetDown, setBudgetDown] = useState("30000");

  const budget: AffordabilityResult | null = useMemo(
    () =>
      calculateAffordability({
        monthlyIncome: Number(income),
        downPayment: Number(budgetDown),
        annualRatePercent: Number(rate),
        years: Number(years),
      }),
    [income, budgetDown, rate, years],
  );

  return (
    <div className={compact ? "" : "grid gap-6 lg:grid-cols-2"}>
      <section
        aria-labelledby={`${baseId}-mortgage`}
        className="min-w-0 rounded-md border border-line bg-paper p-5 sm:p-6"
      >
        <h2 id={`${baseId}-mortgage`} className="font-display text-xl text-ink">
          {compact ? t("onProperty") : t("mortgageTitle")}
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <NumberField
            id={`${baseId}-price`}
            label={t("price")}
            value={price}
            onChange={setPrice}
            suffix={currency}
            step="1000"
          />
          <NumberField
            id={`${baseId}-down`}
            label={t("downPayment")}
            value={downPayment}
            onChange={setDownPayment}
            suffix={currency}
            step="1000"
          />
          <NumberField
            id={`${baseId}-rate`}
            label={t("rate")}
            value={rate}
            onChange={setRate}
            suffix="%"
            step="0.1"
          />
          <NumberField
            id={`${baseId}-years`}
            label={t("years")}
            value={years}
            onChange={setYears}
          />
        </div>

        {result ? (
          <dl className="mt-6 rounded-xs border border-line bg-ivory px-4 py-2">
            <ResultRow
              label={t("monthlyPayment")}
              value={formatPrice(result.monthlyPayment, currency)}
            />
            <ResultRow label={t("loanAmount")} value={formatPrice(result.loanAmount, currency)} />
            <ResultRow
              label={t("totalInterest")}
              value={formatPrice(result.totalInterest, currency)}
            />
            <ResultRow
              label={t("totalPayment")}
              value={formatPrice(result.totalPayment, currency)}
            />
          </dl>
        ) : (
          <p role="status" className="mt-6 text-sm text-warning">
            {t("invalidInput")}
          </p>
        )}

        <p className="mt-4 text-xs text-ink-muted">{t("disclaimer")}</p>
      </section>

      {!compact && (
        <section
          aria-labelledby={`${baseId}-budget`}
          className="min-w-0 rounded-md border border-line bg-paper p-5 sm:p-6"
        >
          <h2 id={`${baseId}-budget`} className="font-display text-xl text-ink">
            {t("affordabilityTitle")}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField
              id={`${baseId}-income`}
              label={t("monthlyIncome")}
              value={income}
              onChange={setIncome}
              suffix={currency}
              step="100"
            />
            <NumberField
              id={`${baseId}-budget-down`}
              label={t("downPayment")}
              value={budgetDown}
              onChange={setBudgetDown}
              suffix={currency}
              step="1000"
            />
          </div>

          <p className="mt-3 text-xs text-ink-muted">{t("budgetHint")}</p>

          {budget ? (
            <dl className="mt-6 rounded-xs border border-line bg-ivory px-4 py-2">
              <ResultRow
                label={t("budgetRange")}
                value={`${formatPrice(budget.minPrice, currency)} – ${formatPrice(budget.maxPrice, currency)}`}
              />
              <ResultRow
                label={t("monthlyPayment")}
                value={formatPrice(budget.maxMonthlyPayment, currency)}
              />
            </dl>
          ) : (
            <p role="status" className="mt-6 text-sm text-warning">
              {t("invalidInput")}
            </p>
          )}

          <p className="mt-4 text-xs text-ink-muted">{t("disclaimer")}</p>
        </section>
      )}
    </div>
  );
}
