"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { toggleProjectsSection } from "./actions";

/**
 * «Yaşayış kompleksləri» bölməsinin açarı (#83).
 *
 * `DemoToggleForm` kimi tək düyməli kiçik formadır — nəticə dərhal görünür.
 */
export function ProjectsSectionForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("admin");
  const [state, formAction, pending] = useActionState(toggleProjectsSection, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* `form.boolean()` sahənin mövcudluğuna baxır — bağlama halında sahə göndərilmir. */}
      {enabled ? null : <input type="hidden" name="enabled" value="1" />}

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
            enabled ? "bg-success/12 text-success" : "bg-line/60 text-ink-soft"
          }`}
        >
          <span className={`size-2 rounded-full ${enabled ? "bg-success" : "bg-ink-muted"}`} aria-hidden="true" />
          {enabled ? t("pages.settings.sections.statusVisible") : t("pages.settings.sections.statusHidden")}
        </span>

        <button
          type="submit"
          disabled={pending}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            enabled ? "bg-ink text-ivory hover:bg-ink/90" : "bg-gold text-navy hover:bg-gold/90"
          }`}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {enabled ? t("pages.settings.sections.hide") : t("pages.settings.sections.show")}
        </button>
      </div>

      {state.status !== "idle" && state.message ? (
        <p
          role="status"
          className={`flex items-start gap-2 text-sm ${state.status === "success" ? "text-success" : "text-danger"}`}
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
