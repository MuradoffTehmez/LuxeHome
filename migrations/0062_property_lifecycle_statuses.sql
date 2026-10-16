-- Elanın həyat dövrü statusları (#202, PRD v2 Modul 03). Sxem dəyişmir — `Property.status` mətndir;
-- köhnə qeydlər mənasına görə yeni dəyərlərə köçürülür. Silinmiş (`deletedAt`) qeydlərə toxunulmur.

-- Müddəti bitib arxivlənmiş elanlar (#109: `ARCHIVED` + `expiredAt`) → `EXPIRED`.
UPDATE "Property" SET "status" = 'EXPIRED'
WHERE "status" = 'ARCHIVED' AND "expiredAt" IS NOT NULL AND "deletedAt" IS NULL;

-- Şikayət əsasında dayandırılmış elanlar (#159: `ARCHIVED` + moderator səbəbi `moderationNote`) → `SUSPENDED`.
-- Paneldən sadə arxivləmə səbəb yazmır, ona görə qeyd onları əhatə etmir.
UPDATE "Property" SET "status" = 'SUSPENDED'
WHERE "status" = 'ARCHIVED' AND "expiredAt" IS NULL AND "moderationNote" IS NOT NULL AND "deletedAt" IS NULL;

-- Moderasiyadan rədd edilmiş qaralamalar (rədd `DRAFT` + `moderationNote` yazırdı) → `REJECTED`.
UPDATE "Property" SET "status" = 'REJECTED'
WHERE "status" = 'DRAFT' AND "moderationNote" IS NOT NULL AND TRIM("moderationNote") <> '' AND "deletedAt" IS NULL;
