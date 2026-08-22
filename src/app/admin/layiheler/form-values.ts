import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/constants";
import type { DropzoneImage } from "@/components/admin/image-dropzone";

/** Forma dəyərləri client modulundan kənardadır — səbəb üçün `emlaklar/form-values.ts`-ə bax. */

export type ProjectFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  summary: string;
  projectType: string;
  status: string;
  cityId: string;
  address: string;
  latitude: string;
  longitude: string;
  startDate: string;
  deliveryDate: string;
  year: string;
  totalArea: string;
  floors: string;
  unitCount: string;
  highlights: string;
  timeline: string;
  isActive: boolean;
  order: string;
  metaTitle: string;
  metaDescription: string;
  images: DropzoneImage[];
};

export const EMPTY_PROJECT: ProjectFormValues = {
  name: "",
  slug: "",
  description: "",
  summary: "",
  projectType: PROJECT_TYPES.RESIDENTIAL,
  status: PROJECT_STATUSES.ONGOING,
  cityId: "",
  address: "",
  latitude: "",
  longitude: "",
  startDate: "",
  deliveryDate: "",
  year: "",
  totalArea: "",
  floors: "",
  unitCount: "",
  highlights: "",
  timeline: "",
  isActive: true,
  order: "0",
  metaTitle: "",
  metaDescription: "",
  images: [],
};
