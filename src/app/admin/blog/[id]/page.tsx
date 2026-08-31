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

export const metadata: Metadata = { title: "Məqalənin redaktəsi" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
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
          { label: "İdarə paneli", href: "/admin" },
          { label: "Bloq", href: "/admin/blog" },
          { label: "Redaktə" },
        ]}
        actions={
          <Link
            href={localizePath(`/blog/${post.slug}`, locale)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Saytda bax
          </Link>
        }
      />

      <PostForm
        action={updatePost}
        initial={initial}
        categories={categories}
        submitLabel="Dəyişiklikləri saxla"
        extraActions={
          post.deletedAt ? null : (
            <ConfirmAction
              action={deletePost}
              id={post.id}
              label="Məqaləni sil"
              title="Məqaləni silmək"
              description="Məqalə saytdan çıxarılacaq, amma zibil qutusunda qalacaq."
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
