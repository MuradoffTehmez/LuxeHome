import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { AdminGuardError, RateLimitGuardError, SystemModeGuardError, requireAdminAction } from "@/lib/admin/guard";
import { systemModeErrorResponse } from "@/lib/system-mode";
import { recordAudit } from "@/lib/admin/audit";
import { MEDIA_FOLDERS, deleteImage, putImage, uploadFailureStatus, type MediaFolder } from "@/lib/media/storage";
import { createMediaRecordOnce, parseClientUploadId } from "@/lib/media/upload-record";

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
    // Sistem rejimi bloku 503 + strukturlaşdırılmış kodla qaytarılır ki,
    // müştəri tərəf onu icazə xətasından (403) ayırd edə bilsin.
    if (error instanceof SystemModeGuardError) return systemModeErrorResponse(error);
    // 429 — client növbəsi bunu keçici sayıb gözləyərək təkrar cəhd edir.
    if (error instanceof RateLimitGuardError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
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

  // Təkrar cəhd (cavab itəndə) eyni açarla gəlir — şəkil yenidən emal olunmur,
  // ikinci R2 obyekti və `Media` sətri yaranmır.
  const clientUploadId = parseClientUploadId(formData.get("uploadId"));
  const mediaSelect = { id: true, url: true, thumbUrl: true, originalName: true } as const;
  const findExisting = () =>
    clientUploadId
      ? prisma.media.findUnique({
          where: { uploaderId_clientUploadId: { uploaderId: user.id, clientUploadId } },
          select: mediaSelect,
        })
      : Promise.resolve(null);
  const existing = await findExisting();
  if (existing) return NextResponse.json(existing, { status: 200 });

  const rawFolder = String(formData.get("folder") ?? "umumi");
  const folder: MediaFolder = isFolder(rawFolder) ? rawFolder : "umumi";

  const result = await putImage(file, folder, String(formData.get("seoName") ?? ""));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: uploadFailureStatus(result.reason) });
  }

  // Orijinal ad yalnız məlumat kimi saxlanılır — heç bir yolda istifadə edilmir.
  // Sətir yazılmasa R2 obyekti geri silinir.
  let media;
  try {
    media = await createMediaRecordOnce(
      {
        createRecord: () =>
          prisma.media.create({
            data: {
              url: result.url,
              thumbUrl: result.thumbUrl,
              originalName: file.name.slice(0, 160),
              mimeType: result.mimeType,
              size: result.size,
              width: result.width ?? null,
              height: result.height ?? null,
              uploaderId: user.id,
              checksum: result.checksum,
              watermarkApplied: result.watermarkApplied,
              clientUploadId,
            },
            select: mediaSelect,
          }),
        findExisting,
        deleteImage,
        logCleanupFailure: (error) => console.error("[media] R2 rollback alınmadı:", error),
      },
      result.url,
    );
  } catch (error) {
    console.error("[media] Media sətri yaradıla bilmədi:", error);
    return NextResponse.json({ error: "Yükləmə tamamlanmadı. Bir az sonra yenidən cəhd edin." }, { status: 500 });
  }

  await recordAudit(user, "UPLOAD", "Media", media.id, media.originalName);

  return NextResponse.json(media, { status: 201 });
}
