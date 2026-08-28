"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { FormState } from "@/lib/auth/types";
import { signIn } from "./actions";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

/**
 * Giriş forması.
 *
 * Parol yoxlaması `signIn` server action-ında aparılır; uğurlu halda action
 * ikinci mərhələyə (`/giris/dogrulama` və ya `/giris/2fa-qurulumu`) yönləndirir,
 * ona görə burada uğur vəziyyəti yoxdur — yalnız səhv mesajı qayıdır.
 *
 * `davam` — middleware-in qoyduğu marşrut: giriş bitəndə istifadəçi ilk istədiyi
 * panel səhifəsinə qayıdır. Dəyər server tərəfdə yenidən yoxlanılır.
 */
export function LoginForm({ davam }: { davam?: string }) {
  const t = useTranslations("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(signIn, {});

  const controlClass =
    "w-full min-h-12 rounded-xs border border-line-strong bg-paper px-4 py-3 text-base text-ink " +
    "placeholder:text-ink-muted transition-colors duration-200 hover:border-ink-muted focus:border-gold";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {davam && <input type="hidden" name="davam" value={davam} />}

      <Field label={t("fields.email")} htmlFor="login-email" required>
        <input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          placeholder="ad@luxehomeestate.az"
          className={controlClass}
        />
      </Field>

      <Field label={t("fields.staffPassword")} htmlFor="login-password" required>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={`${controlClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? t("fields.hidePassword") : t("fields.showPassword")}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-4.5" aria-hidden="true" />
            ) : (
              <Eye className="size-4.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>

      {state.error && (
        <p
          role="alert"
          className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
        >
          {state.error}
        </p>
      )}

      <TurnstileWidget action="staff_login" resetSignal={state.error} />

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <LogIn className="size-4.5" aria-hidden="true" />}
        {t("staffLogin.submit")}
      </Button>
    </form>
  );
}
