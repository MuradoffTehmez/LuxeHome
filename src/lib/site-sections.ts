import { cache } from "react";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { PROJECTS_SECTION_PATH } from "@/lib/site-section-paths";

/**
 * Paneldən açılıb-bağlanan ictimai sayt bölmələri.
 *
 * Hələlik yalnız «Yaşayış kompleksləri» (`/layiheler`) bölməsidir (#83). Bölmə
 * bağlı olanda məlumat silinmir və admin paneldə idarə davam edir — yalnız
 * ictimai səthlər (menyu, bloklar, sitemap, `llms.txt`) onu göstərmir,
 * marşrutlar isə 404 qaytarır. Açar heç yazılmayıbsa bölmə **gizlidir**.
 */

/** `"1"` — bölmə görünür. */
export const PROJECTS_SECTION_ENABLED_VALUE = "1";

/** Sorğu başına bir dəfə oxunur — layout, səhifə və sitemap eyni dəyəri paylaşır. */
export const isProjectsSectionEnabled = cache(async (): Promise<boolean> => {
  return (await getSetting(SETTING_KEYS.PROJECTS_SECTION_ENABLED)) === PROJECTS_SECTION_ENABLED_VALUE;
});

/** Naviqasiya və keçid siyahılarından çıxarılacaq marşrutlar. */
export async function getHiddenPublicPaths(): Promise<string[]> {
  return (await isProjectsSectionEnabled()) ? [] : [PROJECTS_SECTION_PATH];
}
