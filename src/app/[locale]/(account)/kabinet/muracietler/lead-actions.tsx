"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/admin/action-state";
import { closeLead, markLeadResponded, reassignLead } from "./actions";

/**
 * Müraciət kartının əməliyyatları (#161). «Əlaqə saxladım» ilk cavab vaxtını yazır —
 * «Tez cavab verir» nişanı buradan ölçülür. Agentlik sahibi müraciəti agentə verə bilir.
 */
export function LeadActions({
  id,
  responded,
  closed,
  handlerId,
  assignees,
}: {
  id: string;
  responded: boolean;
  closed: boolean;
  handlerId: string | null;
  /** Yalnız agentlik sahibinə ötürülür. */
  assignees?: { userId: string; name: string }[];
}) {
  const t = useTranslations("account.leads");
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState(handlerId ?? "");

  function run(action: () => Promise<ActionState>) {
    startTransition(async () => {
      const result = await action();
      toast(result.message ?? (result.status === "success" ? t("actions.done") : t("actions.failed")), result.status === "success" ? "success" : "error");
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {!responded && !closed && (
        <Button type="button" size="sm" variant="primary" loading={pending} onClick={() => run(() => markLeadResponded(id))}>
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {t("markResponded")}
        </Button>
      )}
      {!closed && (
        <Button type="button" size="sm" variant="ghost" className="border border-line" disabled={pending} onClick={() => run(() => closeLead(id))}>
          <XCircle className="size-4" aria-hidden="true" />
          {t("close")}
        </Button>
      )}
      {assignees && assignees.length > 1 && !closed && (
        <div className="flex items-end gap-2">
          <Select
            label={t("assignee")}
            options={assignees.map((item) => ({ value: item.userId, label: item.name }))}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="min-w-44"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !target || target === handlerId}
            onClick={() => run(() => reassignLead(id, target))}
          >
            {t("reassign")}
          </Button>
        </div>
      )}
    </div>
  );
}
