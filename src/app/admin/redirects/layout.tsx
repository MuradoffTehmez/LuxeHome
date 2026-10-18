import { getAdminI18n } from "@/lib/admin-i18n";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";

/** «Marketinq və SEO» modulunun tab zolağı — səhifə `/admin/serp` qovluğundan kənarda olsa da eyni moduldur. */
export default async function SerpToolLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getAdminI18n();
  return (
    <div className="min-w-0">
      <AdminSectionTabs module="serp" role={role} />
      {children}
    </div>
  );
}
