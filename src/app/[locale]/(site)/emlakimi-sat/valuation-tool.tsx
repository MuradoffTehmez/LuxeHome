"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Calculator, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, type SelectOption } from "@/components/ui/field";
import { trackEvent } from "@/lib/client-analytics";
import { ContactForm } from "../elaqe/contact-form";
import { estimateOwnerProperty, type ValuationResult } from "./actions";

type CityOption = SelectOption & { districts: SelectOption[] };

type ValuationToolProps = {
  types: SelectOption[];
  cities: CityOption[];
};

/** Qiyməti oxunaqlı yazır — Intl-in `az` məlumatı workerd-də olmaya bilər, boşluqla qruplaşdırılır. */
function money(value: number): string {
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₼`;
}

/**
 * «Evimi qiymətləndir» aləti (#105): təxmini aralıq göstərir, sonra dəqiq qiymətləndirmə
 * üçün müraciət formasını parametrlər və nəticə ilə əvvəlcədən doldurur.
 */
export function ValuationTool({ types, cities }: ValuationToolProps) {
  const t = useTranslations("contact.sell.valuation");
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE");
  const [typeSlug, setTypeSlug] = useState(types[0]?.value ?? "");
  const [citySlug, setCitySlug] = useState(cities[0]?.value ?? "");
  const [districtSlug, setDistrictSlug] = useState("");
  const [area, setArea] = useState("");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [pending, startTransition] = useTransition();

  const districts = cities.find((city) => city.value === citySlug)?.districts ?? [];
  const typeLabel = types.find((type) => type.value === typeSlug)?.label ?? "";
  const placeLabel = [
    districts.find((district) => district.value === districtSlug)?.label,
    cities.find((city) => city.value === citySlug)?.label,
  ].filter(Boolean).join(", ");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const next = await estimateOwnerProperty({ listingType, typeSlug, citySlug, districtSlug, area });
      setResult(next);
      trackEvent("valuation_estimate", { status: next.status, listing_type: listingType });
    });
  }

  const estimate = result?.status === "ok" ? result.estimate : null;
  const summary = t("messageTemplate", {
    listing: listingType === "SALE" ? t("sale") : t("rent"),
    type: typeLabel,
    place: placeLabel,
    area,
    estimate: estimate ? `${money(estimate.low)} – ${money(estimate.high)}` : t("noEstimate"),
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={submit} className="flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-paper p-5 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 font-sans text-xl font-semibold text-ink">
          <Calculator className="size-5 text-gold-deep" aria-hidden="true" />
          {t("title")}
        </h2>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink">{t("listingType")}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-sm border border-line bg-beige/60 p-1">
            {(["SALE", "RENT"] as const).map((value) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xs text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
                  listingType === value ? "bg-navy text-ivory" : "text-ink-soft hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value={value}
                  checked={listingType === value}
                  onChange={() => setListingType(value)}
                  className="sr-only"
                />
                {value === "SALE" ? t("sale") : t("rent")}
              </label>
            ))}
          </div>
        </fieldset>

        <Select label={t("propertyType")} options={types} value={typeSlug} onChange={(event) => setTypeSlug(event.target.value)} required />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select
            label={t("city")}
            options={cities}
            value={citySlug}
            onChange={(event) => {
              setCitySlug(event.target.value);
              setDistrictSlug("");
            }}
            required
          />
          <Select
            label={t("district")}
            options={districts}
            placeholder={t("anyDistrict")}
            value={districtSlug}
            onChange={(event) => setDistrictSlug(event.target.value)}
            disabled={districts.length === 0}
          />
        </div>
        <Input
          label={t("area")}
          type="number"
          inputMode="decimal"
          min={10}
          max={100000}
          step="any"
          value={area}
          onChange={(event) => setArea(event.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:self-start">
          {t("submit")}
        </Button>
      </form>

      <div className="flex min-w-0 flex-col gap-6">
        <div aria-live="polite">
          {estimate ? (
            <div className="on-dark rounded-xl bg-navy p-6 sm:p-8">
              <p className="editorial-kicker text-gold-soft">{t("resultKicker")}</p>
              <p className="tabular mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-tight text-ivory">
                {money(estimate.low)} – {money(estimate.high)}
                {listingType === "RENT" ? <span className="ml-1 text-base text-ivory/70">{t("perMonth")}</span> : null}
              </p>
              <p className="mt-3 text-sm text-ivory/75">
                {estimate.scope === "profile"
                  ? t("basisProfile", { perSqm: money(estimate.pricePerSqm) })
                  : t("basis", { count: estimate.sampleSize, perSqm: money(estimate.pricePerSqm) })}
              </p>
              <p className="mt-4 text-xs text-ivory/60">{t("disclaimer")}</p>
            </div>
          ) : result?.status === "insufficient" ? (
            <p className="flex items-start gap-2 rounded-xl border border-line bg-paper p-5 text-sm text-ink-soft">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              {t("insufficient")}
            </p>
          ) : result?.status === "rateLimited" || result?.status === "invalid" ? (
            <p role="alert" className="rounded-xl border border-danger/25 bg-danger-bg p-5 text-sm text-danger">
              {result.status === "rateLimited" ? t("rateLimited") : t("invalid")}
            </p>
          ) : (
            <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-muted">{t("placeholder")}</p>
          )}
        </div>

        {result && result.status !== "invalid" && result.status !== "rateLimited" ? (
          <div className="rounded-xl border border-line bg-paper p-5 shadow-sm sm:p-8">
            <h3 className="font-sans text-lg font-semibold text-ink">{t("preciseTitle")}</h3>
            <p className="mt-1 mb-5 text-sm text-ink-soft">{t("preciseDescription")}</p>
            {/* `key` nəticə dəyişəndə formanı yenidən qurur ki, defolt mətn təzələnsin. */}
            <ContactForm
              key={summary}
              source="OWNER"
              placement="valuation_form"
              defaultSubject={t("subject")}
              defaultMessage={summary}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
