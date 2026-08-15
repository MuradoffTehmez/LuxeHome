"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/field";

/**
 * Giriş forması.
 *
 * Hazırda yalnız interfeysdir — məlumat heç bir yerə göndərilmir, düymə
 * birbaşa `/admin` səhifəsinə keçir.
 *
 * TODO: Backend mərhələsində Server Action ilə əvəzlənəcək:
 *       bcryptjs ilə şifrə yoxlaması, jose ilə JWT sessiya, httpOnly cookie
 *       və `middleware.ts` üzərindən route qoruması.
 */
export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  const controlClass =
    "w-full min-h-12 rounded-xs border border-line-strong bg-paper px-4 py-3 text-base text-ink " +
    "placeholder:text-ink-muted transition-colors duration-200 hover:border-ink-muted focus:border-gold";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    // Backend qoşulana qədər sadəcə panelə keçid
    router.push("/admin");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="E-poçt" htmlFor="login-email" required>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="ad@luxehomeestate.az"
          className={controlClass}
        />
      </Field>

      <Field label="Şifrə" htmlFor="login-password" required>
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
            aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Checkbox id="login-remember" name="remember" label="Məni xatırla" />
        <button
          type="button"
          className="min-h-11 cursor-pointer text-sm text-ink-soft underline-offset-4 transition-colors duration-200 hover:text-gold-deep hover:underline"
        >
          Şifrəni unutmusunuz?
        </button>
      </div>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <LogIn className="size-4.5" aria-hidden="true" />}
        Daxil ol
      </Button>
    </form>
  );
}
