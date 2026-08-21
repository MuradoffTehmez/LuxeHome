"use client";

import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";

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
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    if (state.status === "error") errorRef.current?.scrollIntoView({ block: "center" });
  }, [state, toast]);

  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={cn("flex flex-col gap-6", className)} noValidate>
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

        {children}

        {/* Uzun formada saxla düyməsi həmişə əlçatan qalır */}
        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
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
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-line bg-paper", className)}>
      <header className="border-b border-line px-5 py-4">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </header>
      <div className="grid gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}
