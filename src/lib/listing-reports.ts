import { prisma } from "@/lib/prisma";
import { sha256Hex } from "@/lib/auth/crypto";
import { findManyInChunks } from "@/lib/d1-chunks";
import { publicPropertyWhere } from "@/lib/queries";
import { deletePrivateImage, putPrivateImage } from "@/lib/media/storage";
import {
  ACTIVE_REPORT_STATUSES,
  HIGH_PRIORITY_REPORT_REASONS,
  LEGACY_REPORT_REASONS,
  REPORT_EVIDENCE_MAX_BYTES,
  REPORT_EVIDENCE_MAX_FILES,
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_URGENT_THRESHOLD,
  type ReportReason,
  type ReportStatus,
  type StoredReportReason,
} from "@/lib/constants";

/**
 * Elan şikayəti (#159, iş axını #195).
 *
 * Ziyarətçi ictimai elanı bir və ya bir neçə səbəblə bildirir; daxil olmuş istifadəçi sübut
 * şəkli də əlavə edə bilir. Şikayət admin növbəsinə (`/admin/sikayetler`) düşür və
 * `OPEN → IN_REVIEW → NEEDS_INFO → RESOLVED | DISMISSED | CLOSED` mərhələlərindən keçir.
 * Qərar elan üzrədir: eyni elanın bütün aktiv şikayətləri birlikdə hərəkət edir.
 *
 * Xam IP saxlanmır — `reporterKey` gizli açarla duzlanmış IP + elan heşidir və yalnız
 * 24 saatlıq təkrarı süzmək üçündür.
 */

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Sübutların R2 qovluğu — `private/` prefiksinin altında (`putPrivateImage`). */
const EVIDENCE_FOLDER = "sikayet-subutlari";
const STATS_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

const ACTIVE_WHERE = { status: { in: [...ACTIVE_REPORT_STATUSES] } };

async function reporterKey(ip: string, propertyId: string): Promise<string> {
  // `AUTH_SECRET` duz kimi: heş sızsa belə IP-ni sadə lüğət hücumu ilə bərpa etmək olmasın.
  return sha256Hex(`${process.env.AUTH_SECRET ?? ""}:report:${ip}:${propertyId}`);
}

function isStoredReason(value: unknown): value is StoredReportReason {
  return typeof value === "string" && Object.hasOwn(REPORT_REASON_LABELS, value);
}

/**
 * Bazadakı `reasons` JSON-u → səbəb siyahısı. Köhnə (#159) və ya pozulmuş qeyddə tək `reason`
 * sütununa qayıdır; naməlum dəyərlər atılır ki, panel açar adını göstərməsin.
 */
export function parseReportReasons(json: string | null | undefined, fallback: string): StoredReportReason[] {
  let parsed: unknown = null;
  try {
    parsed = json ? JSON.parse(json) : null;
  } catch {
    parsed = null;
  }
  const list = Array.isArray(parsed) ? [...new Set(parsed.filter(isStoredReason))] : [];
  if (list.length > 0) return list;
  return isStoredReason(fallback) ? [fallback] : [LEGACY_REPORT_REASONS.WRONG_INFO];
}

/** Sayından asılı olmayaraq yüksək prioritetli səbəb və ya çoxsaylı şikayət növbədə yuxarı qalxır. */
export function reportPriority(count: number, reasons: readonly StoredReportReason[]): "high" | "normal" {
  if (count >= REPORT_URGENT_THRESHOLD) return "high";
  return reasons.some((reason) => HIGH_PRIORITY_REPORT_REASONS.includes(reason)) ? "high" : "normal";
}

export type ReportSubmission = "created" | "duplicate" | "notFound";

