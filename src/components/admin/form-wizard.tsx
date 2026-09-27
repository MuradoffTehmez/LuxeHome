"use client";

import { Children, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, History, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseDraft,
  serializeDraft,
  wizardProgress,
  type FormDraft,
} from "@/lib/ui/form-wizard";
import { SubmitButton, useFormActionState } from "./form-shell";

export type WizardLabels = {
  /** «{current} / {total} addım tamamlanıb — {percent}%» */
  progress: (values: { completed: number; total: number; percent: number }) => string;
  /** «Addım {current} / {total}» */
  stepOf: (values: { current: number; total: number }) => string;
  back: string;
  next: string;
  cancel: string;
  submit: string;
  stepsNav: string;
  draftSaved: (time: string) => string;
  draftFound: (time: string) => string;
  draftRestore: string;
  draftDiscard: string;
};

type WizardStepProps = {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

/**
 * Sehrbazın bir addımı. Özü heç nə çəkmir — `FormWizard` uşaqları oxuyub
 * panellərə düzür. Addımın bütün sahələri həmişə DOM-da qalır (yalnız `hidden`
 * olur), ona görə son addımda forma bütün addımların dəyərlərini göndərir.
 */
export function WizardStep(props: WizardStepProps) {
  return <>{props.children}</>;
}

type FormWizardProps = {
  children: React.ReactNode;
  labels: WizardLabels;
  cancelHref?: string;
  /** Verilərsə forma `localStorage`-a avtomatik yazılır və bərpa təklif olunur. */
  draftKey?: string;
  /** Qaralama bərpa ediləndə çağırılır — forma həmin dəyərlərlə yenidən qurulur. */
  onRestoreDraft?: (draft: FormDraft) => void;
  /** Önbaxış addımı açılanda çağırılır — cari dəyərləri göstərmək üçün. */
  onStepChange?: (stepId: string, form: HTMLFormElement | null) => void;
  extraActions?: React.ReactNode;
  initialStep?: number;
  /** Redaktədə bütün addımlar dolu olur — istənilən addıma birbaşa keçmək olar. */
  allStepsReachable?: boolean;
  /** Qaralama artıq bərpa edilibsə təkrar təklif edilmir (yalnız avtomatik yazılır). */
  offerDraft?: boolean;
};

const AUTOSAVE_DELAY_MS = 700;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Gizli rejim və ya dolu yaddaş — qaralama sadəcə saxlanmır.
  }
}

/**
 * Uzun formanı addımlara bölən sehrbaz.
 *
 * - Yuxarıda irəliləyiş zolağı: «3 / 8 addım tamamlanıb — 37%» və addım siyahısı.
 * - «Növbəti» cari addımın sahələrini brauzer qaydaları ilə yoxlayır; server
 *   xətası gələndə sehrbaz xətalı sahənin addımına özü keçir.
 * - Forma dəyişdikcə qaralama `localStorage`-a yazılır; növbəti açılışda bərpa
 *   təklif olunur. Göndərmə anında qaralama silinir, server xəta qaytarsa təzədən
 *   yazılır — uğurlu elan köhnə qaralamanı geri gətirmir.
 */
