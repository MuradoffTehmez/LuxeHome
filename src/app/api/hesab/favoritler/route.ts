import { NextResponse } from "next/server";
import { AUTH_KINDS, PUBLIC_PROPERTY_STATUSES } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { assertSameOrigin } from "@/lib/request-origin";
import { sanitizeFavoriteIds } from "@/lib/favorite-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function account() {
  return getOptionalUser(AUTH_KINDS.PUBLIC);
}

export async function GET() {
  const user = await account();
  if (!user) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  const rows = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { propertyId: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ ids: rows.map((row) => row.propertyId) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  try {
    await assertSameOrigin();
  } catch {
    return NextResponse.json({ error: "Sorğunun mənbəyi qəbul edilmədi" }, { status: 403 });
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
