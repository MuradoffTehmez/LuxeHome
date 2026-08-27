-- İctimai hesabın admin təsdiqini bloklama və e-poçt doğrulamasından ayırır.
ALTER TABLE "User" ADD COLUMN "approvedAt" DATETIME;

CREATE INDEX "User_approvedAt_idx" ON "User"("approvedAt");
