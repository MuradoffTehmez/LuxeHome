"use client";

import { useTranslations } from "next-intl";

import { useId, useState } from "react";

type SeoFieldsProps = {
  initialTitle?: string | null;
  initialDescription?: string | null;
  fallbackTitle: string;
  fallbackDescription: string;
  pathname: string;
  titleName?: string;
  descriptionName?: string;
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
    <div className={`rounded-md border border-line bg-paper p-4 ${mobile ? "max-w-sm" : "w-full"}`}>
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
}: SeoFieldsProps) {
  const t = useTranslations("admin");
  const titleId = useId();
  const descriptionId = useId();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const previewTitle = title.trim() || fallbackTitle;
  const previewDescription = description.trim() || fallbackDescription;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={titleId} className="text-sm font-medium text-ink">{t("components.seo.metaTitle")}</label>
          <span className={`tabular text-xs ${title.length > 60 ? "text-danger" : "text-ink-muted"}`}>{title.length} / 60</span>
        </div>
        <input id={titleId} name={titleName} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={70} className="min-h-11 w-full rounded-xs border border-line bg-paper px-3 text-sm text-ink focus:border-gold focus:outline-none" />
        <p className="text-xs text-ink-muted">{t("components.seo.metaTitleHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={descriptionId} className="text-sm font-medium text-ink">{t("components.seo.metaDescription")}</label>
          <span className={`tabular text-xs ${description.length > 160 ? "text-danger" : "text-ink-muted"}`}>{description.length} / 160</span>
        </div>
        <textarea id={descriptionId} name={descriptionName} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} rows={4} className="w-full rounded-xs border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none" />
        <p className="text-xs text-ink-muted">{t("components.seo.metaDescriptionHint")}</p>
      </div>

      <div className="sm:col-span-2 grid gap-4 lg:grid-cols-2">
        <Preview label={t("components.seo.desktopPreview")} title={previewTitle} description={previewDescription} pathname={pathname} />
        <Preview label={t("components.seo.mobilePreview")} title={previewTitle} description={previewDescription} pathname={pathname} mobile />
      </div>
    </>
  );
}
