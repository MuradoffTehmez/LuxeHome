import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { requireLister } from "@/lib/auth/guard";
import { DOCUMENT_STATUSES, PROPERTY_DOCUMENT_STATUSES, type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { formatLocalizedDateTime } from "@/i18n/date";
import { DocumentUploadForm } from "./document-upload-form";
import { deleteDocumentAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "account.listings.documents" });
  return buildManagedMetadata({ title: t("title"), description: t("description"), path: "/kabinet/elanlar", noIndex: true, locale });
}

const TONE = { PENDING: "warning", VERIFIED: "success", REJECTED: "danger" } as const;

/** Elanın sənəd yoxlaması (#256, PRD Modul 17): yükləmə, status və moderator qeydi. Fayl sahibə də göstərilmir. */
export default async function ListingDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = (await getLocale()) as Locale;
  const user = await requireLister(locale);
  const { id } = await params;
  const t = await getTranslations("account.listings.documents");
  const property = await prisma.property.findFirst({
    where: { id, authorId: user.id, deletedAt: null },
    select: { id: true, title: true, documentsVerifiedAt: true, dataVerifiedAt: true },
  });
  if (!property) notFound();
  const [documents, propertyT] = await Promise.all([
    prisma.propertyDocument.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, kind: true, status: true, note: true, createdAt: true },
    }),
    getTranslations("property"),
  ]);
  const kindLabel: Record<string, string> = {
    TITLE_DEED: propertyT("document.titleDeed"),
    CONTRACT: propertyT("document.contract"),
    MUNICIPAL: propertyT("document.municipal"),
    DECREE: propertyT("document.decree"),
    POWER_OF_ATTORNEY: propertyT("document.powerOfAttorney"),
    EXTRACT_COMMERCIAL: propertyT("document.commercialExtract"),
  };
  const kinds = Object.values(DOCUMENT_STATUSES)
    .filter((kind) => kind !== DOCUMENT_STATUSES.NONE)
    .map((kind) => ({ value: kind, label: kindLabel[kind] ?? kind }));

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={property.title} title={t("title")} description={t("description")} />
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge tone={property.documentsVerifiedAt ? "success" : "neutral"}>{property.documentsVerifiedAt ? t("verified") : t("notVerified")}</Badge>
        {property.dataVerifiedAt && <Badge tone="success">{t("dataVerified")}</Badge>}
      </div>
      <section className="mt-6 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
        <DocumentUploadForm propertyId={property.id} kinds={kinds} />
      </section>
      <section className="mt-6">
        <h2 className="font-sans text-lg font-semibold text-ink">{t("history")}</h2>
        {documents.length === 0 ? <p className="mt-2 text-sm text-ink-muted">{t("empty")}</p> : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-paper">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{kindLabel[document.kind] ?? document.kind}</p>
                  <p className="text-xs text-ink-muted">{formatLocalizedDateTime(document.createdAt, locale)}</p>
                  {document.note && <p className="mt-1 text-xs text-ink-soft">{t("note", { note: document.note })}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={TONE[document.status as keyof typeof TONE] ?? "neutral"}>{t(`status.${document.status as "PENDING"}`)}</Badge>
                  {document.status === PROPERTY_DOCUMENT_STATUSES.PENDING && (
                    <ConfirmAction action={deleteDocumentAction} id={document.id} label={t("delete")} title={t("deleteTitle")} description={t("deleteDescription")} confirmLabel={t("delete")}>
                      <Trash2 className="size-4" aria-hidden="true" />
                    </ConfirmAction>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
