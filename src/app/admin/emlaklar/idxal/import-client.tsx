"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Download, FileUp, TriangleAlert } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { useServerMessage } from "@/components/admin/use-server-message";
import { csvCell } from "@/lib/admin/csv";
import { IMPORT_BATCH_SIZE, IMPORT_COLUMNS, type ImportIssue } from "@/lib/admin/property-import";
import {
  commitPropertyImport,
  previewPropertyImport,
  type ImportCommitRow,
  type ImportPreviewRow,
} from "./actions";

const TEMPLATE_ROW: Record<string, string> = {
  title: "Nərimanovda 3 otaqlı təmirli mənzil",
  description: "28 May metrosuna 7 dəqiqəlik məsafədə, kupçalı, əla təmirli mənzil.",
  listing_type: "SALE",
  price: "185000",
  currency: "AZN",
  price_period: "",
  type: "menziller",
  city: "Bakı",
  district: "Nərimanov",
  metro: "28 May",
  address: "Əliyar Əliyev küç.",
  rooms: "3",
  area: "95",
  land_area: "",
  floor: "7",
  total_floors: "16",
  renovation: "RENOVATED",
  document: "TITLE_DEED",
  building_type: "NEW",
  latitude: "",
  longitude: "",
  video_url: "",
  features: "lift|parking",
  images: "https://example.com/foto-1.jpg|https://example.com/foto-2.jpg",
};

/** Rate limit (dəqiqədə 60 yazma) aşılanda partiya bir az gözləyib təkrarlanır. */
const RETRY_DELAY_MS = 20_000;
const MAX_RETRIES = 3;

