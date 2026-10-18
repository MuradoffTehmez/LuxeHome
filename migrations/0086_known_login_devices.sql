-- Tanınmış giriş cihazları (#264, Codex rəyi): yeni cihaz xəbərdarlığının tarixçəsi sessiyalardan ayrıdır.
CREATE TABLE "KnownLoginDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "KnownLoginDevice_userId_kind_value_key" ON "KnownLoginDevice"("userId", "kind", "value");
CREATE INDEX "KnownLoginDevice_lastSeenAt_idx" ON "KnownLoginDevice"("lastSeenAt");
