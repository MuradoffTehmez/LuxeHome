import { isPhoneLike } from "@/lib/accounts/profile-fields";

/**
 * Profil tamlıq göstəricisi (#157) — kabinetdə «Profiliniz 60% doludur» kartı.
 * Prisma-sız saf modul: kabinet səhifəsi hesablayır, testlər birbaşa yoxlayır.
 *
 * Çəkilər müştərinin qərarına təsirə görədir: agentlikdə loqo, təsvir və ofis nömrəsi,
 * agentdə şəkil və bio ən vacibdir. Cəm hər növ üçün 100-dür.
 */

/** Təsvir/bio bu uzunluqdan qısadırsa «doldurulmayıb» sayılır — bir sözlük mətn kömək etmir. */
export const MIN_ABOUT_LENGTH = 80;

export type CompletenessItem = {
  key: string;
  weight: number;
  done: boolean;
};

export type Completeness = {
  percent: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
};

const filled = (value: string | null | undefined) => Boolean(value?.trim());
const longEnough = (value: string | null | undefined) => (value?.trim().length ?? 0) >= MIN_ABOUT_LENGTH;

function summarize(items: CompletenessItem[]): Completeness {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const done = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  // Ən ağır çatışmayan bənd birinci — istifadəçi əvvəl ən çox fayda verəni görür.
  const missing = items.filter((item) => !item.done).sort((left, right) => right.weight - left.weight);
  return { percent: total ? Math.round((done / total) * 100) : 100, items, missing };
}

export function agencyCompleteness(input: {
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  workingHours: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  taxId: string | null;
}): Completeness {
  return summarize([
    { key: "logo", weight: 15, done: filled(input.logoUrl) },
    { key: "description", weight: 15, done: longEnough(input.description) },
    { key: "phone", weight: 15, done: isPhoneLike(input.phone) },
    { key: "cover", weight: 10, done: filled(input.coverUrl) },
    { key: "address", weight: 10, done: filled(input.address) },
    { key: "hours", weight: 10, done: filled(input.workingHours) },
    { key: "taxId", weight: 10, done: filled(input.taxId) },
    { key: "whatsapp", weight: 5, done: isPhoneLike(input.whatsapp) },
    { key: "email", weight: 5, done: filled(input.email) },
    { key: "web", weight: 5, done: filled(input.website) || filled(input.instagram) },
  ]);
}

export function agentCompleteness(input: {
  avatarUrl: string | null;
  phone: string | null;
  roleTitle: string | null;
  specialization: string | null;
  experienceYears: number | null;
  bio: string | null;
}): Completeness {
  return summarize([
    { key: "bio", weight: 30, done: longEnough(input.bio) },
    { key: "avatar", weight: 20, done: filled(input.avatarUrl) },
    { key: "phone", weight: 15, done: isPhoneLike(input.phone) },
    { key: "specialization", weight: 15, done: filled(input.specialization) },
    { key: "roleTitle", weight: 10, done: filled(input.roleTitle) },
    { key: "experience", weight: 10, done: input.experienceYears != null },
  ]);
}
