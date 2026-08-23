import { SERVICE_ICON_NAMES } from "@/components/site/service-icon";
import type { DropzoneImage } from "@/components/admin/image-dropzone";

/** Forma dəyərləri client modulundan kənardadır — səbəb üçün `emlaklar/form-values.ts`-ə bax. */

export type ServiceFormValues = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  icon: string;
  bullets: string;
  order: string;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  image: DropzoneImage[];
};

export const EMPTY_SERVICE: ServiceFormValues = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  icon: SERVICE_ICON_NAMES[0],
  bullets: "",
  order: "0",
  isActive: true,
  metaTitle: "",
  metaDescription: "",
  noIndex: false,
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  image: [],
};
