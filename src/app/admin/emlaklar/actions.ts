"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, PROPERTY_STATUSES } from "@/lib/constants";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { parseImages } from "@/lib/admin/images";
import { propertySchema, type PropertyInput } from "@/lib/admin/schemas";
import {
  propertyLifecycleData,
  propertyData,
  readPropertyForm,
} from "@/lib/admin/property-input";
import { paymentFlagsFromFeatures } from "@/lib/admin/payment-features";
import { locationBelongsToCity } from "@/lib/accounts/property-submission";
import { uniqueSlug } from "@/lib/admin/slug";
import { ensureSlugRedirect } from "@/lib/admin/slug-redirect";
import * as form from "@/lib/admin/form";
import { notifyMatchingSavedSearches } from "@/lib/queries";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { recordPropertyPriceChange } from "@/lib/price-drop";
import {
  propertyRetentionDays,
  validatePropertyForPublication,
  validateStoredPropertyForPublication,
} from "@/lib/property-publish-validation";
import { msg } from "@/lib/admin/server-message";

/**
 * Əmlak CRUD-u.
 *
 * Hər action `requireAdminAction()` ilə başlayır: mənbə (CSRF), səlahiyyət və sürət
 * limiti bir yerdə yoxlanılır. Layout guard-ı burada kifayət etmir, çünki action
 * layout-dan keçmir.
 *
 * D1 transaction dəstəkləmir. Yazı sırası ona görə belədir: əvvəl əsas qeyd, sonra
 * əlaqəli sətirlər (xüsusiyyət, şəkil). Yarımçıq qalan halda elan mövcud olur, sadəcə
 * qalereyası natamam görünür — tərsinə olsaydı, sahibsiz sətirlər qalardı.
 */

const LIST_PATH = "/admin/emlaklar";

/** Verilən ID-lərin həqiqətən mövcud olduğunu yoxlayır — uydurma ID ilə yazı bağlanmasın. */
async function validateRelations(input: PropertyInput): Promise<Record<string, string> | null> {
  const errors: Record<string, string> = {};

  const [type, city, district, project] = await Promise.all([
    prisma.propertyType.findUnique({ where: { id: input.typeId }, select: { id: true } }),
    prisma.location.findUnique({ where: { id: input.cityId }, select: { id: true } }),
    input.districtId
      ? prisma.location.findUnique({
          where: { id: input.districtId },
          // `parent.parentId` Bakı qəsəbələri üçün şəhəri verir — onlar rayonun
          // uşağıdır, tək səviyyəli yoxlama Maştağanı səhvən rədd edərdi.
          select: { kind: true, parentId: true, parent: { select: { parentId: true } } },
        })
      : null,
    input.projectId
      ? prisma.project.findUnique({ where: { id: input.projectId }, select: { id: true } })
      : null,
  ]);

  if (!type) errors.typeId = msg("server.emlaklar.emlakNovuSecilmeyib");
  if (!city) errors.cityId = msg("server.emlaklar.seherSecilmeyib");
  if (input.districtId && !district) errors.districtId = msg("server.emlaklar.rayonTapilmadi");
  if (district && !locationBelongsToCity(district, input.cityId)) {
    errors.districtId = msg("server.emlaklar.secilmisRayonBuSehereAid");
  }
  if (input.projectId && !project) errors.projectId = msg("server.emlaklar.layiheTapilmadi");

  return Object.keys(errors).length > 0 ? errors : null;
}

/** Xüsusiyyət və şəkil sətirlərini yenidən qurur. */
async function replaceRelations(
  propertyId: string,
  featureIds: string[],
  images: { url: string; alt: string; isCover: boolean }[],
) {
  await prisma.propertyFeature.deleteMany({ where: { propertyId } });
  for (const featureId of featureIds) {
    // Silinmiş xüsusiyyət ID-si gəlsə, xarici açar xətası bütün yazını dayandırardı
    await prisma.propertyFeature
      .create({ data: { propertyId, featureId } })
      .catch(() => undefined);
  }

  await prisma.propertyImage.deleteMany({ where: { propertyId } });
  const media = await prisma.media.findMany({
    where: { url: { in: images.map((image) => image.url) } },
    select: { url: true, checksum: true, caption: true },
  });
  const mediaByUrl = new Map(media.map((item) => [item.url, item]));
  for (const [order, image] of images.entries()) {
    const mediaRecord = mediaByUrl.get(image.url);
    await prisma.propertyImage.create({
      data: {
        propertyId,
        url: image.url,
        alt: image.alt,
        caption: mediaRecord?.caption,
        checksum: mediaRecord?.checksum,
        order,
        isCover: image.isCover,
      },
    });
  }
}

