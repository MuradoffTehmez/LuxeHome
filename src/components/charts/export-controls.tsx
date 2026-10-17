"use client";

import { Download, Printer } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

/**
 * Hesabat ixracı (#238, PRD 11.6): CSV və Excel endpoint-dən yüklənir (giriş serverdə yoxlanılır),
 * PDF isə brauzerin çap pəncərəsindən «PDF kimi saxla» ilə — səhifənin çap üslubu menyunu gizlədir.
 */
export function ExportControls({ csvHref, xlsxHref, labels }: { csvHref: string; xlsxHref: string; labels: { title: string; csv: string; xlsx: string; pdf: string; pdfHint: string } }) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2" role="group" aria-label={labels.title}>
      <span className="text-xs font-medium text-ink-muted">{labels.title}</span>
      <a href={csvHref} className={buttonClassName("outline", "sm")} download>
        <Download className="size-4" aria-hidden="true" />
        {labels.csv}
      </a>
      <a href={xlsxHref} className={buttonClassName("outline", "sm")} download>
        <Download className="size-4" aria-hidden="true" />
        {labels.xlsx}
      </a>
      <button type="button" onClick={() => window.print()} className={buttonClassName("outline", "sm")} title={labels.pdfHint}>
        <Printer className="size-4" aria-hidden="true" />
        {labels.pdf}
      </button>
    </div>
  );
}
