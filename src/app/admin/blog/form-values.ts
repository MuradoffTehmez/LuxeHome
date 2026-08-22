import { POST_STATUSES } from "@/lib/constants";
import type { DropzoneImage } from "@/components/admin/image-dropzone";

/**
 * Forma dəyərləri client modulundan kənardadır.
 *
 * Server Component `"use client"` faylından adi dəyər idxal edə bilmir — bundler onu
 * client-referens ilə əvəz edir və bütün sahələr `undefined` olur.
 */

export type PostFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
  cover: DropzoneImage[];
};

export const EMPTY_POST: PostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  categoryId: "",
  status: POST_STATUSES.DRAFT,
  metaTitle: "",
  metaDescription: "",
  cover: [],
};
