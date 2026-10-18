import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-ui";
import { getAdminT } from "@/lib/admin-i18n";
import { getPlatformIndicators } from "@/lib/admin/platform-indicators";

const number = new Intl.NumberFormat("en-US");

/** Platforma və risk göstəriciləri (#260, PRD Modul 19 «Dashboard») — hər göstərici öz növbəsinə aparır. */
export async function PlatformIndicatorsCard() {
  const [t, data] = await Promise.all([getAdminT(), getPlatformIndicators()]);
  const items = [
    { key: "newUsers", value: data.newUsers, href: "/admin/istifadeciler" },
    { key: "newListings", value: data.newListings, href: "/admin/emlaklar" },
    { key: "activeAgencies", value: data.activeAgencies, href: "/admin/agentlikler" },
    { key: "openReports", value: data.openReports, href: "/admin/sikayetler", alert: data.openReports > 0 },
    { key: "riskyListings", value: data.riskyListings, href: "/admin/emlaklar?gorunus=subheli", alert: data.riskyListings > 0 },
    { key: "riskyAccounts", value: data.riskyAccounts, href: "/admin/etibarliliq", alert: data.riskyAccounts > 0 },
    { key: "activeRestrictions", value: data.activeRestrictions, href: "/admin/etibarliliq" },
    { key: "openAppeals", value: data.openAppeals, href: "/admin/etirazlar", alert: data.openAppeals > 0 },
    { key: "pendingVip", value: data.pendingVip, href: "/admin/vip" },
    { key: "pendingPromotions", value: data.pendingPromotions, href: "/admin/irelicekme" },
    { key: "pendingDocuments", value: data.pendingDocuments, href: "/admin/senedler" },
  ] as const;
  return (
    <AdminCard title={t("dashboard.platform.title")} description={t("dashboard.platform.description")} className="mb-6">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="flex h-full flex-col rounded-md border border-line p-3 transition-colors hover:border-gold">
              <span className="text-xs text-ink-muted">{t(`dashboard.platform.items.${item.key}`)}</span>
              <span className={`mt-1 text-xl font-semibold tabular-nums ${"alert" in item && item.alert ? "text-danger" : "text-ink"}`}>{number.format(item.value)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}
