-- Resend göndəriş/qəbul hadisələrinin məzmun daşımayan metadatası.
CREATE TABLE "EmailActivity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "fromAddress" TEXT,
  "toAddresses" TEXT NOT NULL DEFAULT '[]',
  "subject" TEXT,
  "messageId" TEXT,
  "attachmentCount" INTEGER NOT NULL DEFAULT 0,
  "lastEventAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "EmailActivity_providerId_key" ON "EmailActivity"("providerId");
CREATE INDEX "EmailActivity_direction_lastEventAt_idx" ON "EmailActivity"("direction", "lastEventAt");
CREATE INDEX "EmailActivity_eventType_lastEventAt_idx" ON "EmailActivity"("eventType", "lastEventAt");
