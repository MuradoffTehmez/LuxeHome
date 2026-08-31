import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/auth/permissions";
import { createPartner } from "../actions";
import { EMPTY_PARTNER } from "../form-values";
import { PartnerForm } from "../partner-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.partners.yeniTerefdas") };
}
export const dynamic = "force-dynamic";

export default async function NewPartnerPage() {
  const t = await getAdminT();
  const user = await requireAdminRead(PERMISSIONS.PARTNER_CREATE);
  return (
    <>
      <AdminPageHeader
        title={t("pages.partners.yeniTerefdas")}
        description={t("pages.partners.publicProfilTerefdasliqStatusu")}
        breadcrumbs={[
          { label: t("pages.partners.terefdaslar"), href: "/admin/terefdaslar" },
          { label: t("pages.partners.yeniTerefdas") },
        ]}
      />
      <PartnerForm
        action={createPartner}
        initial={EMPTY_PARTNER}
        submitLabel={t("pages.partners.terefdasiYarat")}
        canManageContract={hasPermission(user.role, PERMISSIONS.PARTNER_CONTRACT_MANAGE)}
      />
    </>
  );
}
