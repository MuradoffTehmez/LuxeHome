"use client";

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

const TOOLS: Tool[][] = [
  [
    { label: "Abzas", icon: Pilcrow, wrap: ["<p>", "</p>"] },
    { label: "Qalın", icon: Bold, wrap: ["<strong>", "</strong>"] },
    { label: "Kursiv", icon: Italic, wrap: ["<em>", "</em>"] },
    { label: "Link", icon: Link2, wrap: ['<a href="https://">', "</a>"] },
  ],
  [
    { label: "Başlıq 2", icon: Heading2, wrap: ["<h2>", "</h2>"] },
    { label: "Başlıq 3", icon: Heading3, wrap: ["<h3>", "</h3>"] },
    { label: "Sitat", icon: Quote, wrap: ["<blockquote>", "</blockquote>"] },
  ],
  [
    { label: "Nişanlı siyahı", icon: List, wrap: ["<ul>\n  <li>", "</li>\n</ul>"] },
    { label: "Nömrəli siyahı", icon: ListOrdered, wrap: ["<ol>\n  <li>", "</li>\n</ol>"] },
  ],
];

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
  placeholder = "Məqalənin mətnini bura yazın…",
  rows = 18,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const error = useFieldError(name);
  const editorId = `editor-${name}`;

  function apply(tool: Tool) {
    const textarea = ref.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || tool.sample || "mətn";
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
          {TOOLS.map((group, groupIndex) => (
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
              title="Təkrarla"
              aria-label="Təkrarla"
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
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${editorId}-error` : undefined}
          className="w-full resize-y bg-paper px-4 py-3 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-muted"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-ivory px-4 py-2 text-xs text-ink-muted">
          <span>HTML dəstəklənir — yalnız icazəli teqlər saxlanılır</span>
          <span className="tabular">
            {words} söz · təxminən {minutes} dəq oxu
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