export async function createProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = propertySchema.safeParse(readPropertyForm(formData));
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));

  const relationErrors = await validateRelations(parsed.data);
  if (relationErrors) {
    return failure(msg("server.emlaklar.secilmisTaksonomiyaDeyerleriDuzgunDeyil"), relationErrors);
  }

  const images = parseImages(formData, "images");
  if (parsed.data.status === PROPERTY_STATUSES.PUBLISHED) {
    const publication = await validatePropertyForPublication(parsed.data, images);
    if (Object.keys(publication.errors).length > 0) {
      return failure(msg("server.emlaklar.elanDercTelebleriniOdemir"), publication.errors);
    }
  }
  let propertyId: string;

  try {
    const slug = await uniqueSlug(parsed.data.slug || parsed.data.title, (candidate) =>
      prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );

    const paymentFlags = await paymentFlagsFromFeatures(parsed.data.featureIds);

    const property = await prisma.property.create({
      data: {
        ...propertyData(parsed.data, paymentFlags),
        slug,
        authorId: user.id,
        isDemo: false,
        ...propertyLifecycleData(parsed.data.status, { publishedAt: null }, await propertyRetentionDays()),
      },
      select: { id: true },
    });
    propertyId = property.id;

    await replaceRelations(propertyId, parsed.data.featureIds, images);
    await recordAudit(user, "CREATE", "Property", propertyId, parsed.data.title);

    if (parsed.data.status === PROPERTY_STATUSES.PUBLISHED) {
      await notifyMatchingSavedSearches(propertyId);
    }
  } catch (error) {
    return unexpected("əmlak yaradıla bilmədi", error, msg("server.common.unexpected"));
  }

  revalidatePath(LIST_PATH);
  revalidatePublicContent("property");
  redirect(`${LIST_PATH}/${propertyId}?yeni=1`);
}

export async function updateProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure(msg("server.emlaklar.elanTapilmadi"));

  const parsed = propertySchema.safeParse(readPropertyForm(formData));
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));

  const relationErrors = await validateRelations(parsed.data);
  if (relationErrors) {
    return failure(msg("server.emlaklar.secilmisTaksonomiyaDeyerleriDuzgunDeyil"), relationErrors);
  }

  try {
    const images = parseImages(formData, "images");
    const existing = await prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, slug: true, publishedAt: true, closedAt: true, status: true, price: true, currency: true },
    });
    if (!existing) return failure(msg("server.emlaklar.elanTapilmadiVeYaSilinib"));

    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.title,
      (candidate) => prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id,
    );

    if (parsed.data.status === PROPERTY_STATUSES.PUBLISHED) {
      const publication = await validatePropertyForPublication(parsed.data, images, id);
      if (Object.keys(publication.errors).length > 0) {
        return failure(msg("server.emlaklar.elanDercTelebleriniOdemir"), publication.errors);
      }
    }
    const lifecycle = propertyLifecycleData(parsed.data.status, existing, await propertyRetentionDays());

    const paymentFlags = await paymentFlagsFromFeatures(parsed.data.featureIds);

    await prisma.property.update({
      where: { id },
      data: { ...propertyData(parsed.data, paymentFlags), slug, ...lifecycle },
    });

    await recordPropertyPriceChange({
      propertyId: id,
      oldPrice: existing.price,
      newPrice: parsed.data.price,
      currency: existing.currency,
      changedById: user.id,
      source: "ADMIN",
    });

    await replaceRelations(id, parsed.data.featureIds, images);
    await ensureSlugRedirect("/emlaklar", existing.slug, slug, user);
    await recordAudit(user, "UPDATE", "Property", id, parsed.data.title);

    if (existing.publishedAt === null && parsed.data.status === PROPERTY_STATUSES.PUBLISHED) {
      await notifyMatchingSavedSearches(id);
    }

    revalidatePath(LIST_PATH);
    revalidatePath(`/emlaklar/${slug}`);
    revalidatePublicContent("property", slug);
    return success(msg("server.emlaklar.elanYenilendi"));
  } catch (error) {
    return unexpected("əmlak yenilənmədi", error, msg("server.common.unexpected"));
  }
}

