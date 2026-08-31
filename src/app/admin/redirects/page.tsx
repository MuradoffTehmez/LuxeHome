import type { Metadata } from "next";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { formatRelative } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminRedirects, getTopNotFoundHits } from "@/lib/queries";
import { CreateRedirectForm, NotFoundHitRow, RedirectRow } from "./redirect-forms";

export const metadata: Metadata = { title: "Yönləndirmələr" };
export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage() {
  await requireAdminRead(PERMISSIONS.SEO_VIEW);
  const [redirects, notFoundHits] = await Promise.all([
    getAdminRedirects(),
    getTopNotFoundHits(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Yönləndirmələr"
        description="Köhnə URL-ləri yeni ünvana yönləndirin. 404 monitoru ən çox rast gəlinən boş yolları göstərir."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Yönləndirmələr" }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard
            title="Aktiv yönləndirmələr"
            description={`${redirects.length} qeyd`}
            bodyClassName="p-0"
          >
            <ul>
              {redirects.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-ink-muted">
                  Hələ yönləndirmə yoxdur.
                </li>
              )}
              {redirects.map((redirect) => (
                <RedirectRow
                  key={redirect.id}
                  id={redirect.id}
                  fromPath={redirect.fromPath}
                  toPath={redirect.toPath}
                  statusCode={redirect.statusCode}
                  isActive={redirect.isActive}
                  hitCount={redirect.hitCount}
                />
              ))}
            </ul>
          </AdminCard>
          <CreateRedirectForm />
        </div>

        <AdminCard
          title="404 monitoru"
          description="Yönləndirməsi olmayan, ən çox rast gəlinən yollar."
          bodyClassName="p-0"
        >
          <ul>
            {notFoundHits.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">
                Hələ qeydə alınmış 404 yoxdur.
              </li>
            )}
            {notFoundHits.map((hit) => (
              <NotFoundHitRow
                key={hit.id}
                id={hit.id}
                path={hit.path}
                count={hit.count}
                lastSeenAt={formatRelative(hit.lastSeenAt)}
                firstSeenAt={formatRelative(hit.firstSeenAt)}
              />
            ))}
          </ul>
        </AdminCard>
      </div>
    </>
  );
}
