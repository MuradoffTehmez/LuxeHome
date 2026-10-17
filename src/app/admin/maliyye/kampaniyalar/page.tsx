import type { Metadata } from "next";
import { Power } from "lucide-react";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { formatLocalizedDate } from "@/i18n/date";
import { parseCampaignMessage } from "@/lib/subscriptions/subscription-policy";
import { toggleCampaign } from "../billing-actions";
import { CampaignForm } from "../billing-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.finance.campaigns.title"), robots: { index: false, follow: false } };
}

/** Tanıtım kampaniyaları (#246, PRD 16.5): `/paketler` səhifəsində müddətli mesaj. */
export default async function CampaignsPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.BILLING_MANAGE);
  const now = new Date();
  const campaigns = await prisma.promoCampaign.findMany({ orderBy: { startsAt: "desc" }, take: 100 });

  return (
    <>
      <AdminPageHeader title={t("pages.finance.campaigns.title")} description={t("pages.finance.campaigns.description")} />
      <AdminCard title={t("pages.finance.campaigns.formTitle")}>
        <CampaignForm />
      </AdminCard>
      <AdminCard title={t("pages.finance.campaigns.listTitle")} className="mt-6">
        {campaigns.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("pages.finance.campaigns.empty")}</p>
        ) : (
          <AdminTable
            caption={t("pages.finance.campaigns.listTitle")}
            headers={[
              { label: t("pages.finance.campaigns.name") },
              { label: t("pages.finance.campaigns.messageAz") },
              { label: t("pages.finance.discounts.validity") },
              { label: t("pages.finance.subscriptions.statusLabel") },
              { label: t("pages.finance.subscriptions.actions"), srOnly: true },
            ]}
          >
            {campaigns.map((campaign) => {
              const live = campaign.isActive && campaign.startsAt <= now && campaign.endsAt > now;
              return (
                <AdminTableRow key={campaign.id}>
                  <AdminTableCell className="font-medium text-ink">{campaign.name}</AdminTableCell>
                  <AdminTableCell className="max-w-md text-sm text-ink-soft">{parseCampaignMessage(campaign.message)?.az ?? "—"}</AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-xs">
                    {formatLocalizedDate(campaign.startsAt, locale, "short")} — {formatLocalizedDate(campaign.endsAt, locale, "short")}
                  </AdminTableCell>
                  <AdminTableCell>
                    <Badge tone={live ? "success" : "neutral"}>
                      {live ? t("pages.finance.campaigns.live") : campaign.isActive ? t("pages.finance.campaigns.scheduled") : t("pages.finance.inactive")}
                    </Badge>
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <ConfirmAction
                      action={toggleCampaign}
                      id={campaign.id}
                      tone="neutral"
                      label={t("pages.finance.toggle")}
                      title={campaign.isActive ? t("pages.finance.deactivateTitle") : t("pages.finance.activateTitle")}
                      description={campaign.name}
                      confirmLabel={t("pages.finance.toggle")}
                    >
                      <Power className="size-4" />
                    </ConfirmAction>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