function downloadTemplate() {
  const header = IMPORT_COLUMNS.map((column) => column.key);
  const body = header.map((column) => csvCell(TEMPLATE_ROW[column] ?? ""));
  // BOM — Excel UTF-8-i (ə, ş, ğ) düzgün açsın.
  const blob = new Blob([`﻿${header.join(",")}\n${body.join(",")}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "luxehome-elan-idxal-sablonu.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PropertyImportClient() {
  const t = useTranslations("admin");
  const translate = useServerMessage();
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [headerErrors, setHeaderErrors] = useState<ImportIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportCommitRow[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [previewing, startPreview] = useTransition();
  const [importing, setImporting] = useState(false);

  const issueText = (issue: ImportIssue) => {
    const base = t(`pages.propertyImport.issues.${issue.code}` as Parameters<typeof t>[0], {
      field: issue.field ?? "",
      value: issue.value ?? "",
    });
    return issue.message ? `${base}: ${issue.message}` : base;
  };

  async function onFile(file: File | undefined) {
    setError(null);
    setResults([]);
    setProgress(null);
    setPreview(null);
    setHeaderErrors([]);
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    startPreview(async () => {
      const result = await previewPropertyImport(text);
      if (!result.ok) {
        setError(translate(result.error) ?? result.error);
        return;
      }
      setHeaderErrors(result.headerErrors);
      setPreview(result.rows);
    });
  }

  const validLines = (preview ?? []).filter((row) => row.errors.length === 0).map((row) => row.line);

  async function runImport() {
    if (!csv || validLines.length === 0) return;
    setImporting(true);
    setError(null);
    setResults([]);
    setProgress({ done: 0, total: validLines.length });
    const collected: ImportCommitRow[] = [];
    try {
      for (let start = 0; start < validLines.length; start += IMPORT_BATCH_SIZE) {
        const batch = validLines.slice(start, start + IMPORT_BATCH_SIZE);
        let attempt = 0;
        for (;;) {
          const result = await commitPropertyImport(csv, batch);
          if (result.ok) {
            collected.push(...result.rows);
            break;
          }
          attempt += 1;
          if (attempt > MAX_RETRIES) throw new Error(translate(result.error) ?? result.error);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
        setResults([...collected]);
        setProgress({ done: Math.min(start + batch.length, validLines.length), total: validLines.length });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setImporting(false);
    }
  }

  const created = results.filter((row) => row.status === "created");
  const duplicates = results.filter((row) => row.status === "duplicate").length;
  const failed = results.filter((row) => row.status === "failed" || row.status === "invalid").length;
  const imagesFailed = created.reduce((sum, row) => sum + (row.imagesFailed ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-line bg-paper p-5 shadow-xs">
        <h2 className="text-base font-semibold text-ink">{t("pages.propertyImport.step1")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("pages.propertyImport.step1Help")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="size-4" aria-hidden="true" />
            {t("pages.propertyImport.downloadTemplate")}
          </Button>
        </div>
        <details className="mt-4 text-sm">
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-ink">{t("pages.propertyImport.columnsTitle")}</summary>
          <div className="relative mt-2 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-xs text-ink-muted">
                <tr>
                  <th className="py-2 pr-4 font-medium">{t("pages.propertyImport.column")}</th>
                  <th className="py-2 pr-4 font-medium">{t("pages.propertyImport.requiredLabel")}</th>
                  <th className="py-2 font-medium">{t("pages.propertyImport.columnHelp")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {IMPORT_COLUMNS.map((column) => (
                  <tr key={column.key}>
                    <td className="py-2 pr-4 font-mono text-xs text-ink">{column.key}</td>
                    <td className="py-2 pr-4 text-ink-soft">{column.required ? t("pages.propertyImport.yes") : "—"}</td>
                    <td className="py-2 text-ink-soft">{t(`pages.propertyImport.columns.${column.key}` as Parameters<typeof t>[0])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="rounded-xl border border-line bg-paper p-5 shadow-xs">
        <h2 className="text-base font-semibold text-ink">{t("pages.propertyImport.step2")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("pages.propertyImport.step2Help")}</p>
        <label className={`${buttonClassName("primary", "sm")} mt-4 cursor-pointer`}>
          <FileUp className="size-4" aria-hidden="true" />
          {t("pages.propertyImport.chooseFile")}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={previewing || importing}
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
        {fileName ? <p className="mt-2 text-sm text-ink-soft">{fileName}</p> : null}
        {previewing ? <p className="mt-3 text-sm text-ink-muted" role="status">{t("pages.propertyImport.checking")}</p> : null}
        {error ? (
          <p className="mt-3 flex items-start gap-2 rounded-sm bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        {headerErrors.length > 0 ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-danger" role="alert">
            {headerErrors.map((issue, index) => <li key={index}>{issueText(issue)}</li>)}
          </ul>
        ) : null}
      </section>

      {preview ? (
        <section className="rounded-xl border border-line bg-paper shadow-xs">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink">{t("pages.propertyImport.step3")}</h2>
              <p className="text-sm text-ink-muted">
                {t("pages.propertyImport.summary", { total: preview.length, valid: validLines.length, invalid: preview.length - validLines.length })}
              </p>
            </div>
            <Button type="button" size="sm" loading={importing} disabled={validLines.length === 0 || importing || results.length > 0} onClick={() => void runImport()}>
              {t("pages.propertyImport.importButton", { count: validLines.length })}
            </Button>
          </header>

          {progress ? (
            <div className="border-b border-line px-5 py-4" role="status">
              <div className="h-2 overflow-hidden rounded-full bg-beige">
                <div className="h-full bg-gold transition-[width]" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {t("pages.propertyImport.progress", { done: progress.done, total: progress.total })}
              </p>
              {!importing && results.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {t("pages.propertyImport.resultCreated", { count: created.length })}
                  </span>
                  {duplicates > 0 ? <span className="text-ink-muted">{t("pages.propertyImport.resultDuplicates", { count: duplicates })}</span> : null}
                  {failed > 0 ? <span className="text-danger">{t("pages.propertyImport.resultFailed", { count: failed })}</span> : null}
                  {imagesFailed > 0 ? <span className="text-warning">{t("pages.propertyImport.resultImagesFailed", { count: imagesFailed })}</span> : null}
                  <Link href="/admin/emlaklar?status=DRAFT" className="font-medium text-gold-deep underline-offset-4 hover:underline">
                    {t("pages.propertyImport.openDrafts")}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-ivory text-xs text-ink-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">{t("pages.propertyImport.line")}</th>
                  <th className="px-3 py-2 font-medium">{t("pages.propertyImport.titleColumn")}</th>
                  <th className="px-3 py-2 font-medium">{t("pages.propertyImport.images")}</th>
                  <th className="px-5 py-2 font-medium">{t("pages.propertyImport.state")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.map((row) => {
                  const result = results.find((item) => item.line === row.line);
                  return (
                    <tr key={row.line} className="align-top">
                      <td className="px-5 py-3 tabular text-ink-muted">{row.line}</td>
                      <td className="max-w-[22rem] px-3 py-3 text-ink [overflow-wrap:anywhere]">{row.title || "—"}</td>
                      <td className="px-3 py-3 tabular text-ink-soft">{row.imageCount}</td>
                      <td className="px-5 py-3">
                        {result ? (
                          <span className={result.status === "created" ? "text-success" : result.status === "duplicate" ? "text-ink-muted" : "text-danger"}>
                            {t(`pages.propertyImport.status.${result.status}` as Parameters<typeof t>[0])}
                          </span>
                        ) : row.errors.length === 0 ? (
                          <span className="text-success">{t("pages.propertyImport.ready")}</span>
                        ) : (
                          <ul className="flex flex-col gap-1 text-danger">
                            {row.errors.map((issue, index) => <li key={index}>{issueText(issue)}</li>)}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
