"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from "@/lib/constants";
import { setLeadStatus } from "./actions";

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
    </label>
  );
}
