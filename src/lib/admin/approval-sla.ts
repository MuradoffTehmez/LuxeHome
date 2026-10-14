/**
 * Təsdiq növbəsinin SLA-sı (#157): müraciət nə qədər gözləyir və hansı rəngdə göstərilir.
 * Prisma-sız saf modul — həm panel səhifəsi, həm testlər işlədir.
 *
 * - `fresh`   — 24 saatdan az: normal axın;
 * - `due`     — 24–72 saat: bu gün baxılmalıdır (sarı);
 * - `overdue` — 72 saatdan çox: gecikib (qırmızı), növbənin başında görünür.
 */
export const APPROVAL_SLA_HOURS = { due: 24, overdue: 72 } as const;

export type ApprovalSlaLevel = "fresh" | "due" | "overdue";

export type ApprovalSla = {
  level: ApprovalSlaLevel;
  /** Tam saat — 0-dan başlayır. */
  hours: number;
  /** Tam gün — mətndə 48 saatdan sonra gün göstərilir. */
  days: number;
};

const HOUR = 60 * 60 * 1000;

export function approvalSla(since: Date | string, now: Date = new Date()): ApprovalSla {
  const elapsed = Math.max(0, now.getTime() - new Date(since).getTime());
  const hours = Math.floor(elapsed / HOUR);
  const level: ApprovalSlaLevel = hours >= APPROVAL_SLA_HOURS.overdue
    ? "overdue"
    : hours >= APPROVAL_SLA_HOURS.due
      ? "due"
      : "fresh";
  return { level, hours, days: Math.floor(hours / 24) };
}

/** Badge tonu: dizayn sisteminin semantik rəngləri. */
export const APPROVAL_SLA_TONE: Record<ApprovalSlaLevel, "neutral" | "warning" | "danger"> = {
  fresh: "neutral",
  due: "warning",
  overdue: "danger",
};
