"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateYield } from "@/lib/investment-math";

const CONTROL =
  "mt-1.5 min-h-12 w-full rounded-xs border border-line-strong bg-paper px-3 text-base text-ink transition-colors hover:border-ink-muted focus:border-gold focus:outline-none sm:text-sm";

function money(value: number): string {
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₼`;
}

/** İcarə gəlirliyi kalkulyatoru (#107) — hesablama brauzerdədir (`calculateYield`). */
export function YieldCalculator() {
  const t = useTranslations("phase3.investor.calculator");
  const baseId = useId();
  const [price, setPrice] = useState("150000");
  const [rent, setRent] = useState("900");
  const [expenses, setExpenses] = useState("10");
  const [vacancy, setVacancy] = useState("1");
  const result = useMemo(
    () => calculateYield({ price: Number(price), monthlyRent: Number(rent), expensesPercent: Number(expenses), vacancyMonths: Number(vacancy) }),
    [price, rent, expenses, vacancy],
  );
  const fields = [
    { id: "price", label: t("price"), value: price, set: setPrice, suffix: "₼", step: "1000" },
    { id: "rent", label: t("rent"), value: rent, set: setRent, suffix: "₼", step: "50" },
    { id: "expenses", label: t("expenses"), value: expenses, set: setExpenses, suffix: "%", step: "1" },
    { id: "vacancy", label: t("vacancy"), value: vacancy, set: setVacancy, suffix: t("monthsUnit"), step: "1" },
  ];

  return (
    <section aria-labelledby={`${baseId}-title`} className="min-w-0 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-7">
      <h2 id={`${baseId}-title`} className="font-sans text-xl font-semibold text-ink">{t("title")}</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className="min-w-0">
            <label htmlFor={`${baseId}-${field.id}`} className="block text-xs font-medium tracking-wide text-ink-soft">
              {field.label} <span className="text-ink-muted">({field.suffix})</span>
            </label>
            <input
              id={`${baseId}-${field.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              step={field.step}
              value={field.value}
              onChange={(event) => field.set(event.target.value)}
              className={CONTROL}
            />
          </div>
        ))}
      </div>
      {result ? (
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [t("gross"), `${result.grossYield}%`],
            [t("net"), `${result.netYield}%`],
            [t("netIncome"), money(result.netAnnualIncome)],
            [t("payback"), result.paybackYears === null ? "—" : t("years", { count: result.paybackYears })],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-line bg-ivory p-3">
              <dt className="text-xs text-ink-muted">{label}</dt>
              <dd className="tabular mt-1 text-lg font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p role="status" className="mt-6 text-sm text-warning">{t("invalid")}</p>
      )}
      <p className="mt-4 text-xs text-ink-muted">{t("disclaimer")}</p>
    </section>
  );
}
