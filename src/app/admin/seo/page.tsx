import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/ui/states";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getSeoAuditItems } from "@/lib/queries";

export const metadata: Metadata = { title: "SEO auditı" };
export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const { properties, posts } = await getSeoAuditItems();

  const total = properties.length + posts.length;

  return (
    <>
      <AdminPageHeader
        title="SEO auditı"
        description="Meta başlıq və ya təsvir çatışmayan dərc olunmuş məzmun. Boş sahələr avtomatik başlıqdan doldurulur, amma əl ilə yazılan variant axtarış nəticələrində daha yaxşı görünür."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "SEO auditı" }]}
      />

      {total === 0 ? (
        <EmptyState
          title="Hər şey qaydasındadır"
          description="Bütün dərc olunmuş elan və məqalələrdə meta başlıq və təsvir var."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {properties.length > 0 && (
            <AdminCard title="Əmlaklar" description={`${properties.length} elanda meta məlumat çatışmır`} bodyClassName="p-0">
              <ul className="divide-y divide-line">
                {properties.map((property) => (
                  <li key={property.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Link
                      href={`/admin/emlaklar/${property.id}`}
                      className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-gold-deep"
                    >
                      {property.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-warning">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      {!property.metaTitle && !property.metaDescription
                        ? "Başlıq və təsvir yoxdur"
                        : !property.metaTitle
                          ? "Başlıq yoxdur"
                          : "Təsvir yoxdur"}
                    </span>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}

          {posts.length > 0 && (
            <AdminCard title="Bloq yazıları" description={`${posts.length} yazıda meta məlumat çatışmır`} bodyClassName="p-0">
              <ul className="divide-y divide-line">
                {posts.map((post) => (
                  <li key={post.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-gold-deep"
                    >
                      {post.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-warning">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      {!post.metaTitle && !post.metaDescription
                        ? "Başlıq və təsvir yoxdur"
                        : !post.metaTitle
                          ? "Başlıq yoxdur"
                          : "Təsvir yoxdur"}
                    </span>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
        </div>
      )}
    </>
  );
}
