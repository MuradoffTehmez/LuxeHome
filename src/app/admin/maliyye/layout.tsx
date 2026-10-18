import { getAdminI18n } from "@/lib/admin-i18n";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";

/** «Maliyyə və abunəliklər» modulunun tab zolağı: planlar, abunələr, endirimlər, kampaniyalar, ödənişlər. */
export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getAdminI18n();
  return (
    <div className="min-w-0">
      <AdminSectionTabs module="finance" role={role} />
      {children}
    </div>
  );
}
