"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { FormState } from "@/lib/auth/types";
import { verifyTwoFactor } from "../actions";

/**
 * İkinci mərhələnin forması.
 *
 * Sahə həm TOTP kodunu, həm də ehtiyat kodunu qəbul edir — hansı olduğunu
 * server action-ı özü ayırd edir, ona görə `inputMode` rəqəmlə məhdudlaşdırılmır.
 */
export function VerifyForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(verifyTwoFactor, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Kod" htmlFor="totp-code" required>
        <input
          id="totp-code"
          name="code"
          inputMode="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={9}
          autoFocus
          required
          placeholder="123456"
          className="min-h-12 w-full rounded-xs border border-line-strong bg-paper px-4 py-3 text-center text-lg tracking-[0.4em] text-ink transition-colors duration-200 placeholder:tracking-normal placeholder:text-ink-muted hover:border-ink-muted focus:border-gold"
        />
      </Field>

      {state.error && (
        <p
          role="alert"
          className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <ShieldCheck className="size-4.5" aria-hidden="true" />}
        Təsdiqlə
      </Button>
    </form>
  );
}
