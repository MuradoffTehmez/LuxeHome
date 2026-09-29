"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { comboboxMessages, type ComboboxMessages } from "@/i18n/combobox-messages";
import { cn } from "@/lib/utils";
import { normalizeSearchText } from "@/lib/search-normalization";
import { Field } from "./field-frame";

/**
 * Vahid ComboBox — saytın və panelin bütün seçim sahələri üçün.
 *
 * WAI-ARIA 1.2 «combobox + listbox» nümunəsi: fokus həmişə mətn sahəsində qalır,
 * aktiv variant `aria-activedescendant` ilə elan olunur. Axtarış diakritikadan
 * asılı deyil («seki» → «Şəki»), əvvəlcə sözün əvvəlinə uyğun gələnlər göstərilir.
 *
 * İki rejim:
 * - `mode="select"` (defolt) — dəyər yalnız siyahıdan seçilir; forma `name` ilə
 *   gizli sahədə variantın `value`-sunu göndərir. Siyahıdan seçilmədən yazılmış mətn
 *   fokus itəndə geri qaytarılır.
 * - `mode="free"` — sərbəst mətn (küçə, massiv): siyahı yalnız təklifdir, yazılan
 *   mətn özü dəyərdir; `allowCreate` ilə «“…” əlavə et» sətri göstərilir.
 *
 * Uzun siyahılar (≈20 000 küçə) üçün render olunan sətir sayı `maxVisible` ilə
 * məhdudlaşır — qalanı axtarışla tapılır. Brauzer doğrulaması (`required`) görünən
 * sahədə işləyir, ona görə elan sehrbazının «Növbəti» yoxlaması dəyişmir.
 */

export type ComboboxOption = {
  value: string;
  label: string;
  /** Ardıcıl eyni `group` dəyərli variantlar başlıq altında göstərilir. */
  group?: string | null;
  /** Etiketin altında kiçik mətn (məs. «Abşeron rayonu»). */
  description?: string | null;
  disabled?: boolean;
};

type CommonProps = {
  label: string;
  /** Etiket vizual gizlədilir (filtr zolaqları), amma ekran oxuyucusu üçün qalır. */
  hideLabel?: boolean;
  name?: string;
  options: readonly ComboboxOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  className?: string;
  /** Render olunan ən çox sətir; qalanı axtarışla. */
  maxVisible?: number;
  /** Boş dəyərə qaytaran «×» düyməsi (required olmayanda defolt açıqdır). */
  clearable?: boolean;
  /** Mətnlər — verilməsə aktiv dilin `combobox-messages.ts` kataloqundan götürülür. */
  messages?: Partial<ComboboxMessages>;
  /** Gizli sahənin bağlı olduğu forma (`<form id>`), sahə formadan kənardadırsa. */
  form?: string;
  /** Sahə elementinin özünə əlavə atributlar (`aria-*`). */
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "name" | "id">;
};

type SelectModeProps = CommonProps & {
  mode?: "select";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, option: ComboboxOption | null) => void;
  allowCreate?: never;
  maxLength?: never;
};

type FreeModeProps = CommonProps & {
  mode: "free";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, option: ComboboxOption | null) => void;
  /** Siyahıda olmayan mətn üçün «“…” əlavə et» sətri. */
  allowCreate?: boolean;
  maxLength?: number;
};

export type ComboboxProps = SelectModeProps | FreeModeProps;

const CONTROL =
  "w-full min-h-12 rounded-sm border bg-paper py-3 pr-20 pl-4 text-base text-ink shadow-xs " +
  "placeholder:text-ink-muted transition-[border-color,box-shadow] duration-200 " +
  "focus:border-gold focus:shadow-[0_0_0_4px_rgb(170_135_84/0.16)] " +
  "disabled:bg-beige disabled:text-ink-muted disabled:cursor-not-allowed";

