import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { AdminShell } from "@/components/admin/admin-shell";
import { ThemeSync } from "@/components/theme-sync";
import { ToastProvider } from "@/components/ui/toast";
import { requireStaff } from "@/lib/auth/guard";
import { getAdminI18n, getAdminMetadataT } from "@/lib/admin-i18n";
import { prisma } from "@/lib/prisma";
import { ACTIVE_REPORT_STATUSES, LEAD_STATUSES, PROMOTION_STATUSES, PROPERTY_STATUSES, VIP_REQUEST_STATUSES } from "@/lib/constants";
import { countOpenAppeals } from "@/lib/listing-appeals";
import { countPendingAdminTransfers } from "@/lib/listing-transfers";
import { OFFICE_LEAD_WHERE } from "@/lib/admin/office-leads";
import { getApprovalCounts } from "@/lib/admin/approvals";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminMetadataT();

  return {
    title: {
      default: t("shell.title"),
      template: t("shell.titleTemplate"),
    },
    // İdarə paneli heç vaxt indeksləşdirilməməlidir
    robots: { index: false, follow: false },
  };
}

// Sessiya və sayğaclar D1-dən oxunur — binding yalnız sorğu kontekstindədir
export const dynamic = "force-dynamic";

/**
 * Admin panelin ümumi çərçivəsi və birinci qoruma həlqəsi.
 *
 * `requireStaff()` sessiyanı bazadan yoxlayır — middleware-dəki imza yoxlaması
 * ləğv edilmiş sessiyanı görmür. Layout bütün panel səhifələrini əhatə edir,
 * amma server action-ları layout-dan keçmir: onlar öz guard-larını çağırır.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Panel yalnız şirkət əməkdaşlarına açıqdır — ictimai hesab da etibarlı sessiya daşıyır
  const user = await requireStaff();

  // Panel dili `User.locale`-dandır: `/admin` locale prefiksi daşımır, ona görə
  // mesajlar client komponentlərinə buradan ötürülür. Kataloq bütöv göndərilir —
  // səbəbi `src/i18n/admin.ts`-in sonundakı qeyddə izah olunub: layout client
  // naviqasiyasında yenidən render olunmadığı üçün marşruta görə süzgəc keçid
  // anında köhnə bölmələrlə qalır və panel açar adlarını göstərir.
  const { locale, messages } = await getAdminI18n();

  // Müvəqqəti parolla gələn istifadəçi əvvəlcə onu dəyişməlidir.
  // Marşrut middleware-in qoyduğu başlıqdan oxunur — hesab səhifəsinin özündə
  // yönləndirmə təkrarlanmamalıdır, əks halda dövrə yaranır.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (user.mustChangePassword && !pathname.startsWith("/admin/hesabim")) {
    redirect("/admin/hesabim?parol=deyis");
  }

  const [newLeads, draftProperties, pendingModeration, approvals, openReports, openAppeals, pendingTransfers, pendingVip, pendingPromotions] = await Promise.all([
    prisma.lead.count({ where: { ...OFFICE_LEAD_WHERE, status: LEAD_STATUSES.NEW } }),
    prisma.property.count({ where: { status: PROPERTY_STATUSES.DRAFT, deletedAt: null } }),
    prisma.property.count({ where: { status: PROPERTY_STATUSES.PENDING, deletedAt: null } }),
    getApprovalCounts(),
    prisma.listingReport.count({ where: { status: { in: [...ACTIVE_REPORT_STATUSES] } } }),
    countOpenAppeals(),
    countPendingAdminTransfers(),
    prisma.vipRequest.count({ where: { status: VIP_REQUEST_STATUSES.PENDING } }),
    prisma.promotionCampaign.count({ where: { status: PROMOTION_STATUSES.PENDING } }),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToastProvider>
        <ThemeSync preference={user.themePreference} />
        <AdminShell user={user} counters={{ newLeads, draftProperties, pendingModeration, pendingApprovals: approvals.total, openReports, openAppeals, pendingTransfers, pendingVip, pendingPromotions, pendingPromotionHub: pendingVip + pendingPromotions }}>
          {children}
        </AdminShell>
      </ToastProvider>
    </NextIntlClientProvider>
  );
}
