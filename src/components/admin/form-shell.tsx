"use client";

import { useTranslations } from "next-intl";

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
  submitLabel,
  cancelHref,
  extraActions,
  className,
}: AdminFormProps) {
  const t = useTranslations("admin");
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
              {t("actions.cancel")}
            </Link>
          )}
          <SubmitButton label={submitLabel ?? t("actions.save")} />
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
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  const t = useTranslations("admin");
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xs border border-transparent bg-gold px-5 text-sm font-medium text-on-gold",
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
      {label ?? t("actions.save")}
    </button>
  );
}

/** Formanı məntiqi bloklara bölən başlıqlı bölmə. */
export function FormSection({
  id,
  title,
  description,
  children,
  className,
  asFieldset = false,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  asFieldset?: boolean;
}) {
  const Tag = asFieldset ? "fieldset" : "section";

  return (
    <Tag id={id} className={cn("min-w-0 scroll-mt-32 rounded-lg border border-line bg-paper shadow-xs", className)}>
      {asFieldset ? <legend className="sr-only">{title}</legend> : null}
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">{children}</div>
    </Tag>
  );
}

/** Uzun admin formalarında bölmələr arasında toxunma və klaviatura ilə sürətli keçid. */
export function FormJumpNav({ items }: { items: readonly { id: string; label: string }[] }) {
  const t = useTranslations("admin");

  return (
    <nav
      aria-label={t("components.form.sections")}
      className="sticky top-16 z-[var(--z-sticky)] -mx-4 overflow-x-auto border-y border-line bg-beige/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
    >
      <div className="flex w-max min-w-full gap-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-xs border border-line bg-paper px-3 text-xs font-medium text-ink-soft transition-colors hover:border-gold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
