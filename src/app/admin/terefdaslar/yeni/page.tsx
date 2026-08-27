import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/auth/permissions";
import { createPartner } from "../actions";
import { EMPTY_PARTNER } from "../form-values";
import { PartnerForm } from "../partner-form";

export const metadata: Metadata = { title: "Yeni tərəfdaş" };
export const dynamic = "force-dynamic";

export default async function NewPartnerPage() {
  const user = await requireAdminRead(PERMISSIONS.PARTNER_CREATE);
  return (
    <>
      <AdminPageHeader
        title="Yeni tərəfdaş"
        description="Public profil, tərəfdaşlıq statusu və media məlumatlarını yaradın."
        breadcrumbs={[
          { label: "Tərəfdaşlar", href: "/admin/terefdaslar" },
          { label: "Yeni tərəfdaş" },
        ]}
      />
      <PartnerForm
        action={createPartner}
        initial={EMPTY_PARTNER}
        submitLabel="Tərəfdaşı yarat"
        canManageContract={hasPermission(user.role, PERMISSIONS.PARTNER_CONTRACT_MANAGE)}
      />
    </>
  );
}
