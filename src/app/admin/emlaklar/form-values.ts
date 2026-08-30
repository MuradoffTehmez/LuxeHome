import {
  CURRENCIES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
} from "@/lib/constants";
import type { DropzoneImage } from "@/components/admin/image-dropzone";

/**
 * Forma dəyərləri — **client modulundan kənarda** saxlanılır.
 *
 * Server Component `"use client"` faylından adi dəyər idxal edə bilmir: bundler onu
 * client-referens obyekti ilə əvəz edir və sahələr `undefined` olur. `EMPTY_PROPERTY`
 * əvvəllər forma faylında idi və `/admin/emlaklar/yeni` səhifəsi məhz buna görə
 * «Cannot read properties of undefined (reading 'includes')» xətası ilə çökürdü.
 */

export type PropertyFormValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  listingType: string;
  status: string;
  price: string;
  currency: string;
  pricePeriod: string;
  typeId: string;
  cityId: string;
  districtId: string;
  metroId: string;
  projectId: string;
  address: string;
  latitude: string;
  longitude: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  landArea: string;
  floor: string;
  totalFloors: string;
  renovation: string;
  documentStatus: string;
  buildingType: string;
  videoUrl: string;
  mortgageAvailable: boolean;
  installmentAvailable: boolean;
  isFeatured: boolean;
  featuredUntil: string;
  reservationEnabled: boolean;
  assignedAgentId: string;
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  featureIds: string[];
  images: DropzoneImage[];
};

export const EMPTY_PROPERTY: PropertyFormValues = {
  title: "",
  slug: "",
  description: "",
  listingType: LISTING_TYPES.SALE,
  status: PROPERTY_STATUSES.DRAFT,
  price: "",
  currency: CURRENCIES.AZN,
  pricePeriod: "",
  typeId: "",
  cityId: "",
  districtId: "",
  metroId: "",
  projectId: "",
  address: "",
  latitude: "",
  longitude: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  area: "",
  landArea: "",
  floor: "",
  totalFloors: "",
  renovation: "",
  documentStatus: "",
  buildingType: "",
  videoUrl: "",
  mortgageAvailable: false,
  installmentAvailable: false,
  isFeatured: false,
  featuredUntil: "",
  reservationEnabled: false,
  assignedAgentId: "",
  metaTitle: "",
  metaDescription: "",
  noIndex: false,
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  featureIds: [],
  images: [],
};
