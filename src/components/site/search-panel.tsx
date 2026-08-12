"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Option = { value: string; label: string };

type SearchPanelProps = {
  types: Option[];
  cities: Option[];
  className?: string;
};

const ROOM_OPTIONS: Option[] = [
  { value: "1", label: "1 otaq" },
  { value: "2", label: "2 otaq" },
  { value: "3", label: "3 otaq" },
  { value: "4", label: "4 otaq" },
  { value: "5", label: "5+ otaq" },
];

const SELECT_CLASS =
  "min-h-12 w-full cursor-pointer appearance-none rounded-xs border border-line-strong bg-paper " +
  "px-3 text-sm text-ink transition-colors hover:border-ink-muted focus:border-gold focus:outline-none";

const INPUT_CLASS =
  "min-h-12 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink " +
  "placeholder:text-ink-muted transition-colors hover:border-ink-muted focus:border-gold focus:outline-none";

/**
 * Hero altındakı əsas axtarış paneli.
 * Nəticələr `/emlaklar` səhifəsinə query parametrləri ilə yönləndirilir —
 * bu URL paylaşıla və indeksləşdirilə bilər.
 */
export function SearchPanel({ types, cities, className }: SearchPanelProps) {
  const router = useRouter();
  const [listingType, setListingType] = useState("SALE");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    params.set("novu", listingType === "RENT" ? "kiraye" : "satilir");

    const map: Record<string, string> = {
      tip: "tip",
      seher: "seher",
      minQiymet: "min_qiymet",
      maxQiymet: "max_qiymet",
      otaq: "otaq",
    };

    for (const [field, param] of Object.entries(map)) {
      const value = String(form.get(field) ?? "").trim();
      if (value) params.set(param, value);
    }

    router.push(`/emlaklar?${params.toString()}`);
  }

  return (
    <div
      className={cn(
        "rounded-md border border-line bg-paper/97 p-4 shadow-lg backdrop-blur-sm sm:p-5",
        className,
      )}
    >
      {/* Satılır / Kirayə keçidi */}
      <div
        role="radiogroup"
        aria-label="Elan növü"
        className="mb-4 inline-flex rounded-xs border border-line-strong p-1"
      >
        {[
          { value: "SALE", label: "Satılır" },
          { value: "RENT", label: "Kirayə" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={listingType === option.value}
            onClick={() => setListingType(option.value)}
            className={cn(
              "min-h-10 cursor-pointer rounded-xs px-5 text-sm font-medium transition-colors duration-200",
              listingType === option.value
                ? "bg-charcoal text-ink-invert"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-type" className="text-xs font-medium text-ink-soft">
              Əmlak növü
            </label>
            <select id="search-type" name="tip" className={SELECT_CLASS} defaultValue="">
              <option value="">Hamısı</option>
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-city" className="text-xs font-medium text-ink-soft">
              Şəhər / rayon
            </label>
            <select id="search-city" name="seher" className={SELECT_CLASS} defaultValue="">
              <option value="">Hamısı</option>
              {cities.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-min" className="text-xs font-medium text-ink-soft">
              Min. qiymət (₼)
            </label>
            <input
              id="search-min"
              name="minQiymet"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="0"
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-max" className="text-xs font-medium text-ink-soft">
              Maks. qiymət (₼)
            </label>
            <input
              id="search-max"
              name="maxQiymet"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="Limitsiz"
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-rooms" className="text-xs font-medium text-ink-soft">
              Otaq sayı
            </label>
            <select id="search-rooms" name="otaq" className={SELECT_CLASS} defaultValue="">
              <option value="">Fərq etməz</option>
              {ROOM_OPTIONS.map((room) => (
                <option key={room.value} value={room.value}>
                  {room.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" size="md" fullWidth className="min-h-12">
              <Search className="size-4" aria-hidden="true" />
              Axtar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
