"use client";

import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { SecretPanel } from "./secret-panel";

/**
 * Admin formalarının ümumi çərçivəsi.
 *
 * Action-ın qaytardığı `ActionState` kontekst vasitəsilə paylanır — sahə komponentləri
 * öz xətalarını prop zənciri olmadan oxuyur. Uğur/xəta mesajı toast ilə göstərilir,
 * amma xəta eyni zamanda formanın başında da qalır: toast itir, xəta izahı qalmalıdır.
 */

const FormStateContext = createContext<ActionState>(IDLE_STATE);

export function useAdminFormState(): ActionState {
  return useContext(FormStateContext);
}

export function useFieldError(name: string): string | undefined {
  return useContext(FormStateContext).fieldErrors?.[name];
}

type AdminFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
  cancelHref?: string;
  /** Saxla düyməsinin yanında göstərilən əlavə əməliyyatlar (məsələn «Sil»). */
  extraActions?: React.ReactNode;
  className?: string;
};

export function AdminForm({
  action,
  children,
  submitLabel = "Yadda saxla",
  cancelHref,
  extraActions,
  className,
}: AdminFormProps) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    if (state.status === "error") {
      const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [state, toast]);

  return (
    <FormStateContext.Provider value={state}>
      <form ref={formRef} action={formAction} className={cn("flex min-w-0 flex-col gap-6", className)} noValidate>
        {state.status === "error" && state.message && (
          <div
            ref={errorRef}
            role="alert"
            className="flex items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        )}

        {/* Uğur mesajı toast-dan əlavə burada da qalır — toast itir, nəticə qalmalıdır */}
        {state.status === "success" && state.message && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        )}

        {state.secret && <SecretPanel secret={state.secret} />}

        {children}

        {/* Uzun formada saxla düyməsi həmişə əlçatan qalır */}
        <div className="sticky bottom-0 z-[var(--z-sticky)] -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur sm:-mx-6 sm:px-6 sm:pb-3">
          {extraActions}
          {cancelHref && (
            <Link
              href={cancelHref}
              className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
            >
              Ləğv et
            </Link>
          )}
          <SubmitButton label={submitLabel} />
        </div>
      </form>
    </FormStateContext.Provider>
  );
}

/**
 * Göndərmə düyməsi.
 *
 * `useFormStatus` yalnız formanın **daxilindəki** komponentdə işləyir — buna görə
 * ayrıca komponentdir, `AdminForm`-un öz gövdəsində deyil.
 */
export function SubmitButton({
  label = "Yadda saxla",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xs border border-transparent bg-gold px-5 text-sm font-medium text-ink",
        "transition-colors duration-300 ease-out-soft hover:bg-gold-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Save className="size-4" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}

/** Formanı məntiqi bloklara bölən başlıqlı bölmə. */
export function FormSection({
  title,
  description,
  children,
  className,
  asFieldset = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  asFieldset?: boolean;
}) {
  const Tag = asFieldset ? "fieldset" : "section";

  return (
    <Tag className={cn("min-w-0 rounded-md border border-line bg-paper", className)}>
      {asFieldset ? <legend className="sr-only">{title}</legend> : null}
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">{children}</div>
    </Tag>
  );
}
