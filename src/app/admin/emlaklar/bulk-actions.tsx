"use client";

import { useActionState, useEffect, useRef } from "react";
import { Archive, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { bulkUpdateProperties } from "./actions";

/**
 * Siyahını bütöv əhatə edən forma.
 *
 * Checkbox-lar `{children}` daxilində server tərəfdə render olunur (hər sətirdə
 * `name="ids"`) — bu komponent yalnız formu və toolbar-ı verir, seçim vəziyyətini
 * DOM-un öz checkbox state-inə buraxır ki, server komponenti client-ə çevirmək
 * lazım gəlməsin.
 */
export function BulkActionsForm({
  mode,
  children,
}: {
  mode: "active" | "deleted";
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(bulkUpdateProperties, IDLE_STATE);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    // Uğurlu əməliyyatdan sonra seçim təmizlənsin — köhnə seçim yeni siyahıda çaşdırmasın
    if (state.status === "success") {
      formRef.current
        ?.querySelectorAll<HTMLInputElement>('input[name="ids"]')
        .forEach((box) => {
          box.checked = false;
        });
    }
  }, [state, toast]);

  function toggleAll(event: React.ChangeEvent<HTMLInputElement>) {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[name="ids"]')
      .forEach((box) => {
        box.checked = event.target.checked;
      });
  }

  return (
    <form ref={formRef} action={formAction}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-beige/40 px-4 py-2.5 lg:px-5">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft">
          <input
            type="checkbox"
            onChange={toggleAll}
            className="size-4 rounded-xs border-line-strong accent-gold"
          />
          Hamısını seç
        </label>

        <div className="flex flex-wrap items-center gap-1">
          {mode === "active" ? (
            <>
              <button
                type="submit"
                name="intent"
                value="publish"
                className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xs px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-beige hover:text-success"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Dərc et
              </button>
              <button
                type="submit"
                name="intent"
                value="archive"
                className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xs px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-beige hover:text-ink"
              >
                <Archive className="size-3.5" aria-hidden="true" />
                Arxivlə
              </button>
              <button
                type="submit"
                name="intent"
                value="delete"
                className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xs px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-danger-bg hover:text-danger"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Sil
              </button>
            </>
          ) : (
            <button
              type="submit"
              name="intent"
              value="restore"
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xs px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-beige hover:text-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Bərpa et
            </button>
          )}
        </div>
      </div>

      {children}
    </form>
  );
}

export function RowCheckbox({ id }: { id: string }) {
  return (
    <input
      type="checkbox"
      name="ids"
      value={id}
      aria-label="Seç"
      onClick={(event) => event.stopPropagation()}
      className="size-4 shrink-0 rounded-xs border-line-strong accent-gold"
    />
  );
}
