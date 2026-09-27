"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Breadcrumbs, type BreadcrumbLink } from "@/components/site/breadcrumbs";
import { cabinetBreadcrumbTrail } from "@/lib/accounts/cabinet-navigation";

/**
 * Kabinetin bütün səhifələrində vahid breadcrumb: «Kabinet › Elanlarım › Yeni elan».
 * Yol cari ünvandan qurulur, ona görə yeni kabinet səhifəsi onu avtomatik alır.
 */
export function CabinetBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("auth.cabinet");
  const trail = cabinetBreadcrumbTrail(pathname);
  if (trail.length < 2) return null;

  const items: BreadcrumbLink[] = trail.map((item, index) => ({
    label: t(item.labelKey),
    href: index < trail.length - 1 ? item.href : undefined,
  }));
  return <Breadcrumbs items={items} className="mb-4" />;
}
