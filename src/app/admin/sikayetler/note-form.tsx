"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useServerMessage } from "@/components/admin/use-server-message";
import type { ActionState } from "@/lib/admin/action-state";
import { REPORT_NOTE_MAX, REPORT_NOTE_MIN } from "@/lib/constants";

/**
 * Şikayət qrupuna daxili qeyd (#197). Qeyd yalnız paneldə görünür; uğurdan sonra sahə
 * təmizlənir və siyahı yenilənir.
 */
export function ReportNoteForm({
  propertyId,
  action,
}: {
  propertyId: string;
  action: (propertyId: string, body: string) => Promise<ActionState>;
}) {
  const t = useTranslations("admin");
  const id = useId();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const translate = useServerMessage();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        const text = body.trim();
        if (text.length < REPORT_NOTE_MIN || text.length > REPORT_NOTE_MAX) {
          setError(t("pages.reports.noteLength", { min: REPORT_NOTE_MIN, max: REPORT_NOTE_MAX }));
          return;
        }
        startTransition(async () => {
          const result = await action(propertyId, text);
          const message = result.message ? translate(result.message) ?? result.message : null;
          if (result.status !== "success") {
            setError(message ?? t("components.reason.failed"));
            return;
          }
          if (message) toast(message, "success");
          setBody("");
          setError(null);
          router.refresh();
        });
      }}
    >
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="sr-only">{t("pages.reports.noteLabel")}</label>
        <textarea
          id={id}
          value={body}
          onChange={(event) => {
            setBody(event.currentTarget.value);
            setError(null);
          }}
          rows={2}
          maxLength={REPORT_NOTE_MAX}
          placeholder={t("pages.reports.notePlaceholder")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="block w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-gold focus:outline-none"
        />
        {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-danger">{error}</p>}
      </div>
      <Button type="submit" variant="outline" size="sm" loading={pending} className="self-start">
        {t("pages.reports.noteAdd")}
      </Button>
    </form>
  );
}
