"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlarmClock, Clock3, Phone, UserPlus } from "lucide-react";
import { cn, formatPhone } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useServerMessage } from "@/components/admin/use-server-message";
import { LEAD_STATUSES, type LeadSource, type LeadStatus } from "@/lib/constants";
import type { LeadSla } from "@/lib/admin/lead-board";
import { assignLeadToMe, setLeadStatus } from "../actions";

export type BoardCard = {
  id: string;
  name: string;
  phone: string;
  subject: string | null;
  source: string;
  status: LeadStatus;
  ageLabel: string;
  assigneeName: string | null;
  propertyTitle: string | null;
  sla: LeadSla;
};

export type BoardColumnView = { status: LeadStatus; total: number; cards: BoardCard[] };

const COLUMN_ACCENT: Record<LeadStatus, string> = {
  NEW: "border-t-gold",
  CONTACTED: "border-t-warning",
  IN_PROGRESS: "border-t-info",
  COMPLETED: "border-t-success",
  CLOSED: "border-t-line-strong",
};

/**
 * Müraciətlər lövhəsi (#105). Desktopda kart sütunlar arasında sürüşdürülür; hər kartda
 * status menyusu da var — toxunma ekranı və klaviatura hover/drag olmadan işləyir.
 * Dəyişiklik optimistikdir, server rədd edərsə kart geri qayıdır.
 */
export function LeadBoard({ columns }: { columns: BoardColumnView[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { toast } = useToast();
  const translate = useServerMessage();
  const [board, setBoard] = useState(columns);
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<LeadStatus | null>(null);
  const [, startTransition] = useTransition();

  function move(id: string, next: LeadStatus) {
    const previous = board;
    const card = board.flatMap((column) => column.cards).find((item) => item.id === id);
    if (!card || card.status === next) return;
    setBoard((current) =>
      current.map((column) => ({
        ...column,
        total: column.status === card.status ? column.total - 1 : column.status === next ? column.total + 1 : column.total,
        cards: column.status === next
          ? [{ ...card, status: next, sla: null }, ...column.cards]
          : column.cards.filter((item) => item.id !== id),
      })),
    );
    startTransition(async () => {
      const result = await setLeadStatus(id, next);
      if (result.status !== "success") {
        setBoard(previous);
        toast(translate(result.message) ?? result.message ?? "", "error");
        return;
      }
      router.refresh();
    });
  }

  function assign(id: string) {
    startTransition(async () => {
      const result = await assignLeadToMe(id);
      toast(translate(result.message) ?? result.message ?? "", result.status === "success" ? "success" : "error");
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <div className="relative -mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      <ol className="grid min-w-max auto-cols-[minmax(17rem,1fr)] grid-flow-col gap-4 lg:min-w-0 lg:grid-flow-row lg:grid-cols-5">
        {board.map((column) => (
          <li
            key={column.status}
            aria-label={t(`labels.leadStatus.${column.status}`)}
            onDragOver={(event) => {
              event.preventDefault();
              setTarget(column.status);
            }}
            onDragLeave={() => setTarget((current) => (current === column.status ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain");
              setTarget(null);
              setDragging(null);
              if (id) move(id, column.status);
            }}
            className={cn(
              "flex min-h-[20rem] min-w-0 flex-col rounded-xl border border-t-4 border-line bg-ivory transition-colors",
              COLUMN_ACCENT[column.status],
              target === column.status && dragging && "bg-gold/8 ring-2 ring-gold/40",
            )}
          >
            <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
              <h2 className="text-sm font-semibold text-ink">{t(`labels.leadStatus.${column.status}`)}</h2>
              <span className="tabular rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-ink-soft">{column.total}</span>
            </header>
            <ul className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3">
              {column.cards.length === 0 ? (
                <li className="rounded-md border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">
                  {t("pages.leadBoard.emptyColumn")}
                </li>
              ) : null}
              {column.cards.map((card) => (
                <li
                  key={card.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", card.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDragging(card.id);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setTarget(null);
                  }}
                  className={cn(
                    "flex cursor-grab flex-col gap-2 rounded-md border border-line bg-paper p-3 shadow-xs active:cursor-grabbing",
                    dragging === card.id && "opacity-50",
                    card.sla === "overdue" && "border-danger/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/muracietler/${card.id}`} className="relative min-w-0 text-sm font-semibold text-ink [overflow-wrap:anywhere] after:absolute after:-inset-y-3 after:inset-x-0 hover:text-gold-deep">
                      {card.name}
                    </Link>
                    <span className="shrink-0 rounded-full bg-beige px-2 py-0.5 text-[0.6875rem] text-ink-soft">
                      {t(`labels.leadSource.${card.source as LeadSource}`)}
                    </span>
                  </div>
                  {card.subject || card.propertyTitle ? (
                    <p className="line-clamp-2 text-xs text-ink-soft">{card.propertyTitle ?? card.subject}</p>
                  ) : null}
                  <a href={`tel:${card.phone.replace(/[^+\d]/g, "")}`} className="inline-flex min-h-11 w-fit items-center gap-1.5 text-xs sm:min-h-8 font-medium text-ink hover:text-gold-deep">
                    <Phone className="size-3.5" aria-hidden="true" />
                    <span className="tabular">{formatPhone(card.phone)}</span>
                  </a>
                  {card.sla ? (
                    <p className={cn(
                      "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                      card.sla === "overdue" ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning",
                    )}>
                      <AlarmClock className="size-3" aria-hidden="true" />
                      {card.sla === "overdue" ? t("pages.leadBoard.overdue") : t("pages.leadBoard.stale")}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-[0.6875rem] text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {card.ageLabel}
                    </span>
                    {card.assigneeName ? (
                      <span className="truncate">{card.assigneeName}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => assign(card.id)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-xs px-1.5 sm:min-h-8 font-semibold text-gold-deep hover:bg-gold/10"
                      >
                        <UserPlus className="size-3.5" aria-hidden="true" />
                        {t("pages.leadBoard.assignToMe")}
                      </button>
                    )}
                  </div>
                  <label className="sr-only" htmlFor={`status-${card.id}`}>{t("pages.leads.statusLabel", { name: card.name })}</label>
                  <select
                    id={`status-${card.id}`}
                    value={card.status}
                    onChange={(event) => move(card.id, event.target.value as LeadStatus)}
                    className="min-h-11 w-full cursor-pointer rounded-xs sm:min-h-9 border border-line bg-ivory px-2 text-xs text-ink-soft outline-none focus:border-gold"
                  >
                    {Object.values(LEAD_STATUSES).map((status) => (
                      <option key={status} value={status}>{t(`labels.leadStatus.${status}`)}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
