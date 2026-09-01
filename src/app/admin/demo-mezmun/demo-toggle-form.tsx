"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { toggleDemoContent } from "./actions";

/**
 * Nümunə məzmun açarı.
 *
 * Qəsdən ayrıca kiçik formadır: `AdminForm` sarğısı çoxsahəli formalar üçündür,
 * burada isə tək bir düymə var və nəticə dərhal görünməlidir.
 */
export function DemoToggleForm({ enabled, hasContent }: { enabled: boolean; hasContent: boolean }) {
  const t = useTranslations("admin");
  const [state, formAction, pending] = useActionState(toggleDemoContent, IDLE_STATE);

  const nextEnabled = !enabled;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Açarın yeni dəyəri gizli sahə ilə gedir: `form.boolean()` sahənin
          mövcudluğuna baxır, ona görə söndürmə halında sahə heç göndərilmir. */}
      {nextEnabled ? <input type="hidden" name="enabled" value="1" /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
            enabled ? "bg-success/12 text-success" : "bg-line/60 text-ink-soft"
          }`}
        >
          <span
            className={`size-2 rounded-full ${enabled ? "bg-success" : "bg-ink-muted"}`}
            aria-hidden="true"
          />
          {enabled ? t("pages.demoContent.statusOn") : t("pages.demoContent.statusOff")}
        </span>

        <button
          type="submit"
          disabled={pending || (!enabled && !hasContent)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            enabled
              ? "bg-ink text-ivory hover:bg-ink/90"
              : "bg-gold text-navy hover:bg-gold/90"
          }`}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {enabled ? t("pages.demoContent.turnOff") : t("pages.demoContent.turnOn")}
        </button>
      </div>

      {!hasContent && !enabled ? (
        <p className="flex items-start gap-2 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("pages.demoContent.noContentHint")}
        </p>
      ) : null}

      {state.status !== "idle" && state.message ? (
        <p
          role="status"
          className={`flex items-start gap-2 text-sm ${
            state.status === "success" ? "text-success" : "text-danger"
          }`}
        >
          {state.status === "success" ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
