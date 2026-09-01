import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";

export default async function SerpLayout({ children }: { children: React.ReactNode }) {
  await requireAdminRead(PERMISSIONS.SEO_VIEW);
  return <div className="min-w-0">{children}</div>;
}
