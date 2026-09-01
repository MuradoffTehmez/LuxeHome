import { cache } from "react";
import { SETTING_KEYS, getSetting } from "@/lib/settings";

/**
 * Nümunə (demo) məzmunun ictimai görünürlüyü.
 *
 * Bazadakı hər ictimai model `isDemo` bayrağı daşıyır. Adi rejimdə ictimai
 * sorğular `isDemo: false` şərti ilə işləyir və nümunə qeydlər saytda görünmür;
 * paneldən demo rejimi açıldıqda həmin şərt götürülür və eyni sorğular nümunə
 * qeydləri də qaytarır.
 *
 * **Bayrağın özü heç vaxt dəyişmir.** Alternativ yanaşma — açar dəyişdirildikdə
 * yüzlərlə qeydin statusunu toplu yeniləmək — D1-də tranzaksiya olmadığı üçün
 * yarımçıq qala bilərdi və nümunə qeydi real qeyddən ayırd etmək imkanını
 * itirərdi. Görünürlük yalnız sorğu şərtində həll olunur.
 *
 * Rejim **yalnız test və təqdimat üçündür**: production-da söndürülü qalmalıdır.
 */

/** `"1"` — nümunə məzmun ictimai saytda göstərilir. Açar yoxdursa rejim bağlıdır. */
export const DEMO_CONTENT_ENABLED_VALUE = "1";

/**
 * Sorğu başına bir dəfə oxunur.
 *
 * `cache()` React-in request scope-udur: eyni sorğuda onlarla ictimai `where`
 * qurulur, hamısı bu dəyəri paylaşır və D1-ə yalnız bir `Setting` oxuması gedir.
 */
export const isDemoContentEnabled = cache(async (): Promise<boolean> => {
  return (await getSetting(SETTING_KEYS.DEMO_CONTENT_ENABLED)) === DEMO_CONTENT_ENABLED_VALUE;
});

/**
 * İctimai `where` blokuna qoşulan demo şərti.
 *
 * Demo bağlı olduqda `{ isDemo: false }`, açıq olduqda boş obyekt qaytarır.
 * Boş obyekt spread edildikdə şərt sadəcə düşür, yəni sorğu həm real, həm də
 * nümunə qeydləri qaytarır.
 *
 * @example
 * where: { deletedAt: null, ...(await demoWhere()) }
 */
export async function demoWhere(): Promise<{ isDemo?: false }> {
  return (await isDemoContentEnabled()) ? {} : { isDemo: false };
}

/** Paneldə göstərilən nümunə qeyd sayları. */
export type DemoContentStats = {
  properties: number;
  projects: number;
  agencies: number;
  agents: number;
  partners: number;
  posts: number;
  /** Kateqoriya üzrə bölgü — hansı əmlak növündə neçə nümunə elan var. */
  byCategory: Array<{ slug: string; name: string; count: number }>;
};

/**
 * Bazadakı nümunə qeydlərin sayı.
 *
 * Panel bu rəqəmlərə görə qərar verir: rejim açıq olsa da say sıfırdırsa,
 * SQL dəsti hələ yüklənməyib və istifadəçiyə əmr göstərilməlidir.
 */
export async function getDemoContentStats(): Promise<DemoContentStats> {
  const { prisma } = await import("@/lib/prisma");

  const [properties, projects, agencies, agents, partners, posts, types] = await Promise.all([
    prisma.property.count({ where: { isDemo: true, deletedAt: null } }),
    prisma.project.count({ where: { isDemo: true, deletedAt: null } }),
    prisma.agency.count({ where: { isDemo: true } }),
    prisma.agentProfile.count({ where: { isDemo: true } }),
    prisma.partner.count({ where: { isDemo: true, deletedAt: null } }),
    prisma.blogPost.count({ where: { isDemo: true, deletedAt: null } }),
    prisma.propertyType.findMany({
      select: {
        slug: true,
        name: true,
        _count: { select: { properties: { where: { isDemo: true, deletedAt: null } } } },
      },
      orderBy: { order: "asc" },
    }),
  ]);

  return {
    properties,
    projects,
    agencies,
    agents,
    partners,
    posts,
    byCategory: types.map((type) => ({
      slug: type.slug,
      name: type.name,
      count: type._count.properties,
    })),
  };
}
