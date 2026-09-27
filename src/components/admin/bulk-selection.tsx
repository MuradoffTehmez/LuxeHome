"use client";

import { createContext, useActionState, useContext, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Archive,
  CheckCircle2,
  Power,
  PowerOff,
  ShieldCheck,
  ShieldX,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { cn } from "@/lib/utils";
import { useLocalizedActionState } from "./use-server-message";

/**
 * İkon server komponentindən açar kimi gəlir — funksiya (lucide komponenti)
 * server → client sərhədindən keçə bilmir.
 */
const ICONS = {
  delete: Trash2,
  approve: ShieldCheck,
  revoke: ShieldX,
  activate: Power,
  deactivate: PowerOff,
  archive: Archive,
  publish: CheckCircle2,
} satisfies Record<string, LucideIcon>;

export type BulkIntentConfig = {
  /** Server action-a `intent` sahəsi kimi gedən dəyər. */
  intent: string;
  label: string;
  icon?: keyof typeof ICONS;
  tone?: "danger" | "neutral";
  /** Verilərsə əməliyyat təsdiq dialoqundan sonra işləyir (silmə üçün məcburi). */
  confirm?: { title: string; description: string; confirmLabel: string };
};

const CHECKBOX = 'input[type="checkbox"][name="ids"]';

const BulkFormContext = createContext<string | undefined>(undefined);

/**
 * Admin siyahıları üçün toplu seçim.
 *
 * Sətir checkbox-ları (`BulkRowCheckbox`) server komponentində render olunur —
 * seçim vəziyyəti DOM-dadır, siyahını client-ə çevirmək lazım gəlmir. Checkbox-lar
 * forma `form="<id>"` atributu ilə bağlanır, siyahı isə formun **içində deyil**:
 * sətirlərdə öz formu olan elementlər var (məs. agentlik profilinin bərpası) və
 * iç-içə `<form>` etibarsız HTML-dir. `AdaptiveDataList` həm kart, həm cədvəl görünüşünü DOM-da saxlayır,
 * ona görə eyni id-li checkbox-lar sinxron saxlanılır və say unikal id üzrə aparılır;
 * server tərəfdə də `form.uniqueList()` təkrarı atır.
 */
export function BulkSelectionForm({
  action,
  intents,
  children,
  className,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  intents: BulkIntentConfig[];
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("admin");
  const [rawState, formAction, pending] = useActionState(action, IDLE_STATE);
  const state = useLocalizedActionState(rawState);
  const { toast } = useToast();
  const router = useRouter();
  const formId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const intentRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);
  const [allChecked, setAllChecked] = useState(false);
  const [confirming, setConfirming] = useState<BulkIntentConfig | null>(null);

  function boxes(): HTMLInputElement[] {
    return Array.from(rootRef.current?.querySelectorAll<HTMLInputElement>(CHECKBOX) ?? []);
  }

  function recount() {
    const all = boxes();
    const ids = new Set(all.map((box) => box.value));
    const checked = new Set(all.filter((box) => box.checked).map((box) => box.value));
    setSelected(checked.size);
    setAllChecked(ids.size > 0 && checked.size === ids.size);
  }

  function setAll(checked: boolean) {
    for (const box of boxes()) box.checked = checked;
    recount();
  }

  function onChange(event: React.ChangeEvent<HTMLDivElement>) {
    const target = event.target as unknown as HTMLInputElement;
    if (!target.matches?.(CHECKBOX)) return;
    // Kart və cədvəl görünüşündəki eyni sətir birlikdə dəyişir
    for (const box of boxes()) if (box.value === target.value) box.checked = target.checked;
    recount();
  }

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    if (state.status === "success") {
      setConfirming(null);
      setAll(false);
      router.refresh();
    }
    // `setAll` hər render-də yenidir, amma yalnız nəticə dəyişəndə işləməlidir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, toast, router]);

  function submit(config: BulkIntentConfig) {
    if (intentRef.current) intentRef.current.value = config.intent;
    formRef.current?.requestSubmit();
  }

  function trigger(config: BulkIntentConfig) {
    if (config.confirm) setConfirming(config);
    else submit(config);
  }

  // İcazə olan əməliyyat yoxdursa (məs. silmə səlahiyyəti yoxdur) seçim də göstərilmir
  if (intents.length === 0) return <>{children}</>;

  return (
    <div ref={rootRef} onChange={onChange} className={className}>
      <form id={formId} ref={formRef} action={formAction} hidden>
        <input ref={intentRef} type="hidden" name="intent" defaultValue="" />
      </form>
      <div
        className={cn(
          "sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2 transition-colors lg:px-5",
          selected > 0 ? "bg-gold/10" : "bg-beige/40",
        )}
      >
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(event) => setAll(event.target.checked)}
            className="size-4 rounded-sm border-line-strong accent-gold"
          />
          {t("components.bulk.selectAll")}
        </label>

        <span className="tabular text-xs text-ink-muted" aria-live="polite">
          {selected > 0 ? t("components.bulk.selected", { count: selected }) : t("components.bulk.hint")}
        </span>

        {selected > 0 ? (
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {intents.map((config) => {
              const Icon = config.icon ? ICONS[config.icon] : null;
              return (
                <button
                  key={config.intent}
                  type="button"
                  disabled={pending}
                  onClick={() => trigger(config)}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xs px-2.5 text-xs font-medium text-ink-soft transition-colors disabled:cursor-wait disabled:opacity-60",
                    config.tone === "danger" ? "hover:bg-danger-bg hover:text-danger" : "hover:bg-beige hover:text-ink",
                  )}
                >
                  {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
                  {config.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAll(false)}
              aria-label={t("components.bulk.clear")}
              title={t("components.bulk.clear")}
              className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <BulkFormContext.Provider value={formId}>{children}</BulkFormContext.Provider>

      <Modal
        open={confirming !== null}
        onClose={() => (pending ? undefined : setConfirming(null))}
        title={confirming?.confirm?.title ?? ""}
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(null)} disabled={pending}>
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              variant={confirming?.tone === "danger" ? "danger" : "primary"}
              size="sm"
              loading={pending}
              onClick={() => confirming && submit(confirming)}
            >
              {confirming?.confirm?.confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">{confirming?.confirm?.description}</p>
        <p className="mt-3 text-sm font-medium text-ink">{t("components.bulk.selected", { count: selected })}</p>
      </Modal>
    </div>
  );
}

/** Sətir checkbox-u — `BulkSelectionForm`-un içində render olunmalıdır. */
export function BulkRowCheckbox({ id, label }: { id: string; label: string }) {
  const formId = useContext(BulkFormContext);
  if (!formId) return null;
  return (
    <input
      type="checkbox"
      form={formId}
      name="ids"
      value={id}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      className="size-4 shrink-0 cursor-pointer rounded-sm border-line-strong accent-gold"
    />
  );
}
