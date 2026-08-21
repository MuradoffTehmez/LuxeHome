import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { MEDIA_FOLDERS, putImage, type MediaFolder } from "@/lib/media/storage";

/**
 * Şəkil yükləmə.
 *
 * Server Action deyil, çünki `multipart/form-data` gövdəsi action-lar üçün əlverişsizdir
 * və yükləmə prosesi UI-da irəliləyiş göstərməlidir. Guard eyni funksiyadır:
 * `requireAdminAction()` mənbəni, səlahiyyəti və sürət limitini yoxlayır.
 */

export const dynamic = "force-dynamic";

function isFolder(value: string): value is MediaFolder {
  return (MEDIA_FOLDERS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.MEDIA_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl tapılmadı." }, { status: 400 });
  }

  const rawFolder = String(formData.get("folder") ?? "umumi");
  const folder: MediaFolder = isFolder(rawFolder) ? rawFolder : "umumi";

  const result = await putImage(file, folder);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Orijinal ad yalnız məlumat kimi saxlanılır — heç bir yolda istifadə edilmir
  const media = await prisma.media.create({
    data: {
      url: result.url,
      thumbUrl: result.thumbUrl,
      originalName: file.name.slice(0, 160),
      mimeType: result.mimeType,
      size: result.size,
      width: result.width ?? null,
      height: result.height ?? null,
      uploaderId: user.id,
    },
    select: { id: true, url: true, thumbUrl: true, originalName: true },
  });

  await recordAudit(user, "UPLOAD", "Media", media.id, media.originalName);

  return NextResponse.json(media, { status: 201 });
}
