-- Agentlik elan sahibliyi və üzvlük tarixçəsi (#210, PRD v2 Modul 04: 6.2, 6.3, 6.6).

ALTER TABLE "Property" ADD COLUMN "agencyId" TEXT REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Property" ADD COLUMN "createdById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Property_agencyId_authorId_idx" ON "Property"("agencyId", "authorId");

CREATE TABLE "AgencyMembershipHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT,
    "agencyName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "joinedAt" DATETIME NOT NULL,
    "leftAt" DATETIME,
    "endReason" TEXT,
    "handedOver" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AgencyMembershipHistory_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AgencyMembershipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AgencyMembershipHistory_userId_joinedAt_idx" ON "AgencyMembershipHistory"("userId", "joinedAt");
CREATE INDEX "AgencyMembershipHistory_agencyId_leftAt_idx" ON "AgencyMembershipHistory"("agencyId", "leftAt");

-- Mövcud elanlar: yaradan = hazırkı müəllif. Agentlik sahibinin və təsdiqlənmiş agentin elanı
-- agentlik mühitinə aid sayılır (PRD 6.2 defoltu) — əvvəl şəxsi/agentlik fərqi saxlanmırdı.
UPDATE "Property" SET "createdById" = "authorId" WHERE "createdById" IS NULL;
UPDATE "Property"
SET "agencyId" = (SELECT "id" FROM "Agency" WHERE "Agency"."userId" = "Property"."authorId")
WHERE "agencyId" IS NULL AND "authorId" IN (SELECT "userId" FROM "Agency");
UPDATE "Property"
SET "agencyId" = (
    SELECT "agencyId" FROM "AgencyEmployee"
    WHERE "AgencyEmployee"."userId" = "Property"."authorId" AND "AgencyEmployee"."status" = 'APPROVED'
    LIMIT 1
)
WHERE "agencyId" IS NULL
  AND "authorId" IN (SELECT "userId" FROM "AgencyEmployee" WHERE "status" = 'APPROVED');

-- Hazırkı təsdiqlənmiş üzvlüklər açıq tarixçə dövrü kimi başlayır.
INSERT OR IGNORE INTO "AgencyMembershipHistory" ("id", "agencyId", "agencyName", "userId", "role", "joinedAt")
SELECT 'amh_' || e."id", e."agencyId", a."name", e."userId", e."role", COALESCE(e."approvedAt", e."invitedAt")
FROM "AgencyEmployee" e
JOIN "Agency" a ON a."id" = e."agencyId"
WHERE e."status" = 'APPROVED';
