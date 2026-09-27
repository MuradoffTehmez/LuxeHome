"use client";

import { useId, useState } from "react";
import { AlertCircle, ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Qeyd: `focus:outline-none` qəsdən istifadə olunmur — klaviatura fokusu üçün
// globals.css-dəki `:focus-visible` konturu görünən qalmalıdır (WCAG 2.4.7).
const CONTROL_BASE =
  "w-full min-h-12 rounded-sm border bg-paper px-4 py-3 text-base text-ink shadow-xs " +
  "placeholder:text-ink-muted transition-[border-color,box-shadow] duration-200 " +
  "focus:border-gold focus:shadow-[0_0_0_4px_rgb(170_135_84/0.16)] " +
  "disabled:bg-beige disabled:text-ink-muted disabled:cursor-not-allowed";

const CONTROL_OK = "border-line-strong hover:border-ink-muted";
const CONTROL_ERROR = "border-danger bg-danger-bg/40";

type FieldWrapperProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

/** Etiket + kömək mətni + xəta mesajını sahənin ətrafına yığır. */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-danger"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      required={props.required}
      error={error}
      hint={hint}
      className={className}
    >
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(CONTROL_BASE, error ? CONTROL_ERROR : CONTROL_OK)}
        {...props}
      />
    </Field>
  );
}

// ---------------------------------------------------------------------------

/** Parol sahəsi — göstər/gizlət düyməsi ilə. Etiketlər çağıran tərəfdən (tərcümə) gəlir. */
export function PasswordInput({
  toggleLabels,
  ...props
}: Omit<InputProps, "type"> & { toggleLabels: { show: string; hide: string } }) {
  const generatedId = useId();
  const inputId = props.id ?? generatedId;
  const [shown, setShown] = useState(false);
  const { label, error, hint, className, id: _id, ...rest } = props;
  void _id;

  return (
    <Field label={label} htmlFor={inputId} required={rest.required} error={error} hint={hint} className={className}>
      <div className="relative">
        <input
          id={inputId}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(CONTROL_BASE, "pr-12", error ? CONTROL_ERROR : CONTROL_OK)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? toggleLabels.hide : toggleLabels.show}
          aria-pressed={shown}
          className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors duration-200 hover:text-ink"
        >
          {shown ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
        </button>
      </div>
    </Field>
  );
}

type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      required={props.required}
      error={error}
      hint={hint}
      className={className}
    >
      <textarea
        id={inputId}
        rows={props.rows ?? 5}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(CONTROL_BASE, "resize-y leading-relaxed", error ? CONTROL_ERROR : CONTROL_OK)}
        {...props}
      />
    </Field>
  );
}

// ---------------------------------------------------------------------------

export type SelectOption = {
  value: string;
  label: string;
  /** Verilibsə, variant bu başlıqlı `<optgroup>`-a yığılır. */
  group?: string | null;
};

/**
 * Ardıcıl eyni `group` dəyərli variantları bir `<optgroup>`-a yığır.
 *
 * Yerləşmə açılışında qəsəbə, kənd və massiv aid olduqları inzibati rayonun
 * başlığı altında göstərilir — düz siyahıda «Maştağa»nın hansı rayonda olduğu
 * bilinmir. Sıra serverdən gəldiyi kimi qalır.
 */
function groupOptions(options: readonly SelectOption[]) {
  const groups: { group: string | null; items: SelectOption[] }[] = [];
  for (const option of options) {
    const group = option.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.group === group) last.items.push(option);
    else groups.push({ group, items: [option] });
  }
  return groups;
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function Select({
  label,
  options,
  placeholder,
  error,
  hint,
  className,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      required={props.required}
      error={error}
      hint={hint}
      className={className}
    >
      <div className="relative">
        <select
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            CONTROL_BASE,
            "cursor-pointer appearance-none pr-11",
            error ? CONTROL_ERROR : CONTROL_OK,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {groupOptions(options).map((entry, index) =>
            entry.group ? (
              <optgroup key={`${entry.group}-${index}`} label={entry.group}>
                {entry.items.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              entry.items.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ),
          )}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}

// ---------------------------------------------------------------------------

export function Checkbox({
  label,
  className,
  id,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: string;
  className?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink select-none",
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className="size-4.5 shrink-0 cursor-pointer accent-[--color-gold]"
        {...props}
      />
      {label}
    </label>
  );
}
