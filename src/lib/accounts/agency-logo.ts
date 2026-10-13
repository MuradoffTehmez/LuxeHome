import { prisma } from "@/lib/prisma";
import { MAX_PARTNER_LOGO_SIZE } from "@/lib/constants";
import { deleteImage, putImage, sniffImageType } from "@/lib/media/storage";

/**
 * Agentlik loqosu qeydiyyat formasından gəlir (#qeydiyyat). Hesab hələ yaranmayıb və
 * sessiya yoxdur, ona görə kabinetin `/api/hesab/media` yükləyicisi işləmir — fayl
 * Server Action-un özündə saxlanılır. Loqo su nişansızdır və profil şəkli qovluğuna
 * (`avatarlar`) yazılır: profil formu agentlikdə həmin sahəni loqo kimi göstərir.
 */

export type LogoCheck = "ok" | "invalid" | "tooLarge";

/** Hesab yaradılmazdan əvvəl ucuz yoxlama — sonradan yarımçıq hesab qalmasın. */
export async function checkLogoFile(file: File): Promise<LogoCheck> {
  if (file.size > MAX_PARTNER_LOGO_SIZE) return "tooLarge";
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return sniffImageType(head) ? "ok" : "invalid";
}

/** Formadakı `logo` sahəsi — boş fayl seçilməmiş sayılır. */
export function logoFromForm(formData: FormData, name = "logo"): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Loqonu R2-yə yazır və agentliyə bağlayır. Xəta atmır: hesab artıq yaranıb,
 * loqonu istifadəçi sonradan profildən də qoya bilər.
 */
export async function storeAgencyLogo(userId: string, file: File, agencyName: string): Promise<string | null> {
  try {
    const result = await putImage(file, "avatarlar", agencyName);
    if (!result.ok) {
      console.error("[agency-logo] loqo yüklənmədi:", result.error);
      return null;
    }
    try {
      await prisma.media.create({
        data: {
          url: result.url,
          thumbUrl: result.thumbUrl,
          originalName: file.name.slice(0, 160),
          mimeType: result.mimeType,
          size: result.size,
          width: result.width ?? null,
          height: result.height ?? null,
          uploaderId: userId,
          checksum: result.checksum,
          watermarkApplied: false,
        },
      });
      await prisma.user.update({ where: { id: userId }, data: { avatarUrl: result.url } });
      await prisma.agency.update({ where: { userId }, data: { logoUrl: result.url } });
    } catch (error) {
      // D1-də tranzaksiya yoxdur — yarımçıq qalan sətir və fayl əl ilə geri alınır.
      await prisma.media.deleteMany({ where: { url: result.url } }).catch(() => undefined);
      await prisma.user.updateMany({ where: { id: userId, avatarUrl: result.url }, data: { avatarUrl: null } }).catch(() => undefined);
      await deleteImage(result.url).catch(() => undefined);
      throw error;
    }
    return result.url;
  } catch (error) {
    console.error("[agency-logo] loqo saxlanmadı:", error);
    return null;
  }
}
