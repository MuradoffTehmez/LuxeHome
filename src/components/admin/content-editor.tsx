"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = {
  label: string;
  icon: typeof Bold;
  /** Seçilmiş mətnin əvvəlinə və sonuna əlavə olunan işarələr. */
  wrap: [string, string];
  /** Sətir başlanğıcına qoyulan prefiks (başlıq, siyahı, sitat). */
  prefix?: string;
};

const TOOLS: Tool[][] = [
  [
    { label: "Qalın", icon: Bold, wrap: ["**", "**"] },
    { label: "Kursiv", icon: Italic, wrap: ["*", "*"] },
    { label: "Link", icon: Link2, wrap: ["[", "](https://)"] },
  ],
  [
    { label: "Başlıq 2", icon: Heading2, wrap: ["", ""], prefix: "## " },
    { label: "Başlıq 3", icon: Heading3, wrap: ["", ""], prefix: "### " },
    { label: "Sitat", icon: Quote, wrap: ["", ""], prefix: "> " },
  ],
  [
    { label: "Nişanlı siyahı", icon: List, wrap: ["", ""], prefix: "- " },
    { label: "Nömrəli siyahı", icon: ListOrdered, wrap: ["", ""], prefix: "1. " },
  ],
];

/**
 * Məqalə mətni üçün Markdown redaktoru.
 *
 * Sadə `textarea` üzərində qurulub — xarici kitabxana tələb etmir və Server
 * Component-lərlə problemsiz işləyir. Alətlər seçilmiş mətnə Markdown işarələri
 * əlavə edir.
 *
 * TODO: Backend mərhələsində mətn `BlogPost.content` sahəsinə yazılacaq və
 *       ictimai səhifədə Markdown → HTML çevrilməsi lazım olacaq.
 */
export function ContentEditor({
  name,
  label,
  defaultValue = "",
  placeholder = "Məqalənin mətnini bura yazın…",
  rows = 16,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);

  function apply(tool: Tool) {
    const textarea = ref.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);

    const replacement = tool.prefix
      ? `${tool.prefix}${selected || "Mətn"}`
      : `${tool.wrap[0]}${selected || "mətn"}${tool.wrap[1]}`;

    const next =
      value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);
    setValue(next);

    // Dəyişiklikdən sonra fokus mətn sahəsində qalır
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = selectionStart + replacement.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`editor-${name}`} className="text-sm font-medium text-ink">
        {label}
      </label>

      <div className="overflow-hidden rounded-xs border border-line-strong bg-paper focus-within:border-gold">
        {/* Alət paneli */}
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-ivory px-2 py-1.5">
          {TOOLS.map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center gap-0.5">
              {groupIndex > 0 && (
                <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
              )}
              {group.map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  onClick={() => apply(tool)}
                  title={tool.label}
                  aria-label={tool.label}
                  className="grid size-9 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors duration-200 hover:bg-beige hover:text-ink"
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
              className="grid size-9 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors duration-200 hover:bg-beige hover:text-ink"
            >
              <Undo2 className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => document.execCommand("redo")}
              title="Təkrarla"
              aria-label="Təkrarla"
              className="grid size-9 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors duration-200 hover:bg-beige hover:text-ink"
            >
              <Redo2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <textarea
          ref={ref}
          id={`editor-${name}`}
          name={name}
          rows={rows}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full resize-y bg-paper px-4 py-3 font-mono text-sm leading-relaxed text-ink",
            "placeholder:text-ink-muted focus:outline-none",
          )}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-ivory px-4 py-2 text-xs text-ink-muted">
          <span>Markdown dəstəklənir</span>
          <span className="tabular">
            {words} söz · təxminən {minutes} dəq oxu
          </span>
        </div>
      </div>
    </div>
  );
}
