import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { Pagination } from "@/components/ui/pagination";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminMedia } from "@/lib/queries";
import { MediaCard } from "./media-card";
import { MediaUploader } from "./media-uploader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.settings.media") };
}
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/media";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.MEDIA_MANAGE);

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = Number(typeof params.sehife === "string" ? params.sehife : "") || 1;

  const { rows, total, totalPages } = await getAdminMedia({ q, page });

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (nextPage > 1) query.set("sehife", String(nextPage));
    const search = query.toString();
    return search ? `${LIST_PATH}?${search}` : LIST_PATH;
  }

  return (
    <>
      <AdminPageHeader
        title={t("pages.settings.media")}
        description={t("pages.common.faylYuklenenSekillerAvtomatik", { p0: total })}
        breadcrumbs={[{ label: t("pages.settings.idarePaneli"), href: "/admin" }, { label: t("pages.settings.media") }]}
      />

      <div className="mb-6">
        <MediaUploader />
      </div>

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={q}
          searchPlaceholder={t("pages.settings.faylAdiVeYa")}
          resultLabel={t("pages.common.faylTapildi", { p0: total })}
        />

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            {q ? t("pages.misc.buAxtarisaUygunFayl") : t("pages.misc.heleFaylYuklenmeyib")}
          </p>
        ) : (
          <ul className="grid gap-4 p-4 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:p-5 xl:grid-cols-4">
            {rows.map((media) => (
              <MediaCard
                key={media.id}
                item={{
                  id: media.id,
                  url: media.url,
                  thumbUrl: media.thumbUrl,
                  originalName: media.originalName,
                  mimeType: media.mimeType,
                  size: media.size,
                  width: media.width,
                  height: media.height,
                  alt: media.alt,
                  uploaderName: media.uploader?.name ?? null,
                  createdAtLabel: formatDateTime(media.createdAt),
                }}
              />
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
          <span className="tabular">
            {total === 0 ? t("pages.misc.0FaylGosterilir") : t("pages.common.fayldanGosterilir", { p0: total, p1: rows.length })}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </AdminCard>
    </>
  );
}
