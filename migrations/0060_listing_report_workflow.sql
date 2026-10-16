-- Elan şikayətlərinin iş axını (#195, PRD v2 Modul 01):
--   * `ListingReport.reasons` — seçilmiş bütün səbəblər (JSON massivi); `reason` əsas səbəb kimi qalır;
--   * `assigneeId` / `reviewStartedAt` — şikayəti götürən moderator;
--   * `infoRequestedAt` / `infoRequestNote` — elan sahibindən izahat istəyi (`NEEDS_INFO`);
--   * `ListingReportEvidence` — daxil olmuş istifadəçinin sübut şəkilləri (R2 `private/` prefiksi).
-- Cədvəl yenidən qurulmur: NULL defoltlu xarici açar sütunu SQLite-də `ADD COLUMN` ilə əlavə olunur.

ALTER TABLE "ListingReport" ADD COLUMN "reasons" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "ListingReport" ADD COLUMN "assigneeId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ListingReport" ADD COLUMN "reviewStartedAt" DATETIME;
ALTER TABLE "ListingReport" ADD COLUMN "infoRequestedAt" DATETIME;
ALTER TABLE "ListingReport" ADD COLUMN "infoRequestNote" TEXT;
CREATE INDEX "ListingReport_assigneeId_status_idx" ON "ListingReport"("assigneeId", "status");

-- Köhnə qeydlərin tək səbəbi massivə köçürülür — növbə və statistika bir sütuna baxsın.
UPDATE "ListingReport" SET "reasons" = json_array("reason") WHERE "reasons" = '[]';

CREATE TABLE "ListingReportEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingReportEvidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ListingReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ListingReportEvidence_key_key" ON "ListingReportEvidence"("key");
CREATE INDEX "ListingReportEvidence_reportId_idx" ON "ListingReportEvidence"("reportId");
