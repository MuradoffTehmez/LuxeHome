"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pause, Play, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { useToast } from "@/components/ui/toast";
import { deleteSavedSearch, toggleSavedSearchEnabled } from "./actions";

/** Bir saxlanmış axtarış sətrinin pause/resume + sil düymələri. */
export function SavedSearchActions({
  id,
  name,
  enabled,
}: {
  id: string;
  name: string;
  enabled: boolean;
}) {
  const t = useTranslations("account.savedSearches");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      const result = await toggleSavedSearchEnabled(id);
      if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={enabled ? t("pauseLabel", { name }) : t("resumeLabel", { name })}
        title={enabled ? t("pause") : t("resume")}
        className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink disabled:opacity-50"
      >
        {enabled ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
      </button>
      <ConfirmAction
        action={deleteSavedSearch}
        id={id}
        label={t("deleteLabel", { name })}
        title={t("deleteTitle")}
        description={t("deleteDescription", { name })}
        confirmLabel={t("delete")}
        tone="danger"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </ConfirmAction>
    </div>
  );
}
