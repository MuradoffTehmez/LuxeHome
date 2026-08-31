"use client";

import { useTranslations } from "next-intl";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFieldError } from "./form-shell";

type Tool = {
  label: string;
  icon: typeof Bold;
  /** Seçilmiş mətnin əvvəlinə və sonuna əlavə olunan teqlər. */
  wrap: [string, string];
  /** Seçim boş olduqda yerləşdirilən nümunə mətn. */
  sample?: string;
};

type Translate = ReturnType<typeof useTranslations<"admin">>;

/**
 * Alət sətri dilə bağlıdır, ona görə modul səviyyəsində sabit kimi saxlanmır —
 * `t` yalnız komponent daxilində mövcuddur.
 */
function buildTools(t: Translate): Tool[][] {
  return [
    [
      { label: t("components.editor.paragraph"), icon: Pilcrow, wrap: ["<p>", "</p>"] },
      { label: t("components.editor.bold"), icon: Bold, wrap: ["<strong>", "</strong>"] },
      { label: t("components.editor.italic"), icon: Italic, wrap: ["<em>", "</em>"] },
      { label: t("components.editor.link"), icon: Link2, wrap: ['<a href="https://">', "</a>"] },
    ],
    [
      { label: t("components.editor.heading2"), icon: Heading2, wrap: ["<h2>", "</h2>"] },
      { label: t("components.editor.heading3"), icon: Heading3, wrap: ["<h3>", "</h3>"] },
      { label: t("components.editor.quote"), icon: Quote, wrap: ["<blockquote>", "</blockquote>"] },
    ],
    [
      { label: t("components.editor.bulletList"), icon: List, wrap: ["<ul>\n  <li>", "</li>\n</ul>"] },
      { label: t("components.editor.numberedList"), icon: ListOrdered, wrap: ["<ol>\n  <li>", "</li>\n</ol>"] },
    ],
  ];
}

/**
 * Məqalə mətni üçün HTML redaktoru.
 *
 * Sadə `textarea` üzərində qurulub — xarici kitabxana tələb etmir və Server
 * Component-lərlə problemsiz işləyir. Alətlər seçilmiş mətni HTML teqlərinə bükür.
 *
 * WYSIWYG (contentEditable) qəsdən seçilməyib: brauzerlərin `execCommand` çıxışı
 * fərqli və çirkli HTML verir, nəticəni sonradan təmizləmək daha çətin olur.
 * Mətn saxlanmazdan əvvəl serverdə `sanitizeRichText()` ilə ağ siyahı üzrə süzülür,
 * ona görə burada yazılan istənilən teq bazaya olduğu kimi düşmür.
 */
export function ContentEditor({
  name,
  label,
  defaultValue = "",
  placeholder,
  rows = 18,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  const t = useTranslations("admin");
  const tools = buildTools(t);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const error = useFieldError(name);
  const editorId = `editor-${name}`;

  function apply(tool: Tool) {
    const textarea = ref.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || tool.sample || t("components.editor.sampleText");
    const replacement = `${tool.wrap[0]}${selected}${tool.wrap[1]}`;

    setValue(value.slice(0, selectionStart) + replacement + value.slice(selectionEnd));

    // Dəyişiklikdən sonra fokus mətn sahəsində qalır və kursor bağlayan teqdən əvvəl durur
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = selectionStart + tool.wrap[0].length + selected.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  const plain = value.replace(/<[^>]*>/g, " ").trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={editorId} className="text-sm font-medium text-ink">
        {label}
        <span className="ml-1 text-danger" aria-hidden="true">
          *
        </span>
      </label>

      <div
        className={cn(
          "overflow-hidden rounded-xs border bg-paper focus-within:border-gold",
          error ? "border-danger" : "border-line-strong",
        )}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-ivory px-2 py-1.5">
          {tools.map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center gap-0.5">
              {groupIndex > 0 && <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />}
              {group.map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  onClick={() => apply(tool)}
                  title={tool.label}
                  aria-label={tool.label}
                  className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors duration-200 hover:bg-beige hover:text-ink"
                >
                  <tool.icon className="size-4" aria-hidden="true" />
                </button>
              ))}
            </div>
          ))}

          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => document.execCommand("undo")}
              title="Geri al"
              aria-label="Geri al"
              className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors duration-200 hover:bg-beige hover:text-ink"
            >
              <Undo2 className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => document.execCommand("redo")}
              title={t("components.editor.redo")}
              aria-label={t("components.editor.redo")}
              className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors duration-200 hover:bg-beige hover:text-ink"
            >
              <Redo2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* `focus:outline-none` yazılmır — fokus konturu sarğıdakı border ilə görünür */}
        <textarea
          ref={ref}
          id={editorId}
          name={name}
          rows={rows}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder ?? t("components.editor.placeholder")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${editorId}-error` : undefined}
          className="w-full resize-y bg-paper px-4 py-3 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-muted"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-ivory px-4 py-2 text-xs text-ink-muted">
          <span>{t("components.editor.htmlNote")}</span>
          <span className="tabular">
            {t("components.editor.readStats", { words, minutes })}
          </span>
        </div>
      </div>

      {error && (
        <p
          id={`${editorId}-error`}
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
