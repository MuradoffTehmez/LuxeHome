import { LEAD_ALERT_GRACE_HOURS, LEAD_ALERT_LIMITS } from "@/lib/constants";

/**
 * Cavabsız müraciət pillələri (#224, PRD 8.5) — saf modul (Prisma yoxdur), həm cron işi
 * (`lead-jobs.ts`), həm kabinet forması işlədir.
 *
 * 1. `reminder` — məsul şəxsə ilkin xatırlatma;
 * 2. `alert` — agentlik sahibinə və müraciət idarəetmə səlahiyyətli menecerlərə bildiriş;
 * 3. `reassign` — təkrar təyinat təklifi.
 */

export type LeadAlertStep = "reminder" | "alert" | "reassign";
export const LEAD_ALERT_STEPS: readonly LeadAlertStep[] = ["reminder", "alert", "reassign"];

export type LeadAlertConfig = Record<LeadAlertStep, number>;

export const DEFAULT_LEAD_ALERT_CONFIG: LeadAlertConfig = {
  reminder: LEAD_ALERT_LIMITS.reminder.default,
  alert: LEAD_ALERT_LIMITS.alert.default,
  reassign: LEAD_ALERT_LIMITS.reassign.default,
};

/** Bazadakı agentlik sahələri → konfiqurasiya; hədd xaricindəki (əl ilə yazılmış) dəyər defolta düşür. */
export function leadAlertConfigOf(agency: {
  leadReminderMinutes: number;
  leadAlertMinutes: number;
  leadReassignMinutes: number;
}): LeadAlertConfig {
  const config: LeadAlertConfig = {
    reminder: agency.leadReminderMinutes,
    alert: agency.leadAlertMinutes,
    reassign: agency.leadReassignMinutes,
  };
  return validateLeadAlertConfig(config).ok ? config : DEFAULT_LEAD_ALERT_CONFIG;
}

export type LeadAlertValidation =
  | { ok: true; config: LeadAlertConfig }
  | { ok: false; error: "range" | "order" };

/** Hər pillə öz həddindədir və artan sıradadır (xatırlatma < bildiriş < təkrar təyinat). */
export function validateLeadAlertConfig(input: Record<LeadAlertStep, unknown>): LeadAlertValidation {
  const config = {} as LeadAlertConfig;
  for (const step of LEAD_ALERT_STEPS) {
    const value = Number(input[step]);
    const limit = LEAD_ALERT_LIMITS[step];
    if (!Number.isInteger(value) || value < limit.min || value > limit.max) return { ok: false, error: "range" };
    config[step] = value;
  }
  if (!(config.reminder < config.alert && config.alert < config.reassign)) return { ok: false, error: "order" };
  return { ok: true, config };
}

export type LeadAlertMarkers = Record<LeadAlertStep, Date | null>;

/**
 * Bu an üçün hər pillənin vəziyyəti: `due` — bildiriş göndərilməlidir; `expired` — hədd
 * `LEAD_ALERT_GRACE_HOURS`-dan çox əvvəl keçib, bildirişsiz bağlanır (köhnə yığın bir anda
 * bildiriş yağdırmasın və müraciət hər cron-da yenidən taranmasın). Marker doludursa və ya
 * hədd hələ çatmayıbsa pillə siyahıya düşmür. Bir neçə pillə birdən çatıbsa (cron gecikib və ya
 * müddət qısaldılıb) yalnız sonuncusu göndərilir, əvvəlkilər bildirişsiz bağlanır.
 */
export function leadAlertSteps(
  createdAt: Date,
  now: Date,
  config: LeadAlertConfig,
  markers: LeadAlertMarkers,
): { step: LeadAlertStep; state: "due" | "expired" }[] {
  const ageMinutes = (now.getTime() - createdAt.getTime()) / 60_000;
  const grace = LEAD_ALERT_GRACE_HOURS * 60;
  const steps: { step: LeadAlertStep; state: "due" | "expired" }[] = [];
  for (const step of LEAD_ALERT_STEPS) {
    if (markers[step] || ageMinutes < config[step]) continue;
    steps.push({ step, state: ageMinutes <= config[step] + grace ? "due" : "expired" });
  }
  let lastDue = -1;
  steps.forEach((item, index) => {
    if (item.state === "due") lastDue = index;
  });
  for (let index = 0; index < lastDue; index += 1) steps[index].state = "expired";
  return steps;
}

/** Cron taramasının pəncərəsi: ən qısa mümkün həddən ən uzun mümkün hədd + güzəştə qədər. */
export function leadAlertScanWindow(now: Date): { from: Date; to: Date } {
  return {
    from: new Date(now.getTime() - (LEAD_ALERT_LIMITS.reassign.max + LEAD_ALERT_GRACE_HOURS * 60) * 60_000),
    to: new Date(now.getTime() - LEAD_ALERT_LIMITS.reminder.min * 60_000),
  };
}
