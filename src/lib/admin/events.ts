import { prisma } from "@/lib/prisma";

/**
 * Yüngül domen hadisə jurnalı (outbox pattern).
 *
 * `recordAudit`-dən fərqi: "kim etdi" deyil, "sistemdə nə baş verdi" səviyyəsidir.
 * D1-də transaction yoxdur — yazılış uğursuz olsa əsas əməliyyat geri qaytarılmır,
 * xəta udulub log-a düşür.
 */

export type DomainEventType =
  | "property.published"
  | "property.status_changed"
  | "agency.employee_invited"
  | "agency.employee_approved"
  | "agency.employee_rejected"
  | "agency.employee_removed"
  | "reservation.requested"
  | "reservation.status_changed"
  | "lead.created";

export type DomainEventEntityType = "Property" | "Agency" | "AgencyEmployee" | "Lead" | "Reservation";

export async function recordDomainEvent(
  type: DomainEventType,
  entityType: DomainEventEntityType,
  entityId: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.domainEvent.create({
      data: {
        type,
        entityType,
        entityId,
        payload: payload ? JSON.stringify(payload) : null,
      },
    });
  } catch (error) {
    console.error("[admin] domen hadisəsi yazılmadı:", error);
  }
}
