import { NextResponse } from "next/server";
import { AUTH_KINDS, PUBLIC_PROPERTY_STATUSES } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { assertSameOrigin } from "@/lib/request-origin";
import {
  SYSTEM_MAINTENANCE_MESSAGE,
  SYSTEM_READ_ONLY_MESSAGE,
  getSystemMode,
  isPublicApiBlocked,
  maintenanceApiResponse,
  systemModeErrorResponse,
} from "@/lib/system-mode";
import { isWriteBlocked } from "@/lib/system-mode-policy";
import { SYSTEM_MODES } from "@/lib/constants";
import { sanitizeFavoriteIds } from "@/lib/favorite-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function account() {
  return getOptionalUser(AUTH_KINDS.PUBLIC);
}

export async function GET() {
  // Texniki xidmət rejimində ictimai API də bağlanır: middleware matcher-i
  // `/api/*` yollarını görmür, ona görə yoxlama burada təkrarlanır.
  if (await isPublicApiBlocked()) return maintenanceApiResponse();

  const user = await account();
  // Favoritlər qeydiyyatsız istifadəçidə localStorage-də işləyir. GET sorğusu
  // yalnız giriş vəziyyətini bildirir və şəxsi məlumat qaytarmır; beləliklə hər
  // kart anonim istifadəçi üçün ayrıca 401 konsol xətası yaratmır.
  if (!user) {
    return NextResponse.json(
      { ids: [], signedIn: false },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const rows = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { propertyId: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(
    { ids: rows.map((row) => row.propertyId), signedIn: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PUT(request: Request) {
  try {
    await assertSameOrigin();
  } catch {
    return NextResponse.json({ error: "Sorğunun mənbəyi qəbul edilmədi" }, { status: 403 });
  }

  // Favorit sinxronizasiyası `Favorite` sətirlərini yazır — həm `READ_ONLY`,
  // həm də `MAINTENANCE` rejimində bloklanır. Cavabdakı kod **həqiqi**
  // rejimdən gəlməlidir: müştəri tərəf iki halı ayırd edir.
  const mode = await getSystemMode();
  if (isWriteBlocked(mode, false)) {
    return systemModeErrorResponse({
      mode,
      message:
        mode === SYSTEM_MODES.MAINTENANCE
          ? SYSTEM_MAINTENANCE_MESSAGE
          : SYSTEM_READ_ONLY_MESSAGE,
    });
  }
  const user = await account();
  if (!user) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const payload = await request.json().catch(() => null) as { ids?: unknown } | null;
  const requested = sanitizeFavoriteIds(payload?.ids);
  const properties = requested.length > 0 ? await prisma.property.findMany({
    where: {
      id: { in: requested },
      deletedAt: null,
      isDemo: false,
      status: { in: [...PUBLIC_PROPERTY_STATUSES] },
    },
    select: { id: true },
  }) : [];
  const ids = properties.map((property) => property.id);

  await prisma.favorite.deleteMany({
    where: ids.length > 0 ? { userId: user.id, propertyId: { notIn: ids } } : { userId: user.id },
  });
  const existing = await prisma.favorite.findMany({ where: { userId: user.id, propertyId: { in: ids } }, select: { propertyId: true } });
  const existingIds = new Set(existing.map((item) => item.propertyId));
  for (const propertyId of ids) {
    if (!existingIds.has(propertyId)) await prisma.favorite.create({ data: { userId: user.id, propertyId } });
  }

  return NextResponse.json({ ids });
}
