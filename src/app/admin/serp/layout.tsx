import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";

export default async function SerpLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminRead(PERMISSIONS.SEO_VIEW);
  // SERP alətlərinin vahid tab zolağı — 19 ayrı səhifə bir modul kimi gəzilir.
  return (
    <div className="min-w-0">
      <AdminSectionTabs module="serp" role={user.role} />
      {children}
    </div>
  );
}
