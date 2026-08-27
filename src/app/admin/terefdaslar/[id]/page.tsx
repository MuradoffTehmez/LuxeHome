import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ButtonLink } from "@/components/ui/button";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getAdminPartnerById,
  getAdminPartnerRelations,
  getPartnerRelationOptions,
} from "@/lib/queries";
import { deletePartner, updatePartner } from "../actions";
import type { PartnerFormValues } from "../form-values";
import { PartnerForm } from "../partner-form";
import { PartnerRelationsManager } from "../partner-relations-manager";

export const metadata: Metadata = { title: "Tərəfdaşı redaktə et" };
export const dynamic = "force-dynamic";

function dateInput(value: Date | null | undefined): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function image(value: string | null | undefined, alt: string) {
  return value ? [{ url: value, alt, isCover: true }] : [];
}

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminRead(PERMISSIONS.PARTNER_UPDATE);
  const { id } = await params;
  const canManageContract = hasPermission(user.role, PERMISSIONS.PARTNER_CONTRACT_MANAGE);
  const canManageRelations = hasPermission(user.role, PERMISSIONS.PARTNER_RELATION_MANAGE);

  const partner = await getAdminPartnerById(id, canManageContract);
  if (!partner) notFound();

  const initial: PartnerFormValues = {
    id: partner.id,
    name: partner.name,
    legalName: partner.legalName ?? "",
    slug: partner.slug,
    partnershipType: partner.partnershipType,
    status: partner.status,
    shortDescription: partner.shortDescription ?? "",
    shortDescriptionEn: partner.shortDescriptionEn ?? "",
    shortDescriptionRu: partner.shortDescriptionRu ?? "",
    description: partner.description ?? "",
    descriptionEn: partner.descriptionEn ?? "",
    descriptionRu: partner.descriptionRu ?? "",
    disclaimer: partner.disclaimer ?? "",
    disclaimerEn: partner.disclaimerEn ?? "",
    disclaimerRu: partner.disclaimerRu ?? "",
    websiteUrl: partner.websiteUrl ?? "",
    email: partner.email ?? "",
    phone: partner.phone ?? "",
    whatsapp: partner.whatsapp ?? "",
    country: partner.country ?? "",
    city: partner.city ?? "",
    address: partner.address ?? "",
    verified: partner.verified,
    officialPartner: partner.officialPartner,
    featured: partner.featured,
    showPublicly: partner.showPublicly,
    showOnHomepage: partner.showOnHomepage,
    officialSince: dateInput(partner.officialSince),
    partnershipEndDate: dateInput(partner.partnershipEndDate),
    sortOrder: String(partner.sortOrder),
    seoTitle: partner.seoTitle ?? "",
    seoDescription: partner.seoDescription ?? "",
    seoKeywords: partner.seoKeywords ?? "",
    ogImage: partner.ogImage ?? "",
    logo: image(partner.logoUrl, `${partner.name} loqosu`),
    logoLight: image(partner.logoLight, `${partner.name} açıq tema loqosu`),
    logoDark: image(partner.logoDark, `${partner.name} tünd tema loqosu`),
    coverImage: image(partner.coverImage, `${partner.name} üz qabığı`),
    contractNumber: "contractNumber" in partner ? (partner.contractNumber ?? "") : "",
    contractStartDate: "contractStartDate" in partner ? dateInput(partner.contractStartDate) : "",
    contractEndDate: "contractEndDate" in partner ? dateInput(partner.contractEndDate) : "",
    contractDocument: "contractDocument" in partner ? (partner.contractDocument ?? "") : "",
    internalNotes: "internalNotes" in partner ? (partner.internalNotes ?? "") : "",
  };

  const relationData = canManageRelations
    ? await Promise.all([getAdminPartnerRelations(id), getPartnerRelationOptions()])
    : null;

  return (
    <>
      <AdminPageHeader
        title={partner.name}
        description="Profil, status, media, SEO və daxili tərəfdaşlıq məlumatlarını idarə edin."
        breadcrumbs={[
          { label: "Tərəfdaşlar", href: "/admin/terefdaslar" },
          { label: partner.name },
        ]}
        actions={
          partner.showPublicly ? (
            <ButtonLink href={`/terefdaslar/${partner.slug}`} target="_blank" variant="outline" size="sm">
              Saytda bax <ExternalLink className="size-4" aria-hidden="true" />
            </ButtonLink>
          ) : null
        }
      />

      <PartnerForm
        action={updatePartner}
        initial={initial}
        submitLabel="Dəyişiklikləri saxla"
        canManageContract={canManageContract}
        extraActions={
          hasPermission(user.role, PERMISSIONS.PARTNER_DELETE) ? (
            <ConfirmAction
              action={deletePartner}
              id={partner.id}
              label={`«${partner.name}» tərəfdaşını sil`}
              title="Tərəfdaşı silmək"
              description="Qeyd soft-delete ediləcək, public profili və badge-ləri dərhal gizlənəcək."
              redirectTo="/admin/terefdaslar"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </ConfirmAction>
          ) : null
        }
      />

      {relationData ? (
        <AdminCard
          title="Elan, layihə və agentlik əlaqələri"
          description="Bir qeyd üçün müxtəlif rollarda birdən çox tərəfdaş saxlanıla bilər."
          className="mt-8"
        >
          <PartnerRelationsManager partnerId={id} relations={relationData[0]} options={relationData[1]} />
        </AdminCard>
      ) : null}

      <p className="mt-6 text-xs text-ink-muted">
        Son yenilənmə: {partner.updatedAt.toLocaleString("az-AZ")}. Audit qeydləri{" "}
        <Link href={`/admin/audit?entity=Partner&q=${partner.id}`} className="underline hover:text-ink">
          audit jurnalında
        </Link>{" "}
        saxlanılır.
      </p>
    </>
  );
}
