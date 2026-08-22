import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminBlogCategories } from "@/lib/queries";
import { createPost } from "../actions";
import { EMPTY_POST } from "../form-values";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "Yeni məqalə" };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdminRead(PERMISSIONS.BLOG_MANAGE);
  const categories = await getAdminBlogCategories();

  return (
    <>
      <AdminPageHeader
        title="Yeni məqalə"
        description="Məqalə qaralama kimi saxlanıla və sonra dərc edilə bilər."
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Bloq", href: "/admin/blog" },
          { label: "Yeni məqalə" },
        ]}
      />

      <PostForm
        action={createPost}
        initial={EMPTY_POST}
        categories={categories}
        submitLabel="Məqaləni yarat"
      />
    </>
  );
}
