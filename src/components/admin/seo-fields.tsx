"use client";

import { useTranslations } from "next-intl";

import { useId, useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { suggestSeo } from "@/app/admin/serp/ai-actions";

/** AI təklifinin yazıldığı əlavə sahələr (formada varsa). */
const EXTRA_FIELDS = ["ogTitle", "ogDescription", "metaKeywords", "socialText"] as const;
/** Məzmun başlığı və mətni — forma növündən asılı olmayaraq ad üzrə axtarılır. */
const TITLE_FIELDS = ["title", "name"];
const BODY_FIELDS = ["description", "content", "excerpt", "summary", "body"];

function fieldValue(form: HTMLFormElement, names: readonly string[]): string {
  for (const name of names) {
    const element = form.elements.namedItem(name);
    const value = element && "value" in element ? String(element.value ?? "") : "";
    if (value.trim()) return value;
  }
  return "";
}

/** İdarə olunan və olunmayan sahəyə eyni yolla dəyər yazır (React `onChange` də işləyir). */
function setFieldValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

type SeoFieldsProps = {
  initialTitle?: string | null;
  initialDescription?: string | null;
  fallbackTitle: string;
  fallbackDescription: string;
  pathname: string;
  titleName?: string;
  descriptionName?: string;
  /**
   * «AI ilə doldur» düyməsi: redaktor SEO başlığını yazır, qalan meta, Open Graph,
   * açar söz və sosial mətn təklif olunur. Dəyər icazəni seçir: property | project |
   * service | blog | knowledge | page.
   */
  aiKind?: string;
};

function Preview({
  label,
  title,
  description,
  pathname,
  mobile = false,
}: {
  label: string;
  title: string;
  description: string;
  pathname: string;
  mobile?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-line bg-paper p-4 shadow-xs ${mobile ? "max-w-sm" : "w-full"}`}>
      <p className="mb-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</p>
      <p className="truncate text-xs text-success">luxehomeestate.az{pathname}</p>
      <p className={`mt-1 font-medium text-info ${mobile ? "text-lg" : "text-xl"}`}>{title}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-soft">{description}</p>
    </div>
  );
}

export function SeoFields({
  initialTitle,
  initialDescription,
  fallbackTitle,
  fallbackDescription,
  pathname,
  titleName = "metaTitle",
  descriptionName = "metaDescription",
  aiKind,
}: SeoFieldsProps) {
  const t = useTranslations("admin");
  const titleId = useId();
  const descriptionId = useId();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [pending, startTransition] = useTransition();
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [extras, setExtras] = useState<{ keywords: string; socialText: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  function fillWithAi() {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const contentTitle = fieldValue(form, TITLE_FIELDS.filter((name) => name !== titleName));
    const body = fieldValue(form, BODY_FIELDS.filter((name) => name !== descriptionName));
    startTransition(async () => {
      const result = await suggestSeo({ kind: aiKind ?? "page", seoTitle: title, title: contentTitle, body });
      if (!result.ok) {
        setAiStatus(result.error === "empty" ? t("components.seo.aiEmpty") : t("components.seo.aiForbidden"));
        return;
      }
      const { copy } = result;
      const extraElements = EXTRA_FIELDS.map((name) => ({
        name,
        element: form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null,
      })).filter((item) => item.element && "value" in item.element);
      // Bütün sahələr artıq doludursa ikinci klik hamısını yeniləyir; əks halda yalnız boşlar dolur.
      const overwrite = Boolean(title.trim() && description.trim()) && extraElements.every((item) => item.element!.value.trim());
      let filled = 0;
      if (!title.trim() || overwrite) {
        setTitle(copy.metaTitle);
        filled += 1;
      }
      if (!description.trim() || overwrite) {
        setDescription(copy.metaDescription);
        filled += 1;
      }
      const values: Record<(typeof EXTRA_FIELDS)[number], string> = {
        ogTitle: copy.ogTitle,
        ogDescription: copy.ogDescription,
        metaKeywords: copy.keywords.join(", "),
        socialText: copy.socialText,
      };
      for (const { name, element } of extraElements) {
        if (!element!.value.trim() || overwrite) {
          setFieldValue(element!, values[name]);
          filled += 1;
        }
      }
      const present = new Set(extraElements.map((item) => item.name));
      setExtras(
        present.has("metaKeywords") && present.has("socialText")
          ? null
          : { keywords: values.metaKeywords, socialText: values.socialText },
      );
      setAiStatus(
        result.source === "ai"
          ? t("components.seo.aiDone", { count: filled })
          : t("components.seo.aiFallback", { count: filled }),
      );
    });
  }
  const previewTitle = title.trim() || fallbackTitle;
  const previewDescription = description.trim() || fallbackDescription;

  return (
    <>
      {aiKind && (
        <div ref={rootRef} className="flex flex-col gap-2 rounded-lg border border-gold/30 bg-gold/5 p-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">{t("components.seo.aiHint")}</p>
          <button
            type="button"
            onClick={fillWithAi}
            disabled={pending}
            aria-busy={pending || undefined}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm border border-gold bg-paper px-4 text-sm font-medium text-ink transition-colors hover:bg-gold/10 disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4 text-gold-deep" aria-hidden="true" />}
            {pending ? t("components.seo.aiWorking") : t("components.seo.aiFill")}
          </button>
          {aiStatus && (
            <p role="status" className="text-xs text-ink-muted sm:basis-full">
              {aiStatus}
            </p>
          )}
        </div>
      )}
      {!aiKind && <div ref={rootRef} hidden />}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={titleId} className="text-sm font-medium text-ink">{t("components.seo.metaTitle")}</label>
          <span className={`tabular text-xs ${title.length > 60 ? "text-danger" : "text-ink-muted"}`}>{title.length} / 60</span>
        </div>
        <input id={titleId} name={titleName} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={70} className="min-h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-ink focus:border-gold focus:outline-none" />
        <p className="text-xs text-ink-muted">{t("components.seo.metaTitleHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={descriptionId} className="text-sm font-medium text-ink">{t("components.seo.metaDescription")}</label>
          <span className={`tabular text-xs ${description.length > 160 ? "text-danger" : "text-ink-muted"}`}>{description.length} / 160</span>
        </div>
        <textarea id={descriptionId} name={descriptionName} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} rows={4} className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none" />
        <p className="text-xs text-ink-muted">{t("components.seo.metaDescriptionHint")}</p>
      </div>

      {extras && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-ivory p-3 text-sm sm:col-span-2">
          <p>
            <span className="font-medium text-ink">{t("components.seo.keywords")}: </span>
            <span className="text-ink-soft">{extras.keywords}</span>
          </p>
          <p>
            <span className="font-medium text-ink">{t("components.seo.socialText")}: </span>
            <span className="text-ink-soft">{extras.socialText}</span>
          </p>
        </div>
      )}

      <div className="sm:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Preview label={t("components.seo.desktopPreview")} title={previewTitle} description={previewDescription} pathname={pathname} />
        <Preview label={t("components.seo.mobilePreview")} title={previewTitle} description={previewDescription} pathname={pathname} mobile />
      </div>
    </>
  );
}
