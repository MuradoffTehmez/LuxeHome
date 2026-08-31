import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminBlogCategories } from "@/lib/queries";
import { deleteBlogCategory } from "../actions";
import { CategoryForm, type CategoryFormValues } from "./category-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.blog.bloqKateqoriyalari") };
}
export const dynamic = "force-dynamic";

const PATH = "/admin/blog/kateqoriyalar";

const EMPTY: CategoryFormValues = { name: "", slug: "", description: "", order: 0 };

export default async function BlogCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.BLOG_MANAGE);

  const params = await searchParams;
  const editId = typeof params.duzelis === "string" ? params.duzelis : "";
  const categories = await getAdminBlogCategories();

  const editing = categories.find((category) => category.id === editId);
  const initial: CategoryFormValues = editing
    ? {
        id: editing.id,
        name: editing.name,
        slug: editing.slug,
        description: editing.description ?? "",
        order: editing.order,
      }
    : EMPTY;

  return (
    <>
      <AdminPageHeader
        title={t("pages.blog.bloqKateqoriyalari")}
        description={t("pages.blog.kateqoriyaSilinseMeqalelerQalir")}
        breadcrumbs={[
          { label: t("pages.blog.idarePaneli"), href: "/admin" },
          { label: t("pages.blog.bloq"), href: "/admin/blog" },
          { label: t("pages.blog.kateqoriyalar") },
        ]}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <AdminCard bodyClassName="p-4 lg:p-0">
          <AdminResponsiveList
            ariaLabel={t("pages.blog.bloqKateqoriyalari")}
            items={categories}
            getKey={(category) => category.id}
            empty={
              <p className="py-10 text-center text-sm text-ink-muted">
                {t("pages.blog.heleKateqoriyaYaradilmayib")}
              </p>
            }
            renderCard={(category) => (
              <AdminListCard
                title={category.name}
                meta={`/${category.slug}`}
                actions={
                  <>
                    <Link
                      href={`${PATH}?duzelis=${category.id}`}
                      aria-label={`«${category.name}» kateqoriyasını redaktə et`}
                      title={t("pages.blog.redakteEt")}
                      className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                    <ConfirmAction
                      action={deleteBlogCategory}
                      id={category.id}
                      label={`«${category.name}» kateqoriyasını sil`}
                      title={t("pages.blog.kateqoriyaniSilmek")}
                      description={
                        category._count.posts > 0
                          ? `${category._count.posts} məqalə kateqoriyasız qalacaq. Məqalələr silinmir.`
                          : "Kateqoriya tamamilə silinəcək."
                      }
                      className="size-11"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </ConfirmAction>
                  </>
                }
              >
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.blog.sira")}</dt>
                    <dd className="tabular mt-1 text-ink">{category.order}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.blog.meqale")}</dt>
                    <dd className="tabular mt-1 text-ink">{category._count.posts}</dd>
                  </div>
                </dl>
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption={t("pages.blog.kateqoriyalar")}
                headers={[
                  { label: t("pages.blog.ad") },
                  { label: t("pages.blog.sira"), className: "text-right" },
                  { label: t("pages.blog.meqale"), className: "text-right" },
                  { label: t("pages.blog.emeliyyatlar"), srOnly: true, className: "text-right" },
                ]}
              >
                {items.map((category) => (
                  <AdminTableRow key={category.id}>
                    <AdminTableCell>
                      <span className="font-medium text-ink">{category.name}</span>
                      <p className="mt-0.5 text-xs text-ink-muted">/{category.slug}</p>
                    </AdminTableCell>
                    <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                      {category.order}
                    </AdminTableCell>
                    <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                      {category._count.posts}
                    </AdminTableCell>
                    <AdminTableCell align="right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link
                          href={`${PATH}?duzelis=${category.id}`}
                          aria-label={`«${category.name}» kateqoriyasını redaktə et`}
                          title={t("pages.blog.redakteEt")}
                          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Link>
                        <ConfirmAction
                          action={deleteBlogCategory}
                          id={category.id}
                          label={`«${category.name}» kateqoriyasını sil`}
                          title={t("pages.blog.kateqoriyaniSilmek")}
                          description={
                            category._count.posts > 0
                              ? `${category._count.posts} məqalə kateqoriyasız qalacaq. Məqalələr silinmir.`
                              : "Kateqoriya tamamilə silinəcək."
                          }
                          className="size-11"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </ConfirmAction>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            )}
          />
        </AdminCard>

        <CategoryForm initial={initial} />
      </div>
    </>
  );
}
