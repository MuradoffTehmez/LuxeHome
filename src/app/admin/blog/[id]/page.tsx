import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/utils";
import { getAdminBlogCategories, getAdminPostById } from "@/lib/queries";
import { deletePost, updatePost } from "../actions";
import type { PostFormValues } from "../form-values";
import { PostForm } from "../post-form";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.blog.meqaleninRedaktesi") };
}
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.BLOG_MANAGE);

  const { id } = await params;
  const [post, categories] = await Promise.all([getAdminPostById(id), getAdminBlogCategories()]);

  if (!post) notFound();

  const initial: PostFormValues = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    categoryId: post.categoryId ?? "",
    status: post.status,
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    noIndex: post.noIndex,
    canonicalUrl: post.canonicalUrl ?? "",
    ogTitle: post.ogTitle ?? "",
    ogDescription: post.ogDescription ?? "",
    ogImage: post.ogImage ?? "",
    cover: post.coverUrl ? [{ url: post.coverUrl, alt: post.coverAlt, isCover: true }] : [],
  };

  return (
    <>
      <AdminPageHeader
        title={post.title}
        description={
          post.deletedAt
            ? `Bu məqalə ${formatDateTime(post.deletedAt)} tarixində silinib.`
            : `Son yenilənmə: ${formatDateTime(post.updatedAt)} · ${post.viewCount} baxış`
        }
        breadcrumbs={[
          { label: t("pages.blog.idarePaneli"), href: "/admin" },
          { label: t("pages.blog.bloq"), href: "/admin/blog" },
          { label: t("pages.blog.redakte") },
        ]}
        actions={
          <Link
            href={localizePath(`/blog/${post.slug}`, locale)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t("pages.blog.saytdaBax")}
          </Link>
        }
      />

      <PostForm
        action={updatePost}
        initial={initial}
        categories={categories}
        submitLabel={t("pages.blog.deyisiklikleriSaxla")}
        extraActions={
          post.deletedAt ? null : (
            <ConfirmAction
              action={deletePost}
              id={post.id}
              label={t("pages.blog.meqaleniSil")}
              title={t("pages.blog.meqaleniSilmek")}
              description={t("pages.blog.meqaleSaytdanCixarilacaqAmma")}
              redirectTo="/admin/blog"
              className="mr-auto"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </ConfirmAction>
          )
        }
      />
    </>
  );
}
