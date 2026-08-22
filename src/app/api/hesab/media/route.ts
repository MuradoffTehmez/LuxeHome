import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdminGuardError, assertSameOrigin } from "@/lib/admin/guard";
import { requireLister } from "@/lib/auth/guard";
import { putImage } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

/**
 * Kabinetdən əmlak şəkli yükləmə.
 *
 * Qovluq müştəridən qəbul edilmir: ictimai hesab yalnız öz əmlak şəkillərini
 * `emlaklar` altında yükləyə bilər. Şəkil hələ elana bağlanmayıbsa da silinmir;
 * istifadəçi forma xətasını düzəldib həmin yükləməni yenidən göndərə bilir.
 */
export async function POST(request: Request) {
  let user;
  try {
    await assertSameOrigin();
    user = await requireLister();
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

  const result = await putImage(file, "emlaklar");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

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

  return NextResponse.json(media, { status: 201 });
}
