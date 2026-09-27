import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, PERMISSIONS, type Role } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";
import { buildIcs } from "@/lib/calendar-ics";
import { getStaffCalendar } from "@/lib/calendar-events";

/**
 * Əməkdaşın şəxsi təqvim abunəsi (#109): `/api/calendar/<token>`.
 *
 * Təqvim tətbiqləri cookie göndərmir, ona görə giriş yalnız gizli açarladır — açar
 * «Hesabım» səhifəsində yaradılır və yenidən yaradılanda köhnə link dərhal ölür.
 * Deaktiv və ya əməkdaş olmayan hesabın linki 404 qaytarır (mövcudluğu bildirilmir).
 */

export const dynamic = "force-dynamic";

const PAST_DAYS = 14;
const FUTURE_DAYS = 120;

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const clean = token.replace(/\.ics$/, "");
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(clean)) return new Response("Tapılmadı", { status: 404 });

  const user = await prisma.user.findUnique({
    where: { calendarToken: clean },
    select: { id: true, name: true, role: true, isActive: true, accountType: true },
  });
  if (!user || !user.isActive || user.accountType !== ACCOUNT_TYPES.STAFF) return new Response("Tapılmadı", { status: 404 });

  const now = Date.now();
  const events = await getStaffCalendar({
    userId: user.id,
    all: hasPermission(user.role as Role, PERMISSIONS.LEAD_MANAGE),
    from: new Date(now - PAST_DAYS * 86_400_000),
    to: new Date(now + FUTURE_DAYS * 86_400_000),
  });
  return new Response(buildIcs(`Luxe Home Estate — ${user.name}`, events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=\"luxehome.ics\"",
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
