"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { useServerMessage } from "@/components/admin/use-server-message";
import type { ActionState } from "@/lib/admin/action-state";

/**
 * Şikayət qrupunu moderatora təyin edir (#195). Seçim dəyişən kimi action çağırılır —
 * ayrıca «Saxla» düyməsi yoxdur; nəticə toast ilə gəlir, siyahı yenilənir.
 */
export function AssignReportsSelect({
  propertyId,
  assigneeId,
  moderators,
  action,
}: {
  propertyId: string;
  assigneeId: string | null;
  moderators: { id: string; name: string }[];
  action: (propertyId: string, assigneeId: string) => Promise<ActionState>;
}) {
  const t = useTranslations("admin");
  const id = useId();
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const translate = useServerMessage();
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs text-ink-muted">{t("pages.reports.assignee")}</label>
      <select
        id={id}
        value={assigneeId ?? ""}
        disabled={pending}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (!next) return;
          startTransition(async () => {
            const result = await action(propertyId, next);
            if (result.message) toast(translate(result.message) ?? result.message, result.status === "success" ? "success" : "error");
            if (result.status === "success") router.refresh();
          });
        }}
        className="min-h-11 rounded-sm border border-line bg-paper px-3 text-sm text-ink sm:min-h-9"
      >
        <option value="" disabled>{t("pages.reports.unassigned")}</option>
        {moderators.map((moderator) => (
          <option key={moderator.id} value={moderator.id}>{moderator.name}</option>
        ))}
      </select>
    </div>
  );
}
