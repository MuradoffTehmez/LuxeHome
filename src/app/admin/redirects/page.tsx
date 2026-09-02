import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { formatRelative } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminRedirects, getTopNotFoundHits } from "@/lib/queries";
import { CreateRedirectForm, NotFoundHitRow, RedirectRow } from "./redirect-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.yonlendirmeler") };
}
export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.SEO_VIEW);
  const [redirects, notFoundHits] = await Promise.all([
    getAdminRedirects(),
    getTopNotFoundHits(),
  ]);

  return (
    <>
      <AdminPageHeader
        title={t("pages.serp.yonlendirmeler")}
        description={t("pages.serp.kohneUrlLeriYeni")}
        breadcrumbs={[{ label: t("pages.serp.idarePaneli"), href: "/admin" }, { label: t("pages.serp.yonlendirmeler") }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard
            title={t("pages.serp.aktivYonlendirmeler")}
            description={t("pages.misc.qeydSayi", { count: redirects.length })}
            bodyClassName="p-0"
          >
            <ul>
              {redirects.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-ink-muted">
                  {t("pages.serp.heleYonlendirmeYoxdur")}
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
          title={t("pages.serp.404Monitoru")}
          description={t("pages.serp.yonlendirmesiOlmayanEnCox")}
          bodyClassName="p-0"
        >
          <ul>
            {notFoundHits.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">
                {t("pages.serp.heleQeydeAlinmis404")}
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
