import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LOCATION_KINDS, MAX_AGENCY_OFFICES } from "@/lib/constants";
import { byAzerbaijaniName } from "@/lib/az-collation";
import { isPhoneLike } from "@/lib/accounts/profile-fields";
import * as form from "@/lib/admin/form";

/**
 * Agentlik filialları (#157) — kabinet (sahib) və panel (admin) eyni qaydanı işlədir.
 *
 * Baş ofis `Agency.address`-dədir; filial əlavə ünvandır. Nömrə telefon formatında
 * olmalıdır (`isPhoneLike`) və ictimai səhifədə HTML-ə yazılmır — «Nömrəni göstər»
 * ilə `/api/agentlikler/<slug>/elaqe?ofis=<id>`-dən açılır.
 */

export type OfficeMessages = {
  name: string;
  address: string;
  phone: string;
  city: string;
  invalid: string;
};

export type OfficeInput = {
  name: string;
  address: string;
  cityId: string | null;
  phone: string | null;
  workingHours: string | null;
};

export type OfficeParseResult =
  | { ok: true; data: OfficeInput }
  | { ok: false; fieldErrors: Record<string, string> };

export function parseOfficeForm(formData: FormData, messages: OfficeMessages): OfficeParseResult {
  const parsed = z
    .object({
      name: z.string().trim().min(2, messages.name).max(120, messages.name),
      address: z.string().trim().min(5, messages.address).max(240, messages.address),
      cityId: z.string().trim().max(40).nullable(),
      phone: z.string().trim().max(30, messages.phone).refine(isPhoneLike, messages.phone).nullable(),
      workingHours: z.string().trim().max(120, messages.invalid).nullable(),
    })
    .safeParse({
      name: form.text(formData, "officeName"),
      address: form.text(formData, "officeAddress"),
      cityId: form.optionalText(formData, "officeCityId"),
      phone: form.optionalText(formData, "officePhone"),
      workingHours: form.optionalText(formData, "officeHours"),
    });
  if (parsed.success) return { ok: true, data: parsed.data };

  // Sahə adları formdakı `office*` adlarına çevrilir ki, xəta öz sahəsinin altında görünsün.
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    const field = `office${key.charAt(0).toUpperCase()}${key.slice(1)}`.replace("officeWorkingHours", "officeHours");
    fieldErrors[field] ??= issue.message;
  }
  return { ok: false, fieldErrors };
}

export type OfficeWriteResult = "ok" | "limit" | "city";

/** Filial əlavə edir. Şəhər yalnız `CITY` səviyyəli yer ola bilər (şəhər və ya rayon). */
export async function createAgencyOffice(agencyId: string, data: OfficeInput): Promise<OfficeWriteResult> {
  const count = await prisma.agencyOffice.count({ where: { agencyId } });
  if (count >= MAX_AGENCY_OFFICES) return "limit";
  if (data.cityId) {
    const city = await prisma.location.findFirst({
      where: { id: data.cityId, kind: LOCATION_KINDS.CITY },
      select: { id: true },
    });
    if (!city) return "city";
  }
  await prisma.agencyOffice.create({ data: { ...data, agencyId, order: count } });
  return "ok";
}

/** Yalnız həmin agentliyin filialını silir — başqasının id-si ilə çağırış heç nə etmir. */
export async function deleteAgencyOffice(agencyId: string, officeId: string): Promise<boolean> {
  const { count } = await prisma.agencyOffice.deleteMany({ where: { id: officeId, agencyId } });
  return count > 0;
}

export async function getAgencyOffices(agencyId: string) {
  return prisma.agencyOffice.findMany({
    where: { agencyId },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      workingHours: true,
      city: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export type AgencyOfficeItem = Awaited<ReturnType<typeof getAgencyOffices>>[number];

/** Forma üçün şəhər/rayon siyahısı (75 qeyd) — Azərbaycan əlifbası ilə sıralanır. */
export async function getOfficeCityOptions(): Promise<{ value: string; label: string }[]> {
  const cities = await prisma.location.findMany({
    where: { kind: LOCATION_KINDS.CITY },
    select: { id: true, name: true },
  });
  return cities.sort(byAzerbaijaniName).map((city) => ({ value: city.id, label: city.name }));
}
