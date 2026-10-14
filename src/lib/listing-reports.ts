import { prisma } from "@/lib/prisma";
import { sha256Hex } from "@/lib/auth/crypto";
import { findManyInChunks } from "@/lib/d1-chunks";
import { publicPropertyWhere } from "@/lib/queries";
import { REPORT_STATUSES, type ReportReason, type ReportStatus } from "@/lib/constants";

/**
 * Elan şikayəti (#159).
 *
 * Ziyarətçi ictimai elanı səbəblə (saxta, satılıb, qiymət yanlışdır, fırıldaq…) bildirir;
 * şikayət admin növbəsinə (`/admin/sikayetler`) düşür. Xam IP saxlanmır — `reporterKey`
 * gizli açarla duzlanmış IP + elan heşidir və yalnız 24 saatlıq təkrarı süzmək üçündür.
 */

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

async function reporterKey(ip: string, propertyId: string): Promise<string> {
  // `AUTH_SECRET` duz kimi: heş sızsa belə IP-ni sadə lüğət hücumu ilə bərpa etmək olmasın.
  return sha256Hex(`${process.env.AUTH_SECRET ?? ""}:report:${ip}:${propertyId}`);
}

export type ReportSubmission = "created" | "duplicate" | "notFound";

export async function submitListingReport(input: {
  propertyId: string;
  reason: ReportReason;
  message: string | null;
  ip: string;
  userId: string | null;
}): Promise<ReportSubmission> {
  const property = await prisma.property.findFirst({
    where: { ...(await publicPropertyWhere()), id: input.propertyId },
    select: { id: true },
  });
  if (!property) return "notFound";

  const key = await reporterKey(input.ip, property.id);
  const recent = await prisma.listingReport.findFirst({
    where: { reporterKey: key, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
    select: { id: true },
  });
  if (recent) return "duplicate";

  await prisma.listingReport.create({
    data: {
      propertyId: property.id,
      reason: input.reason,
      message: input.message,
      reporterUserId: input.userId,
      reporterKey: key,
    },
  });
  return "created";
}

export type ReportGroup = Awaited<ReturnType<typeof getReportGroups>>[number];

/**
 * Admin növbəsi: şikayətlər elan üzrə qruplaşdırılır — eyni elana gələn on şikayət bir
 * sətirdir, səbəblərin bölgüsü və son mesajlar ilə. Ən çox şikayət alan elan birincidir.
 */
export async function getReportGroups(status: ReportStatus = REPORT_STATUSES.OPEN) {
  const reports = await prisma.listingReport.findMany({
    where: { status },
    select: {
      id: true,
      propertyId: true,
      reason: true,
      message: true,
      createdAt: true,
      resolution: true,
      resolutionNote: true,
      resolvedAt: true,
      resolvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const byProperty = new Map<string, typeof reports>();
  for (const report of reports) {
    byProperty.set(report.propertyId, [...(byProperty.get(report.propertyId) ?? []), report]);
  }
  const properties = await findManyInChunks([...byProperty.keys()], 0, (chunk) =>
    prisma.property.findMany({
      where: { id: { in: chunk } },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        listingType: true,
        deletedAt: true,
        riskScore: true,
        author: { select: { name: true, email: true, accountType: true } },
      },
    }),
  );

  return [...byProperty.entries()]
    .flatMap(([propertyId, items]) => {
      const property = properties.find((item) => item.id === propertyId);
      if (!property) return [];
      const reasons = new Map<string, number>();
      for (const item of items) reasons.set(item.reason, (reasons.get(item.reason) ?? 0) + 1);
      return [{
        property,
        reports: items,
        count: items.length,
        latestAt: items[0].createdAt,
        reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]),
      }];
    })
    .sort((a, b) => b.count - a.count || b.latestAt.getTime() - a.latestAt.getTime());
}
