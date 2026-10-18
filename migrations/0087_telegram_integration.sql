-- Telegram inteqrasiyası: təsdiqlənmiş Telegram kimliyi, birdəfəlik bağlama/qeydiyyat tokenləri, çatlar (qrup/kanal),
-- webhook idempotentliyi, çatdırılma növbəsi və dəstək müraciətləri. Yalnız yeni cədvəllər — mövcud sətirlərə toxunulmur.
CREATE TABLE "TelegramAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "oidcSub" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "chatId" TEXT,
    "botAccess" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "blockedAt" DATETIME,
    "lastDeliveryAt" DATETIME,
    "lastDeliveryStatus" TEXT,
    "linkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TelegramAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TelegramAccount_userId_key" ON "TelegramAccount"("userId");
CREATE UNIQUE INDEX "TelegramAccount_telegramUserId_key" ON "TelegramAccount"("telegramUserId");
CREATE UNIQUE INDEX "TelegramAccount_oidcSub_key" ON "TelegramAccount"("oidcSub");

CREATE TABLE "TelegramLinkToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "userId" TEXT,
    "payload" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TelegramLinkToken_tokenHash_key" ON "TelegramLinkToken"("tokenHash");
CREATE INDEX "TelegramLinkToken_userId_purpose_idx" ON "TelegramLinkToken"("userId", "purpose");
CREATE INDEX "TelegramLinkToken_expiresAt_idx" ON "TelegramLinkToken"("expiresAt");

CREATE TABLE "TelegramChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "botStatus" TEXT,
    "canPost" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT,
    "locale" TEXT,
    "supportAwaitUntil" DATETIME,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "TelegramChat_chatId_key" ON "TelegramChat"("chatId");
CREATE INDEX "TelegramChat_type_status_idx" ON "TelegramChat"("type", "status");

CREATE TABLE "TelegramUpdate" (
    "updateId" INTEGER NOT NULL PRIMARY KEY,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "TelegramUpdate_receivedAt_idx" ON "TelegramUpdate"("receivedAt");

CREATE TABLE "TelegramDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "audience" TEXT NOT NULL,
    "userId" TEXT,
    "chatId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "text" TEXT,
    "buttons" TEXT,
    "silent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME
);
CREATE UNIQUE INDEX "TelegramDelivery_dedupeKey_key" ON "TelegramDelivery"("dedupeKey");
CREATE INDEX "TelegramDelivery_status_nextAttemptAt_idx" ON "TelegramDelivery"("status", "nextAttemptAt");
CREATE INDEX "TelegramDelivery_userId_createdAt_idx" ON "TelegramDelivery"("userId", "createdAt");
CREATE INDEX "TelegramDelivery_createdAt_idx" ON "TelegramDelivery"("createdAt");

CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL DEFAULT 'TELEGRAM',
    "chatId" TEXT,
    "userId" TEXT,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "SupportTicket_status_updatedAt_idx" ON "SupportTicket"("status", "updatedAt");
CREATE INDEX "SupportTicket_chatId_status_idx" ON "SupportTicket"("chatId", "status");
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");
