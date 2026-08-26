"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAccount } from "@/lib/auth/guard";
import { SAVED_SEARCH_FREQUENCIES, type Locale } from "@/lib/constants";
import type { PropertyFilters } from "@/lib/queries";
import { type ActionState, failure, success, toFieldErrors, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { localizePath } from "@/i18n/path-locale";

const LIST_PATH = "/kabinet/axtarislarim";

const FREQUENCY_VALUES = Object.values(SAVED_SEARCH_FREQUENCIES) as [string, ...string[]];

/**
 * `/emlaklar` axtarış nəticələrindən "Axtarışı saxla" ilə göndərilən filtr JSON-u.
 *
 * `sort`/`page`/`pageSize` qəsdən qəbul edilmir — saxlanmış axtarış filtr
 * kombinasiyasını təsvir edir, konkret nəticə səhifəsini yox (bax spec bölmə 4).
 */
const createSavedSearchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  frequency: z.enum(FREQUENCY_VALUES),
  filters: z.string().max(4000),
});

export async function createSavedSearch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);

  const parsed = createSavedSearchSchema.safeParse({
    name: form.text(formData, "name"),
    frequency: form.text(formData, "frequency"),
    filters: form.text(formData, "filters"),
  });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

  let filters: PropertyFilters;
  try {
    filters = JSON.parse(parsed.data.filters) as PropertyFilters;
  } catch {
    return failure(t("actions.invalidForm"));
  }
  // Yaddaşda saxlanılan filtr yalnız axtarış kombinasiyasını təsvir edir —
  // nəticə səhifəsinin sıralama/səhifələmə vəziyyəti buraya sızmır.
  delete filters.sort;
  delete filters.page;
  delete filters.pageSize;

  try {
    await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        filters: JSON.stringify(filters),
        frequency: parsed.data.frequency,
      },
    });

    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("savedSearches.saved"));
  } catch (error) {
    return unexpected("saxlanmış axtarış yaradılmadı", error, t("actions.unexpected"));
  }
}

async function ownedSavedSearch(userId: string, id: string) {
  return prisma.savedSearch.findFirst({ where: { id, userId }, select: { id: true, enabled: true } });
}

const updateSavedSearchSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  frequency: z.enum(FREQUENCY_VALUES),
});

/** Ad və bildiriş tezliyini dəyişir — filtr kombinasiyası redaktə olunmur, yenisi saxlanılmalıdır. */
export async function updateSavedSearch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);

  const parsed = updateSavedSearchSchema.safeParse({
    id: form.text(formData, "id"),
    name: form.text(formData, "name"),
    frequency: form.text(formData, "frequency"),
  });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

  try {
    const existing = await ownedSavedSearch(user.id, parsed.data.id);
    if (!existing) return failure(t("savedSearches.notFound"));

    await prisma.savedSearch.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name, frequency: parsed.data.frequency },
    });
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("savedSearches.updated"));
  } catch (error) {
    return unexpected("saxlanmış axtarış yenilənmədi", error, t("actions.unexpected"));
  }
}

export async function toggleSavedSearchEnabled(id: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);

  try {
    const existing = await ownedSavedSearch(user.id, id);
    if (!existing) return failure(t("savedSearches.notFound"));

    await prisma.savedSearch.update({ where: { id }, data: { enabled: !existing.enabled } });
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(existing.enabled ? t("savedSearches.paused") : t("savedSearches.resumed"));
  } catch (error) {
    return unexpected("saxlanmış axtarış vəziyyəti dəyişmədi", error, t("actions.unexpected"));
  }
}

export async function deleteSavedSearch(id: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);

  try {
    const existing = await ownedSavedSearch(user.id, id);
    if (!existing) return failure(t("savedSearches.notFound"));

    await prisma.savedSearch.delete({ where: { id } });
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("savedSearches.deleted"));
  } catch (error) {
    return unexpected("saxlanmış axtarış silinmədi", error, t("actions.unexpected"));
  }
}