/** Sıralama: tam uyğunluq → sözün əvvəli → istənilən yer. Sabit sıra saxlanılır. */
export function filterComboboxOptions(options: readonly ComboboxOption[], query: string): ComboboxOption[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [...options];
  const exact: ComboboxOption[] = [];
  const prefix: ComboboxOption[] = [];
  const contains: ComboboxOption[] = [];
  for (const option of options) {
    const haystack = normalizeSearchText(`${option.label} ${option.description ?? ""}`);
    const label = normalizeSearchText(option.label);
    if (label === needle) exact.push(option);
    else if (label.startsWith(needle) || haystack.split(" ").some((word) => word.startsWith(needle))) prefix.push(option);
    else if (haystack.includes(needle)) contains.push(option);
  }
  return [...exact, ...prefix, ...contains];
}

export function Combobox(props: ComboboxProps) {
  const {
    label,
    hideLabel,
    name,
    options,
    placeholder,
    required,
    disabled,
    loading,
    error,
    hint,
    id,
    className,
    maxVisible = 80,
    messages: messageOverrides,
    inputProps,
    form,
  } = props;
  const mode = props.mode ?? "select";
  const allowCreate = props.mode === "free" && props.allowCreate;
  const clearable = props.clearable ?? !required;

  // Panel yalnız `admin` kataloqunu ötürür, sayt isə ictimai kataloqları — ona görə
  // komponent öz kiçik kataloqunu dilə görə seçir və hər iki mühitdə işləyir.
  const messages: ComboboxMessages = { ...comboboxMessages(useLocale()), ...messageOverrides };

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;

  const controlled = props.value !== undefined;
  const [innerValue, setInnerValue] = useState(props.defaultValue ?? "");
  const value = controlled ? (props.value ?? "") : innerValue;

  const selected = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);
  const displayFor = useCallback(
    (current: string, option: ComboboxOption | null) => (mode === "free" ? current : (option?.label ?? "")),
    [mode],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(() => displayFor(value, selected));
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const firstRender = useRef(true);

  // Xaricdən dəyər dəyişəndə (kaskad sıfırlama, qaralama bərpası) mətn yenilənir.
  useEffect(() => {
    if (!typing) setQuery(displayFor(value, selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız dəyər/variant dəyişəndə
  }, [value, selected?.label]);

  // Nəzarətsiz rejimdə dəyər siyahıdan çıxıbsa (şəhər dəyişdi, rayon siyahısı yeniləndi)
  // sıfırlanır — native `<select>` də seçilmiş variant itəndə boş dəyərə qayıdır.
  // Siyahı yüklənərkən toxunulmur, çünki variantlar hələ gəlməyib.
  useEffect(() => {
    if (controlled || mode !== "select" || loading || !innerValue) return;
    if (!options.some((option) => option.value === innerValue)) setInnerValue("");
  }, [controlled, mode, loading, innerValue, options]);

  // Gizli sahədə dəyər dəyişəndə formaya `input`/`change` hadisəsi ötürülür:
  // formanın ümumi dinləyiciləri (qaralama, filtr) proqram dəyişikliyini görmür.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const hidden = hiddenRef.current;
    if (!hidden) return;
    hidden.dispatchEvent(new Event("input", { bubbles: true }));
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  }, [value]);

  const filtered = useMemo(
    () => (typing ? filterComboboxOptions(options, query) : [...options]),
    [options, query, typing],
  );
  const visible = filtered.slice(0, maxVisible);
  const hidden = filtered.length - visible.length;
  const trimmedQuery = query.trim();
  const showCreate =
    allowCreate &&
    typing &&
    trimmedQuery.length > 0 &&
    !options.some((option) => normalizeSearchText(option.label) === normalizeSearchText(trimmedQuery));
  // Aktiv indeks: 0..visible-1 variantlar, visible — «əlavə et» sətri.
  const itemCount = visible.length + (showCreate ? 1 : 0);

  function commit(next: string, option: ComboboxOption | null) {
    if (!controlled) setInnerValue(next);
    props.onValueChange?.(next, option);
    setQuery(displayFor(next, option));
    setTyping(false);
    setOpen(false);
    setActive(-1);
  }

  function choose(index: number) {
    if (index < visible.length) {
      const option = visible[index];
      if (option.disabled) return;
      commit(mode === "free" ? option.label : option.value, option);
    } else if (showCreate) {
      commit(trimmedQuery, null);
    }
  }

  /** Fokus itəndə: select rejimində seçilməmiş mətn geri qaytarılır. */
  function settle() {
    if (mode === "free") {
      if (typing && query !== value) commit(query.trim(), null);
      else {
        setOpen(false);
        setTyping(false);
      }
      return;
    }
    if (typing) {
      // Yazılan mətn tam bir variantla eynidirsə, o seçilir — siçan olmadan yazıb Tab basan istifadəçi üçün.
      const exact = options.find((option) => normalizeSearchText(option.label) === normalizeSearchText(query));
      if (exact && !exact.disabled) commit(exact.value, exact);
      else if (!query.trim() && clearable) commit("", null);
      else {
        setQuery(displayFor(value, selected));
        setTyping(false);
      }
    }
    setOpen(false);
    setActive(-1);
  }

  function openList(highlight?: "first" | "last" | "selected") {
    if (disabled) return;
    setOpen(true);
    const selectedIndex = visible.findIndex((option) => option.value === value || (mode === "free" && option.label === value));
    if (highlight === "first") setActive(0);
    else if (highlight === "last") setActive(itemCount - 1);
    else setActive(selectedIndex);
  }

  function move(delta: number) {
    if (itemCount === 0) return;
    setActive((current) => {
      let next = current < 0 ? (delta > 0 ? 0 : itemCount - 1) : current + delta;
      next = Math.max(0, Math.min(itemCount - 1, next));
      // Deaktiv variantları keç.
      let guard = 0;
      while (next < visible.length && visible[next]?.disabled && guard++ < itemCount) {
        next = Math.max(0, Math.min(itemCount - 1, next + (delta > 0 ? 1 : -1)));
      }
      return next;
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList(event.altKey ? "selected" : "first");
        else move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList("last");
        else move(-1);
        break;
      case "PageDown":
        if (open) {
          event.preventDefault();
          move(10);
        }
        break;
      case "PageUp":
        if (open) {
          event.preventDefault();
          move(-10);
        }
        break;
      case "Home":
        if (open && typing === false) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open && typing === false) {
          event.preventDefault();
          setActive(itemCount - 1);
        }
        break;
      case "Enter":
        if (open && active >= 0) {
          // Formanın göndərilməsinin qarşısı yalnız seçim edildikdə alınır.
          event.preventDefault();
          choose(active);
        } else if (open && mode === "free") {
          event.preventDefault();
          commit(query.trim(), null);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setQuery(displayFor(value, selected));
          setTyping(false);
          setOpen(false);
          setActive(-1);
        } else if (clearable && value) {
          event.preventDefault();
          commit("", null);
        }
        break;
      case "Tab":
        if (open) settle();
        break;
    }
  }

  // Aktiv sətir görünən sahədə qalsın.
  useEffect(() => {
    if (!open || active < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  // Kənara klik — siyahı bağlanır (fokus hadisəsi mobil Safari-də həmişə gəlmir).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) settle();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  // Brauzer doğrulaması: select rejimində mətn yazılıb, amma seçilməyibsə sahə etibarsızdır.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const invalidText = mode === "select" && typing && query.trim() !== "" && !selected;
    input.setCustomValidity(invalidText ? messages.noResults : "");
  });

  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const activeId = open && active >= 0 ? `${inputId}-opt-${active}` : undefined;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      required={required}
      error={error}
      hint={hint}
      className={cn(hideLabel && "[&>label]:sr-only", className)}
    >
      <div ref={rootRef} className="relative">
        <input ref={hiddenRef} type="hidden" name={name} form={form} value={value} />
        <input
          {...inputProps}
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          required={required}
          disabled={disabled}
          maxLength={props.mode === "free" ? props.maxLength : undefined}
          placeholder={placeholder}
          value={query}
          className={cn(CONTROL, error ? "border-danger bg-danger-bg/40" : "border-line-strong hover:border-ink-muted")}
          onChange={(event) => {
            setQuery(event.target.value);
            setTyping(true);
            setOpen(true);
            setActive(event.target.value.trim() ? 0 : -1);
          }}
          onFocus={(event) => {
            // Mobil klaviaturada mətn seçilir ki, yeni axtarış üçün silmək lazım olmasın.
            if (mode === "select") event.currentTarget.select();
          }}
          onClick={() => (open ? null : openList("selected"))}
          onBlur={(event) => {
            if (rootRef.current?.contains(event.relatedTarget as Node)) return;
            settle();
          }}
          onKeyDown={onKeyDown}
        />

        <div className="absolute inset-y-0 right-1 flex items-center">
          {loading ? <Loader2 className="mr-2 size-4 animate-spin text-ink-muted" aria-hidden="true" /> : null}
          {clearable && value && !disabled ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label={messages.clear}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                commit("", null);
                inputRef.current?.focus();
              }}
              className="grid size-10 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) setOpen(false);
              else {
                inputRef.current?.focus();
                openList("selected");
              }
            }}
            className="grid size-10 cursor-pointer place-items-center rounded-xs text-ink-muted disabled:cursor-not-allowed"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>

        {open && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border border-line bg-paper shadow-lg">
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              className="max-h-[min(20rem,55vh)] overflow-y-auto overscroll-contain py-1"
            >
              {loading && visible.length === 0 ? (
                <li role="presentation" className="flex items-center gap-2 px-4 py-3 text-sm text-ink-muted">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {messages.loading}
                </li>
              ) : null}
              {!loading && itemCount === 0 ? (
                <li role="presentation" className="flex items-center gap-2 px-4 py-3 text-sm text-ink-muted">
                  <Search className="size-4" aria-hidden="true" />
                  {messages.noResults}
                </li>
              ) : null}
              {visible.map((option, index) => {
                // Qrup başlığı: ardıcıl eyni `group`-un yalnız birincisində.
                const header = option.group && option.group !== visible[index - 1]?.group ? option.group : null;
                const isSelected = mode === "free" ? option.label === value : option.value === value;
                return (
                  <li key={`${option.value}-${index}`} role="presentation">
                    {header ? (
                      <div role="presentation" className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                        {header}
                      </div>
                    ) : null}
                    <div
                      id={`${inputId}-opt-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseMove={() => active !== index && setActive(index)}
                      onClick={() => choose(index)}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-sm text-ink",
                        index === active && "bg-ivory",
                        option.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate", isSelected && "font-semibold")}>{option.label}</span>
                        {option.description ? (
                          <span className="block truncate text-xs text-ink-muted">{option.description}</span>
                        ) : null}
                      </span>
                      {isSelected ? <Check className="size-4 shrink-0 text-gold-deep" aria-hidden="true" /> : null}
                    </div>
                  </li>
                );
              })}
              {showCreate ? (
                <li role="presentation">
                  <div
                    id={`${inputId}-opt-${visible.length}`}
                    data-index={visible.length}
                    role="option"
                    aria-selected={false}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseMove={() => setActive(visible.length)}
                    onClick={() => choose(visible.length)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 border-t border-line px-4 py-2 text-sm font-medium text-gold-deep",
                      active === visible.length && "bg-ivory",
                    )}
                  >
                    <Plus className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{messages.create(trimmedQuery)}</span>
                  </div>
                </li>
              ) : null}
            </ul>
            {hidden > 0 ? (
              <p className="border-t border-line px-4 py-2 text-xs text-ink-muted">{messages.more(hidden)}</p>
            ) : null}
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {open && typing ? (itemCount === 0 ? messages.noResults : messages.results(filtered.length)) : ""}
        </p>
      </div>
    </Field>
  );
}
