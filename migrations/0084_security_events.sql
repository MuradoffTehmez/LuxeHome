-- Təhlükəsizlik hadisələri jurnalı (#264, PRD v2 Modul 21).
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "SecurityEvent_kind_createdAt_idx" ON "SecurityEvent"("kind", "createdAt");
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");
