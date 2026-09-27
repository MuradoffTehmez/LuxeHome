"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, MessageCircle, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { PROJECT_UNIT_STATUSES } from "@/lib/constants";
import { groupUnitsForGrid, unitSummary, type UnitView } from "@/lib/project-units";

const CELL: Record<UnitView["status"], string> = {
  AVAILABLE: "border-success/40 bg-success-bg text-success hover:border-success",
  RESERVED: "border-warning/40 bg-warning-bg text-warning hover:border-warning",
  SOLD: "border-line bg-beige text-ink-muted line-through decoration-ink-muted/50",
};

/**
 * Yeni tikilinin mənzil şahmatı (#107): blok → mərtəbə → mənzil. Rəng mənzilin
 * vəziyyətini göstərir, amma yeganə siqnal deyil — hər xananın ekran oxuyucu etiketində
 * status yazılır. Satılmış mənzil də seçilə bilir (plan və sahə maraqlı ola bilər).
 */
export function ProjectUnitGrid({ units, whatsapp, projectName }: { units: UnitView[]; whatsapp: string; projectName: string }) {
  const t = useTranslations("phase3.units");
  const grid = useMemo(() => groupUnitsForGrid(units), [units]);
  const summary = useMemo(() => unitSummary(units), [units]);
  const [blockIndex, setBlockIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const block = grid[Math.min(blockIndex, grid.length - 1)];
  const selected = units.find((unit) => unit.id === selectedId) ?? null;
  if (!block) return null;

  const statusLabel = (status: UnitView["status"]) => t(`status.${status}`);
  const whatsappHref = selected
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(t("whatsappMessage", { project: projectName, block: selected.block, number: selected.number }))}`
    : null;

  return (
    <section aria-labelledby="unit-grid-title" className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="unit-grid-title" className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
            <Building2 className="size-5 text-gold-deep" aria-hidden="true" />
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t("summary", { available: summary.available, total: summary.total })}</p>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs text-ink-soft" aria-label={t("legend")}>
          {Object.values(PROJECT_UNIT_STATUSES).map((status) => (
            <li key={status} className="inline-flex items-center gap-1.5">
              <span className={cn("size-3 rounded-xs border", CELL[status])} aria-hidden="true" />
              {statusLabel(status)}
            </li>
          ))}
        </ul>
      </div>

      {grid.length > 1 ? (
        <div role="tablist" aria-label={t("blocks")} className="flex flex-wrap gap-2">
          {grid.map((item, index) => (
            <button
              key={item.block}
              type="button"
              role="tab"
              aria-selected={index === blockIndex}
              onClick={() => { setBlockIndex(index); setSelectedId(null); }}
              className={cn(
                "min-h-11 rounded-sm border px-4 text-sm font-semibold transition-colors",
                index === blockIndex ? "border-navy bg-navy text-ivory" : "border-line text-ink hover:border-gold",
              )}
            >
              {t("block", { block: item.block })}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative overflow-x-auto">
        <table className="border-separate border-spacing-1.5 text-sm">
          <caption className="sr-only">{t("caption", { block: block.block })}</caption>
          <tbody>
            {block.floors.map((floor) => (
              <tr key={floor.floor}>
                <th scope="row" className="tabular w-10 pr-1 text-right text-xs font-medium text-ink-muted">{floor.floor}</th>
                {floor.units.map((unit) => (
                  <td key={unit.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(unit.id)}
                      aria-pressed={selectedId === unit.id}
                      aria-label={t("cellLabel", { number: unit.number, status: statusLabel(unit.status), rooms: unit.rooms ?? "—" })}
                      className={cn(
                        "tabular grid h-11 min-w-14 place-items-center rounded-xs border px-2 text-xs font-semibold transition-colors",
                        CELL[unit.status],
                        selectedId === unit.id && "ring-2 ring-gold ring-offset-1 ring-offset-paper",
                      )}
                    >
                      {unit.number}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="relative rounded-lg border border-line bg-ivory p-4 sm:p-5" aria-live="polite">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label={t("close")}
            className="absolute top-2 right-2 grid size-11 place-items-center rounded-xs text-ink-muted hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <p className="text-base font-semibold text-ink">{t("unitTitle", { block: selected.block, number: selected.number })}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-ink-muted">{t("floor")}</dt><dd className="tabular font-medium text-ink">{selected.floor}</dd></div>
            <div><dt className="text-xs text-ink-muted">{t("rooms")}</dt><dd className="tabular font-medium text-ink">{selected.rooms ?? "—"}</dd></div>
            <div><dt className="text-xs text-ink-muted">{t("area")}</dt><dd className="tabular font-medium text-ink">{selected.area ? `${selected.area} m²` : "—"}</dd></div>
            <div>
              <dt className="text-xs text-ink-muted">{t("price")}</dt>
              <dd className="tabular font-medium text-ink">
                {selected.status === PROJECT_UNIT_STATUSES.SOLD ? statusLabel(selected.status) : selected.price ? formatPrice(selected.price, selected.currency) : t("priceOnRequest")}
              </dd>
            </div>
          </dl>
          {selected.status !== PROJECT_UNIT_STATUSES.SOLD && whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm bg-navy px-4 text-sm font-semibold text-ivory hover:bg-navy/90"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("enquire")}
            </a>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">{t("hint")}</p>
      )}
    </section>
  );
}
