-- Telegram bildiriş kanalı: istifadəçi botu hesabına bağlayır, bildirişlər şəxsi çata gedir.
ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramLinkedAt" DATETIME;
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

CREATE TABLE "TelegramLinkToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "TelegramLinkToken_tokenHash_key" ON "TelegramLinkToken"("tokenHash");
CREATE INDEX "TelegramLinkToken_userId_idx" ON "TelegramLinkToken"("userId");
CREATE INDEX "TelegramLinkToken_expiresAt_idx" ON "TelegramLinkToken"("expiresAt");
