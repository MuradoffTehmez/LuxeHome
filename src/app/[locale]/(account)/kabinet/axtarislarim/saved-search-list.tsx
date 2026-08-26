"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { SAVED_SEARCH_FREQUENCIES } from "@/lib/constants";
import { deleteSavedSearch, toggleSavedSearchEnabled, updateSavedSearch } from "./actions";

function EditSavedSearchModal({
  id,
  name,
  frequency,
  open,
  onClose,
}: {
  id: string;
  name: string;
  frequency: string;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("account.savedSearches");
  const [state, formAction, pending] = useActionState(updateSavedSearch, IDLE_STATE);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast(state.message ?? "", "success");
      router.refresh();
      onClose();
    }
    // `onClose` valideynin hər render-də yeni referens ola bilər — yalnız nəticə dəyişəndə işə düşməlidir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const frequencyOptions = [
    { value: SAVED_SEARCH_FREQUENCIES.IMMEDIATE, label: t("frequency.immediate") },
    { value: SAVED_SEARCH_FREQUENCIES.DAILY, label: t("frequency.daily") },
    { value: SAVED_SEARCH_FREQUENCIES.WEEKLY, label: t("frequency.weekly") },
    { value: SAVED_SEARCH_FREQUENCIES.OFF, label: t("frequency.off") },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t("editTitle")} size="sm">
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="id" value={id} />
        {state.status === "error" && state.message && (
          <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}
        <Input name="name" label={t("nameLabel")} required defaultValue={name} maxLength={120} error={state.fieldErrors?.name} />
        <Select name="frequency" label={t("frequencyLabel")} defaultValue={frequency} options={frequencyOptions} />
        <Button type="submit" variant="primary" loading={pending} className="mt-2">
          {t("save")}
        </Button>
      </form>
    </Modal>
  );
}

/** Bir saxlanmış axtarış sətrinin redaktə + pause/resume + sil düymələri. */
export function SavedSearchActions({
  id,
  name,
  frequency,
  enabled,
}: {
  id: string;
  name: string;
  frequency: string;
  enabled: boolean;
}) {
  const t = useTranslations("account.savedSearches");
  const [editOpen, setEditOpen] = useState(false);
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
        onClick={() => setEditOpen(true)}
        aria-label={t("editLabel", { name })}
        title={t("edit")}
        className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
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

      <EditSavedSearchModal id={id} name={name} frequency={frequency} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
