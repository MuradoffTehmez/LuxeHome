"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/admin/action-state";
import { LEAD_NOTE_MAX, LEAD_STAGES, type LeadStage } from "@/lib/constants";
import { addLeadNote, changeLeadStage, setLeadNextContact } from "../actions";

function useRun() {
  const t = useTranslations("account.leads");
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionState>, onSuccess?: () => void, onFailure?: () => void) =>
    startTransition(async () => {
      const result = await action().catch((): ActionState => ({ status: "error", message: t("actions.failed") }));
      toast(result.message ?? t("actions.failed"), result.status === "success" ? "success" : "error");
      if (result.status === "success") {
        onSuccess?.();
        router.refresh();
      } else {
        onFailure?.();
      }
    });
  return { pending, run, router };
}

const STAGES = Object.values(LEAD_STAGES) as LeadStage[];

/** Mərhələ seçimi (#222, PRD 8.3) — dəyişiklik dərhal yazılır və tarixçəyə düşür. */
export function LeadStageSelect({ id, stage }: { id: string; stage: LeadStage }) {
  const t = useTranslations("account.leads");
  const { pending, run, router } = useRun();
  const [value, setValue] = useState<LeadStage>(stage);
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
      {t("card.stage")}
      <select
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as LeadStage;
          const previous = value;
          setValue(next);
          // Rədd edilən (məs. eyni anda dəyişdirilmiş) mərhələ ekranda qalmasın: əvvəlkinə qayıdılır
          // və server vəziyyəti yenidən oxunur.
          run(() => changeLeadStage(id, next), undefined, () => {
            setValue(previous);
            router.refresh();
          });
        }}
        className="min-h-11 rounded-sm border border-line bg-paper px-3 text-sm font-normal text-ink focus:border-gold focus:outline-none"
      >
        {STAGES.map((option) => (
          <option key={option} value={option}>{t(`stages.${option}`)}</option>
        ))}
      </select>
    </label>
  );
}

/** Növbəti əlaqə tarixi — `datetime-local`, Bakı vaxtı kimi saxlanılır. */
export function LeadNextContactForm({ id, value }: { id: string; value: string }) {
  const t = useTranslations("account.leads");
  const { pending, run } = useRun();
  const [input, setInput] = useState(value);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`next-${id}`} className="text-sm font-medium text-ink">{t("card.nextContact")}</label>
      <div className="flex flex-wrap gap-2">
        <input
          id={`next-${id}`}
          type="datetime-local"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-h-11 rounded-sm border border-line bg-paper px-3 text-sm text-ink focus:border-gold focus:outline-none"
        />
        <Button size="sm" variant="outline" loading={pending} onClick={() => run(() => setLeadNextContact(id, input))}>{t("card.save")}</Button>
        {value && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setLeadNextContact(id, ""), () => setInput(""))}>{t("card.clear")}</Button>
        )}
      </div>
    </div>
  );
}

/** Daxili qeyd — yalnız müraciətə baxa bilənlərə görünür, müştəriyə göndərilmir. */
export function LeadNoteForm({ id }: { id: string }) {
  const t = useTranslations("account.leads");
  const { pending, run } = useRun();
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Textarea label={t("card.note")} hint={t("card.noteHint")} value={text} onChange={(event) => setText(event.target.value)} maxLength={LEAD_NOTE_MAX} rows={3} />
      <div>
        <Button size="sm" loading={pending} disabled={text.trim().length < 2} onClick={() => run(() => addLeadNote(id, text), () => setText(""))}>
          {t("card.addNote")}
        </Button>
      </div>
    </div>
  );
}
