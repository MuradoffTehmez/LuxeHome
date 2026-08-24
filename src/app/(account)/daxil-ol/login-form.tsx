"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { accountAuthHref } from "@/lib/auth/public-account-policy";
import { signInAccount } from "../hesab/actions";

/**
 * İctimai giriş forması.
 *
 * Paneldəki `/giris` ekranından ayrıdır: burada 2FA addımı yoxdur və şirkət
 * əməkdaşı hesabı qəbul edilmir (server tərəfdə yoxlanılır).
 */
export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAccount, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="davam" value={next} />}

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <Input
        name="email"
        label="E-poçt"
        type="email"
        inputMode="email"
        required
        autoComplete="email"
        placeholder="ad@nümunə.az"
        error={state.fieldErrors?.email}
      />

      <Input
        name="password"
        label="Parol"
        type="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
        error={state.fieldErrors?.password}
      />

      <Button type="submit" loading={pending} fullWidth>
        <LogIn className="size-4" aria-hidden="true" />
        Daxil ol
      </Button>

      <p className="flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-ink-soft">
        <span>Hesabınız yoxdur?</span>
        <Link
          href={accountAuthHref("/qeydiyyat", next)}
          className="inline-flex min-h-11 items-center rounded-xs text-gold-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Qeydiyyatdan keçin
        </Link>
      </p>
    </form>
  );
}