export async function submitListingReport(input: {
  propertyId: string;
  reasons: readonly ReportReason[];
  message: string | null;
  ip: string;
  userId: string | null;
  /** Yalnız daxil olmuş istifadəçidən (action yoxlayır); bu qat da `userId` olmadan atır. */
  evidence?: readonly File[];
}): Promise<ReportSubmission> {
  const reasons = [...new Set(input.reasons)];
  if (reasons.length === 0) throw new Error("Şikayətin ən azı bir səbəbi olmalıdır.");
  const evidence = input.userId ? (input.evidence ?? []).slice(0, REPORT_EVIDENCE_MAX_FILES) : [];

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

  // Moderator elanı artıq yoxlayırsa, yeni şikayət eyni mərhələyə və moderatora qoşulur —
  // əks halda qrup iki tabda görünər, qərar da yalnız bir hissəni bağlayardı.
  const inFlight = await prisma.listingReport.findFirst({
    where: { propertyId: property.id, status: { in: [REPORT_STATUSES.IN_REVIEW, REPORT_STATUSES.NEEDS_INFO] } },
    select: { status: true, assigneeId: true, reviewStartedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const report = await prisma.listingReport.create({
    data: {
      propertyId: property.id,
      reason: reasons[0],
      reasons: JSON.stringify(reasons),
      message: input.message,
      reporterUserId: input.userId,
      reporterKey: key,
      ...(inFlight
        ? { status: inFlight.status, assigneeId: inFlight.assigneeId, reviewStartedAt: inFlight.reviewStartedAt }
        : {}),
    },
    select: { id: true },
  });

  await storeEvidence(report.id, evidence);
  return "created";
}

/**
 * Sübut şəkilləri şikayət yazılandan sonra saxlanılır: şəkil xətası şikayəti itirməməlidir.
 * Sətir yazılmasa fayl R2-dən silinir (D1-də tranzaksiya yoxdur).
 */
async function storeEvidence(reportId: string, files: readonly File[]): Promise<void> {
  for (const file of files) {
    try {
      const stored = await putPrivateImage(file, EVIDENCE_FOLDER, REPORT_EVIDENCE_MAX_BYTES);
      if (!stored.ok) {
        console.error("[listing-report] sübut qəbul edilmədi:", stored.reason);
        continue;
      }
      try {
        await prisma.listingReportEvidence.create({
          data: { reportId, key: stored.key, contentType: stored.contentType, size: stored.size },
        });
      } catch (error) {
        await deletePrivateImage(stored.key).catch(() => undefined);
        throw error;
      }
    } catch (error) {
      console.error("[listing-report] sübut saxlanmadı:", error);
    }
  }
}

/** Admin marşrutu üçün sübutun R2 açarı və növü; tapılmasa `null`. */
export async function getReportEvidence(id: string) {
  return prisma.listingReportEvidence.findUnique({
    where: { id },
    select: { key: true, contentType: true },
  });
}

// ─── Status keçidləri ────────────────────────────────────────────────────────────────

/**
 * Moderator elanın aktiv şikayətlərini götürür: yeni olanlar «Yoxlanılır»-a keçir,
 * məlumat gözləyənlər mərhələsini saxlayır. Qaytarılan say 0-dırsa aktiv şikayət yoxdur.
 */
export async function assignActiveReports(propertyId: string, assigneeId: string, now = new Date()): Promise<number> {
  const opened = await prisma.listingReport.updateMany({
    where: { propertyId, status: REPORT_STATUSES.OPEN },
    data: { status: REPORT_STATUSES.IN_REVIEW, assigneeId, reviewStartedAt: now },
  });
  const ongoing = await prisma.listingReport.updateMany({
    where: {
      propertyId,
      status: { in: [REPORT_STATUSES.IN_REVIEW, REPORT_STATUSES.NEEDS_INFO] },
      OR: [{ assigneeId: null }, { assigneeId: { not: assigneeId } }],
    },
    data: { assigneeId },
  });
  if (opened.count + ongoing.count > 0) return opened.count + ongoing.count;
  return prisma.listingReport.count({ where: { propertyId, ...ACTIVE_WHERE } });
}

/** Elan sahibindən izahat istənildi — aktiv şikayətlər «Əlavə məlumat gözlənilir»-ə keçir. */
export async function requestReportInfo(input: {
  propertyId: string;
  actorId: string;
  note: string;
  now?: Date;
}): Promise<number> {
  const now = input.now ?? new Date();
  const { count } = await prisma.listingReport.updateMany({
    where: { propertyId: input.propertyId, status: { in: [REPORT_STATUSES.OPEN, REPORT_STATUSES.IN_REVIEW] } },
    data: { status: REPORT_STATUSES.NEEDS_INFO, infoRequestedAt: now, infoRequestNote: input.note, assigneeId: input.actorId },
  });
  // Artıq məlumat gözləyən qrupda yalnız mətn və vaxt yenilənir.
  if (count === 0) {
    const repeated = await prisma.listingReport.updateMany({
      where: { propertyId: input.propertyId, status: REPORT_STATUSES.NEEDS_INFO },
      data: { infoRequestedAt: now, infoRequestNote: input.note },
    });
    return repeated.count;
  }
  return count;
}

/**
 * Qərar verilmiş şikayətləri yenidən nəzərdən keçirməyə qaytarır. Elana tətbiq olunmuş tədbir
 * (dayandırma, bağlama) avtomatik geri alınmır — moderator yeni qərarı ayrıca verir.
 * Yalnız elanın **son** qərarının şikayətləri açılır, daha köhnə bağlanmış dövrlər qalır.
 */
export async function reopenDecidedReports(propertyId: string, actorId: string, now = new Date()): Promise<number> {
  const latest = await prisma.listingReport.findFirst({
    where: { propertyId, status: { notIn: [...ACTIVE_REPORT_STATUSES] }, resolvedAt: { not: null } },
    select: { resolvedAt: true },
    orderBy: { resolvedAt: "desc" },
  });
  if (!latest?.resolvedAt) return 0;
  const { count } = await prisma.listingReport.updateMany({
    where: { propertyId, resolvedAt: latest.resolvedAt, status: { notIn: [...ACTIVE_REPORT_STATUSES] } },
    data: {
      status: REPORT_STATUSES.IN_REVIEW,
      assigneeId: actorId,
      reviewStartedAt: now,
      resolution: null,
      resolutionNote: null,
      resolvedById: null,
      resolvedAt: null,
    },
  });
  return count;
}

/** Aktiv şikayət yazan daxil olmuş istifadəçilər — qərar onlara bildirilir. */
export async function activeReporterIds(propertyId: string): Promise<string[]> {
  const rows = await prisma.listingReport.findMany({
    where: { propertyId, ...ACTIVE_WHERE, reporterUserId: { not: null } },
    select: { reporterUserId: true },
  });
  return [...new Set(rows.flatMap((row) => (row.reporterUserId ? [row.reporterUserId] : [])))];
}

// ─── Admin növbəsi ───────────────────────────────────────────────────────────────────

export type ReportGroup = Awaited<ReturnType<typeof getReportGroups>>[number];

/**
 * Admin növbəsi: şikayətlər elan üzrə qruplaşdırılır — eyni elana gələn on şikayət bir
 * sətirdir, səbəblərin bölgüsü, sübutlar və son mesajlar ilə. Yüksək prioritetli və ən çox
 * şikayət alan elan birincidir.
 */
export async function getReportGroups(
  statuses: readonly ReportStatus[] = ACTIVE_REPORT_STATUSES,
  options: { assigneeId?: string } = {},
) {
  const reports = await prisma.listingReport.findMany({
    where: { status: { in: [...statuses] }, ...(options.assigneeId ? { assigneeId: options.assigneeId } : {}) },
    select: {
      id: true,
      propertyId: true,
      reason: true,
      reasons: true,
      message: true,
      status: true,
      createdAt: true,
      reviewStartedAt: true,
      infoRequestedAt: true,
      infoRequestNote: true,
      resolution: true,
      resolutionNote: true,
      resolvedAt: true,
      reporterUserId: true,
      resolvedBy: { select: { name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const evidence = await findManyInChunks(reports.map((report) => report.id), 0, (chunk) =>
    prisma.listingReportEvidence.findMany({
      where: { reportId: { in: chunk } },
      select: { id: true, reportId: true },
      orderBy: { createdAt: "asc" },
    }),
  );

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
      const reasons = new Map<StoredReportReason, number>();
      const enriched = items.map((item) => {
        const list = parseReportReasons(item.reasons, item.reason);
        for (const reason of list) reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
        return {
          ...item,
          reasons: list,
          evidence: evidence.filter((file) => file.reportId === item.id).map((file) => file.id),
        };
      });
      const reasonList = [...reasons.keys()];
      const withInfo = items.find((item) => item.infoRequestNote);
      return [{
        property,
        reports: enriched,
        count: items.length,
        latestAt: items[0].createdAt,
        // Qrupun mərhələsi və moderatoru ən son şikayətdən — yeni şikayət onları miras alır.
        status: items[0].status as ReportStatus,
        assignee: items.find((item) => item.assignee)?.assignee ?? null,
        infoRequest: withInfo?.infoRequestNote ? { note: withInfo.infoRequestNote, at: withInfo.infoRequestedAt } : null,
        evidenceCount: enriched.reduce((sum, item) => sum + item.evidence.length, 0),
        priority: reportPriority(items.length, reasonList),
        reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]),
      }];
    })
    .sort((a, b) =>
      Number(b.priority === "high") - Number(a.priority === "high")
      || b.count - a.count
      || b.latestAt.getTime() - a.latestAt.getTime());
}

export type ReportQueueStats = Awaited<ReturnType<typeof getReportQueueStats>>;

/**
 * Növbənin göstəriciləri (PRD 3.6): status üzrə say, yüksək prioritetli və təkrarlanan
 * (2+ aktiv şikayətli) elanlar, son 90 gündə təsdiq faizi və orta həll müddəti.
 */
export async function getReportQueueStats(now = new Date()) {
  const since = new Date(now.getTime() - STATS_WINDOW_MS);
  const [byStatus, active, decided] = await Promise.all([
    prisma.listingReport.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.listingReport.findMany({ where: ACTIVE_WHERE, select: { propertyId: true, reason: true, reasons: true }, take: 2000 }),
    prisma.listingReport.findMany({
      where: { resolvedAt: { gte: since }, status: { in: [REPORT_STATUSES.RESOLVED, REPORT_STATUSES.DISMISSED] } },
      select: { status: true, createdAt: true, resolvedAt: true },
      take: 2000,
    }),
  ]);

  const counts = Object.fromEntries(Object.values(REPORT_STATUSES).map((status) => [status, 0])) as Record<ReportStatus, number>;
  for (const row of byStatus) {
    if (row.status in counts) counts[row.status as ReportStatus] = row._count._all;
  }

  const groups = new Map<string, StoredReportReason[][]>();
  for (const row of active) {
    groups.set(row.propertyId, [...(groups.get(row.propertyId) ?? []), parseReportReasons(row.reasons, row.reason)]);
  }
  let highPriority = 0;
  let repeated = 0;
  for (const lists of groups.values()) {
    if (lists.length >= 2) repeated += 1;
    if (reportPriority(lists.length, lists.flat()) === "high") highPriority += 1;
  }

  const confirmed = decided.filter((row) => row.status === REPORT_STATUSES.RESOLVED).length;
  const durations = decided.flatMap((row) => (row.resolvedAt ? [row.resolvedAt.getTime() - row.createdAt.getTime()] : []));

  return {
    counts,
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    highPriority,
    repeated,
    confirmedRate: decided.length > 0 ? Math.round((confirmed / decided.length) * 100) : null,
    averageResolutionHours: durations.length > 0
      // Bir onluq dəqiqliklə — 1 saatdan az orta müddət panel «1 saatdan az» yazsın, «0 saat» yox.
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 360_000) / 10
      : null,
  };
}
