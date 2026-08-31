import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth/types";
import { requestIp } from "./guard";

/**
 * Panel əməliyyatlarının izi.
 *
 * Jurnal kritik yol deyil: yazılışı uğursuz olsa da əsas əməliyyat geri qaytarılmır
 * (D1-də transaction yoxdur, geri qaytarmaq da mümkün deyil). Buna görə xəta udulur
 * və yalnız log-a düşür — əks halda uğurlu redaktə istifadəçiyə xəta kimi görünərdi.
 */

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RESTORE"
  | "PUBLISH"
  | "UNPUBLISH"
  | "VERIFY"
  | "STATUS_CHANGE"
  | "RELATION_CHANGE"
  | "EXPIRE"
  | "UPLOAD"
  | "ROLE_CHANGE"
  | "SESSION_REVOKE"
  | "RESET"
  | "TEST";

export type AuditEntity =
  | "Property"
  | "Project"
  | "BlogPost"
  | "BlogCategory"
  | "Service"
  | "Lead"
  | "Media"
  | "User"
  | "Agency"
  | "Partner"
  | "Redirect"
  | "Setting"
  | "ContentTranslation"
  | "Reservation"
  | "AgentProfile"
  | "AgentReview"
  | "Testimonial"
  | "KnowledgeArticle"
  | "KnowledgeCategory"
  | "KnowledgeTerm"
  | "KnowledgeFaq"
  | "AuditLog"
  | "AiProvider"
  | "SeoMetadata"
  | "SeoLandingPage"
  | "SeoKeyword"
  | "EntityProfile"
  | "SeoAuditIssue"
  | "SeoSearchMetric";

export async function recordAudit(
  user: Pick<AuthUser, "id" | "email">,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string | null,
  summary?: string | null,
  changes?: { oldValue?: unknown; newValue?: unknown },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action,
        entity,
        entityId,
        summary: summary ?? null,
        oldValue: changes?.oldValue === undefined ? null : JSON.stringify(changes.oldValue),
        newValue: changes?.newValue === undefined ? null : JSON.stringify(changes.newValue),
        ip: await requestIp(),
      },
    });
  } catch (error) {
    console.error("[admin] audit jurnalı yazılmadı:", error);
  }
}
