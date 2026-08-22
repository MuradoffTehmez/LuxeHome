"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, failure, invalid, unexpected } from "@/lib/admin/action-state";
import { parseImages } from "@/lib/admin/images";
import { propertyData } from "@/lib/admin/property-input";
import { uniqueSlug } from "@/lib/admin/slug";
import {
  buildPublicPropertyData,
  createPropertyWithRelations,
  hasExclusiveMediaOwnership,
  publicPropertySchema,
  readPublicPropertyForm,
} from "@/lib/accounts/property-submission";
import { requireLister } from "@/lib/auth/guard";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const LIST_PATH = "/kabinet/elanlar";

async function validateRelations(input: {
  typeId: string;
  cityId: string;
  districtId: string | null;
  featureIds: string[];
}): Promise<Record<string, string> | null> {
  const errors: Record<string, string> = {};
  const [type, city, district, featureCount] = await Promise.all([
    prisma.propertyType.findUnique({ where: { id: input.typeId }, select: { id: true } }),
    prisma.location.findUnique({ where: { id: input.cityId }, select: { id: true } }),
    input.districtId
      ? prisma.location.findUnique({ where: { id: input.districtId }, select: { parentId: true } })
      : null,
    prisma.feature.count({ where: { id: { in: input.featureIds } } }),
  ]);

  if (!type) errors.typeId = "Əmlak növü seçilməyib";
  if (!city) errors.cityId = "Şəhər seçilməyib";
  if (input.districtId && !district) errors.districtId = "Rayon tapılmadı";
  if (district && district.parentId !== input.cityId) {
    errors.districtId = "Seçilmiş rayon bu şəhərə aid deyil";
  }
  if (featureCount !== input.featureIds.length) {
    errors.featureIds = "Seçilmiş xüsusiyyətlərdən biri tapılmadı";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

async function ownsImages(userId: string, urls: string[]): Promise<boolean> {
  if (urls.length === 0) return true;

  const owned = await prisma.media.findMany({
    where: { uploaderId: userId, url: { in: urls } },
    select: { url: true },
  });
  return hasExclusiveMediaOwnership(
    urls,
    owned.map((media) => media.url),
  );
}

async function createRelations(
  propertyId: string,
  featureIds: string[],
  images: { url: string; alt: string; isCover: boolean }[],
) {
  for (const featureId of featureIds) {
    await prisma.propertyFeature.create({ data: { propertyId, featureId } });
  }

  for (const [order, image] of images.entries()) {
    await prisma.propertyImage.create({
      data: { propertyId, url: image.url, alt: image.alt, order, isCover: image.isCover },
    });
  }
}

/** İctimai hesabın elan göndərməsi — panel səlahiyyətlərini qəbul etmir. */
export async function createPublicProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireLister();
  const parsed = publicPropertySchema.safeParse(readPublicPropertyForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const relationErrors = await validateRelations(parsed.data);
  if (relationErrors) {
    return failure("Seçilmiş taksonomiya dəyərləri düzgün deyil.", relationErrors);
  }

  const images = parseImages(formData, "images");
  if (!(await ownsImages(user.id, images.map((image) => image.url)))) {
    return failure("Şəkillərdən biri hesabınıza aid deyil.");
  }

  const agency =
    user.accountType === ACCOUNT_TYPES.AGENCY
      ? await prisma.agency.findUnique({ where: { userId: user.id }, select: { isVerified: true } })
      : null;
  try {
    const slug = await uniqueSlug(parsed.data.title, (candidate) =>
      prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );
    const data = buildPublicPropertyData(parsed.data, {
      userId: user.id,
      accountType: user.accountType,
      agencyVerified: agency?.isVerified ?? false,
    });

    await createPropertyWithRelations(
      {
        createProperty: () =>
          prisma.property.create({
            data: {
              ...propertyData(data),
              slug,
              authorId: data.authorId,
              isDemo: data.isDemo,
              publishedAt: data.publishedAt,
            },
            select: { id: true },
          }),
        createRelations: (propertyId) => createRelations(propertyId, parsed.data.featureIds, images),
        deleteProperty: async (propertyId) => {
          await prisma.property.delete({ where: { id: propertyId } });
        },
      },
      undefined,
    );
  } catch (error) {
    // Şəkil yükləmələri qəsdən silinmir: istifadəçi formadakı xətanı düzəldib yenidən göndərə bilər.
    return unexpected("elan göndərilə bilmədi", error);
  }

  revalidatePath("/kabinet");
  revalidatePath(LIST_PATH);
  revalidatePath("/emlaklar");
  redirect(`${LIST_PATH}?yeni=1`);
}