export async function deleteProperty(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    // Soft delete: ictimai sorğular `deletedAt: null` şərtinə görə qeydi görmür,
    // amma müraciət tarixçəsi və audit izi qırılmır
    const property = await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { title: true, slug: true },
    });

    await recordAudit(user, "DELETE", "Property", id, property.title);
    revalidatePath(LIST_PATH);
    revalidatePath(`/emlaklar/${property.slug}`);
    revalidatePublicContent("property", property.slug);
    return success("Elan silindi.");
  } catch (error) {
    return unexpected("əmlak silinmədi", error, msg("server.common.unexpected"));
  }
}

export async function restoreProperty(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const property = await prisma.property.update({
      where: { id },
      data: { deletedAt: null },
      select: { title: true },
    });

    await recordAudit(user, "RESTORE", "Property", id, property.title);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("property");
    return success(msg("server.emlaklar.elanBerpaEdildi"));
  } catch (error) {
    return unexpected("əmlak bərpa edilmədi", error, msg("server.common.unexpected"));
  }
}

const BULK_INTENTS = ["publish", "archive", "delete", "restore"] as const;
type BulkIntent = (typeof BULK_INTENTS)[number];

/**
 * Siyahıda seçilmiş bir neçə elana eyni əməliyyatı tətbiq edir.
 *
 * D1 `$transaction` dəstəkləmədiyi üçün hər id ayrıca yazılır — biri uğursuz olsa
 * digərləri geri qaytarılmır, ona görə nəticə mesajı neçəsinin işlədiyini bildirir.
 */
export async function bulkUpdateProperties(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const ids = form.uniqueList(formData, "ids");
  if (ids.length === 0) return failure(msg("server.emlaklar.hecBirElanSecilmeyib"));

  const intent = form.text(formData, "intent") as BulkIntent;
  if (!BULK_INTENTS.includes(intent)) return failure(msg("server.emlaklar.namelumEmeliyyat"));

  // Yalnız ilk dəfə dərc olunanlar (əvvəllər `publishedAt` boş olan) saxlanmış axtarış
  // bildirişinə səbəb olur — artıq dərc edilmiş elanın statusu təkrar "publish" ilə
  // toxunulsa belə, bildiriş təkrarlanmır.
  const previouslyUnpublished =
    intent === "publish"
      ? new Set(
          (
            await prisma.property.findMany({
              where: { id: { in: ids }, publishedAt: null },
              select: { id: true },
            })
          ).map((property) => property.id),
        )
      : null;

  let done = 0;
  const retentionDays = await propertyRetentionDays();
  for (const id of ids) {
    try {
      const current = await prisma.property.findUnique({
        where: { id },
        select: { publishedAt: true, closedAt: true },
      });
      if (!current) continue;
      let data: Record<string, unknown>;
      if (intent === "publish") {
        const publication = await validateStoredPropertyForPublication(id);
        if (Object.keys(publication.errors).length > 0) continue;
        data = {
          status: PROPERTY_STATUSES.PUBLISHED,
          ...propertyLifecycleData(PROPERTY_STATUSES.PUBLISHED, current, retentionDays),
          contentFingerprint: publication.fingerprint,
        };
      } else if (intent === "archive") {
        data = { status: PROPERTY_STATUSES.ARCHIVED, ...propertyLifecycleData(PROPERTY_STATUSES.ARCHIVED, current, retentionDays) };
      } else if (intent === "delete") data = { deletedAt: new Date() };
      else data = { deletedAt: null };
      await prisma.property.update({ where: { id }, data });
      done += 1;
      if (previouslyUnpublished?.has(id)) {
        await notifyMatchingSavedSearches(id);
      }
    } catch {
      // Tək id uğursuz olsa qalanları dayandırmır — nəticədə sayılır
    }
  }

  await recordAudit(user, "UPDATE", "Property", null, `Kütləvi ${intent}: ${done}/${ids.length} elan`);
  revalidatePath(LIST_PATH);
  revalidatePublicContent("property");

  if (done === 0) return failure(msg("server.emlaklar.hecBirElanYenilenmedi"));
  if (done < ids.length) return failure(msg("server.emlaklar.elanYenilendiQalanlariUgursuzOldu", { p0: String(done), p1: String(ids.length) }));
  return success(msg("server.emlaklar.elanYenilendi2", { p0: String(done) }));
}