export function FormWizard({
  children,
  labels,
  cancelHref,
  draftKey,
  onRestoreDraft,
  onStepChange,
  extraActions,
  initialStep = 0,
  allStepsReachable = false,
  offerDraft = true,
}: FormWizardProps) {
  const steps = Children.toArray(children).filter(
    (child): child is React.ReactElement<WizardStepProps> => isValidElement(child) && child.type === WizardStep,
  );
  const total = steps.length;
  const [current, setCurrent] = useState(() => Math.min(initialStep, Math.max(0, total - 1)));
  const [reached, setReached] = useState(() => (allStepsReachable ? Math.max(0, total - 1) : current));

  const [draftOffer, setDraftOffer] = useState<FormDraft | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const saveTimer = useRef<number | null>(null);
  const headingId = useId();
  const state = useFormActionState();
  const progress = wizardProgress(current, total);

  const form = () => rootRef.current?.closest("form") ?? null;

  const goTo = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(index, total - 1));
      setCurrent(target);
      setReached((value) => Math.max(value, target));
    },
    [total],
  );

  useEffect(() => {
    onStepChange?.(steps[current]?.props.id ?? "", rootRef.current?.closest("form") ?? null);
    // Gizli paneldə qurulan xəritə (Leaflet) ölçüsünü görünəndə yenidən hesablasın.
    window.dispatchEvent(new Event("resize"));
    rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız addım dəyişəndə
  }, [current]);

  // Server xətası: xətalı sahənin addımına keç.
  useEffect(() => {
    if (state.status !== "error") return;
    const invalid = form()?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const index = invalid ? panelRefs.current.findIndex((panel) => panel?.contains(invalid)) : -1;
    if (index >= 0) goTo(index);
    if (draftKey) saveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız yeni nəticədə
  }, [state]);

  // Qaralama təklifi — yalnız client-də, ilk açılışda.
  useEffect(() => {
    if (!draftKey || !offerDraft) return;
    const draft = parseDraft(readStorage(draftKey));
    if (draft && draft.entries.length > 0) setDraftOffer(draft);
  }, [draftKey, offerDraft]);

  function saveDraft() {
    const element = form();
    if (!draftKey || !element) return;
    const draft = serializeDraft(new FormData(element).entries(), current);
    writeStorage(draftKey, JSON.stringify(draft));
    setSavedAt(draft.savedAt);
  }

  function scheduleSave() {
    if (!draftKey) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(saveDraft, AUTOSAVE_DELAY_MS);
  }

  // Göndərmə anında qaralama silinir; forma elementinə bir dəfə bağlanır.
  useEffect(() => {
    const element = rootRef.current?.closest("form");
    if (!element || !draftKey) return;
    const onSubmit = () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      writeStorage(draftKey, null);
    };
    // Şəkil yükləmə kimi proqram dəyişiklikləri `input` hadisəsi vermir — hidden
    // sahələrin dəyişməsi DOM mutasiyası ilə izlənir.
    const observer = new MutationObserver(() => scheduleSave());
    observer.observe(element, { subtree: true, attributes: true, attributeFilter: ["value"], childList: true });
    element.addEventListener("submit", onSubmit);
    return () => {
      element.removeEventListener("submit", onSubmit);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forma bir dəfə bağlanır
  }, [draftKey]);

  function firstInvalidField(index: number): HTMLInputElement | undefined {
    const panel = panelRefs.current[index];
    if (!panel) return undefined;
    // Select və textarea da eyni doğrulama API-sini (`checkValidity`) daşıyır.
    const fields = (Array.from(panel.querySelectorAll("input, select, textarea")) as HTMLInputElement[]).filter(
      (field) => !field.disabled && field.type !== "hidden",
    );
    return fields.find((field) => !field.checkValidity());
  }

  function validateStep(index: number): boolean {
    const invalid = firstInvalidField(index);
    if (!invalid) return true;
    invalid.reportValidity();
    invalid.focus();
    return false;
  }

  /**
   * Göndərmədən əvvəl bütün addımlar yoxlanılır: gizli addımdakı boş məcburi sahə
   * serverə getmədən tutulur və istifadəçi həmin addıma aparılır.
   */
  function validateAll(event: React.MouseEvent<HTMLButtonElement>) {
    for (let index = 0; index < total; index += 1) {
      const invalid = firstInvalidField(index);
      if (!invalid) continue;
      event.preventDefault();
      goTo(index);
      // Panel görünən olandan sonra brauzer izahını göstərə bilir.
      window.setTimeout(() => {
        invalid.reportValidity();
        invalid.focus();
      }, 50);
      return;
    }
  }

  function next() {
    if (!validateStep(current)) return;
    goTo(current + 1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Enter sahədə formanı vaxtından əvvəl göndərməsin — növbəti addıma keçir.
    const target = event.target as HTMLElement;
    if (event.key !== "Enter" || target.tagName !== "INPUT") return;
    if ((target as HTMLInputElement).type === "checkbox" || (target as HTMLInputElement).type === "radio") return;
    if (current < total - 1) {
      event.preventDefault();
      next();
    }
  }

  function jumpTo(index: number) {
    if (index > reached) return;
    if (index > current && !validateStep(current)) return;
    goTo(index);
  }

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(
      new Date(iso),
    );

  const step = steps[current];
  const isLast = current === total - 1;

  return (
    <div ref={rootRef} className="flex min-w-0 scroll-mt-24 flex-col gap-6" onInput={scheduleSave} onChange={scheduleSave} onKeyDown={handleKeyDown}>
      {draftOffer && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-lg border border-info/30 bg-info-bg px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <History className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
            {labels.draftFound(formatTime(draftOffer.savedAt))}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                const draft = draftOffer;
                setDraftOffer(null);
                onRestoreDraft?.(draft);
              }}
              className="inline-flex min-h-11 items-center rounded-sm bg-gold px-4 font-medium text-on-gold hover:bg-gold-soft"
            >
              {labels.draftRestore}
            </button>
            <button
              type="button"
              onClick={() => {
                if (draftKey) writeStorage(draftKey, null);
                setDraftOffer(null);
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line-strong px-3 text-ink-soft hover:text-ink"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {labels.draftDiscard}
            </button>
          </div>
        </div>
      )}

      <nav aria-labelledby={headingId} className="rounded-lg border border-line bg-paper p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p id={headingId} className="text-xs font-semibold tracking-wide text-gold-deep uppercase">
            {labels.stepOf({ current: current + 1, total })}
          </p>
          <p className="tabular text-sm text-ink-soft" aria-live="polite">
            {labels.progress(progress)}
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-label={labels.progress(progress)}
          className="mt-3 h-2 overflow-hidden rounded-full bg-beige"
        >
          <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${progress.percent}%` }} />
        </div>
        <ol aria-label={labels.stepsNav} className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {steps.map((item, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={item.props.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => jumpTo(index)}
                  disabled={index > reached}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
                    active && "border-gold bg-gold/10 text-ink",
                    done && !active && "border-line text-ink-soft hover:border-gold",
                    !done && !active && "border-line text-ink-muted",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-[11px] tabular",
                      done ? "bg-success text-white" : active ? "bg-gold text-on-gold" : "bg-beige text-ink-muted",
                    )}
                    aria-hidden="true"
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  {item.props.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {steps.map((item, index) => (
        <div
          key={item.props.id}
          ref={(element) => {
            panelRefs.current[index] = element;
          }}
          hidden={index !== current}
          data-wizard-step={item.props.id}
          className="flex min-w-0 flex-col gap-6"
        >
          {item.props.children}
        </div>
      ))}

      <div className="sticky bottom-0 z-[var(--z-sticky)] -mx-4 flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur sm:-mx-6 sm:px-6 sm:pb-3">
        <p className="text-xs text-ink-muted" aria-live="polite">
          {savedAt ? labels.draftSaved(formatTime(savedAt)) : step?.props.title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          {current === 0 && cancelHref ? (
            <Link
              href={cancelHref}
              className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
            >
              {labels.cancel}
            </Link>
          ) : current > 0 ? (
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {labels.back}
            </button>
          ) : null}
          {isLast ? (
            <SubmitButton label={labels.submit} onClick={validateAll} />
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-gold px-5 text-sm font-medium text-on-gold transition-colors hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {labels.next}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
