"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONE, LEAD_STATUSES, type LeadStatus } from "@/lib/constants";
import { setLeadStatus } from "./actions";

/**
 * Status tonuna uyğun nöqtə rəngi.
 *
 * `LEAD_STATUS_TONE` sabiti mövcud idi, lakin heç yerdən oxunmurdu: müraciət
 * növbəsi tamamilə rəngsiz idi və operator hansı sətrin təcili olduğunu yalnız
 * mətni oxuyaraq görürdü. Nöqtə seçim menyusunun yanındadır, ona görə
 * klaviatura və ekran oxuyucusu axını dəyişmir — rəng yalnız köməkçi siqnaldır.
 */
const TONE_DOT: Record<(typeof LEAD_STATUS_TONE)[LeadStatus], string> = {
  neutral: "bg-line-strong",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  gold: "bg-gold",
};

export function LeadQuickStatus({ id, status, name }: { id: string; status: LeadStatus; name: string }) {
  const [value, setValue] = useState<LeadStatus>(status);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function change(next: LeadStatus) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const result = await setLeadStatus(id, next);
      if (result.status !== "success") setValue(previous);
      if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <label className="sr-only">
      {name} müraciətinin statusu
      <span className="not-sr-only inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${TONE_DOT[LEAD_STATUS_TONE[value]]}`}
        />
        <select
        value={value}
        onChange={(event) => change(event.target.value as LeadStatus)}
        disabled={pending}
        className="not-sr-only min-h-11 max-w-44 cursor-pointer rounded-xs border border-line-strong bg-paper px-2.5 text-sm text-ink outline-none transition-colors focus:border-gold disabled:cursor-wait disabled:opacity-60"
        aria-label={`${name} müraciətinin statusu`}
      >
        {Object.values(LEAD_STATUSES).map((item) => (
          <option key={item} value={item}>{LEAD_STATUS_LABELS[item]}</option>
        ))}
        </select>
      </span>
    </label>
  );
}
