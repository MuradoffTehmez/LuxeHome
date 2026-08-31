"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { changePassword, type AccountState } from "./actions";

const CONTROL =
  "min-h-12 w-full rounded-xs border border-line-strong bg-paper px-4 py-3 text-base text-ink " +
  "transition-colors duration-200 placeholder:text-ink-muted hover:border-ink-muted focus:border-gold";

export function PasswordForm({ mustChange = false }: { mustChange?: boolean }) {
  const t = useTranslations("admin");
  const [state, formAction, pending] = useActionState<AccountState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {mustChange && !state.success && (
        <p className="rounded-xs border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-ink">
          {t("pages.account.sizeMuveqqetiParolVerilib")}
        </p>
      )}

      <Field label={t("pages.account.cariParol")} htmlFor="current-password" required>
        <input
          id="current-password"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className={CONTROL}
        />
      </Field>

      <Field
        label={t("pages.account.yeniParol")}
        htmlFor="next-password"
        hint={t("pages.account.enAzi10Simvol")}
        required
      >
        <input
          id="next-password"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={CONTROL}
        />
      </Field>

      <Field label={t("pages.account.yeniParolunTekrari")} htmlFor="confirm-password" required>
        <input
          id="confirm-password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={CONTROL}
        />
      </Field>

      {state.error && (
        <p
          role="alert"
          className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success"
        >
          {state.success}
        </p>
      )}

      <Button type="submit" size="lg" loading={pending}>
        {!pending && <KeyRound className="size-4.5" aria-hidden="true" />}
        Parolu dəyiş
      </Button>
    </form>
  );
}
