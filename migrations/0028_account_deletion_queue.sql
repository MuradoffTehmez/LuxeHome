-- İctimai hesabın silinməsini D1-də transaction olmadan təhlükəsiz tamamlayan marker.
-- İlk atomik UPDATE hesabı deaktiv edir; əlaqəli təmizlik yarımçıq qalsa gündəlik
-- maintenance cron-u bu sütuna görə işi idempotent şəkildə yenidən sınayır.
ALTER TABLE "User" ADD COLUMN "deletionRequestedAt" DATETIME;

CREATE INDEX "User_deletionRequestedAt_idx" ON "User"("deletionRequestedAt");
