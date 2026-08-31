import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminBlogCategories } from "@/lib/queries";
import { createPost } from "../actions";
import { EMPTY_POST } from "../form-values";
import { PostForm } from "../post-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.blog.yeniMeqale") };
}
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.BLOG_MANAGE);
  const categories = await getAdminBlogCategories();

  return (
    <>
      <AdminPageHeader
        title={t("pages.blog.yeniMeqale")}
        description={t("pages.blog.meqaleQaralamaKimiSaxlanila")}
        breadcrumbs={[
          { label: t("pages.blog.idarePaneli"), href: "/admin" },
          { label: t("pages.blog.bloq"), href: "/admin/blog" },
          { label: t("pages.blog.yeniMeqale") },
        ]}
      />

      <PostForm
        action={createPost}
        initial={EMPTY_POST}
        categories={categories}
        submitLabel={t("pages.blog.meqaleniYarat")}
      />
    </>
  );
}
