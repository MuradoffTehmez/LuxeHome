import { NextResponse } from "next/server";
import { AUTH_KINDS } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionUser = await getOptionalUser(AUTH_KINDS.PUBLIC);
  if (!sessionUser) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      accountType: true,
      emailVerifiedAt: true,
      approvedAt: true,
      locale: true,
      themePreference: true,
      createdAt: true,
      updatedAt: true,
      agency: { select: { name: true, description: true, phone: true, address: true, website: true, isVerified: true, createdAt: true, updatedAt: true } },
      properties: { select: { id: true, title: true, slug: true, status: true, price: true, currency: true, createdAt: true, updatedAt: true, deletedAt: true } },
      favorites: { select: { createdAt: true, property: { select: { id: true, title: true, slug: true } } } },
      savedSearches: { select: { id: true, name: true, filters: true, frequency: true, enabled: true, createdAt: true } },
      notifications: { select: { id: true, type: true, title: true, content: true, actionUrl: true, readAt: true, createdAt: true } },
      sessions: { select: { createdAt: true, lastSeenAt: true, expiresAt: true, revokedAt: true, authKind: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Hesab tapılmadı" }, { status: 404 });

  const body = JSON.stringify({ exportedAt: new Date().toISOString(), user }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="luxehome-data-${user.id}.json"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
