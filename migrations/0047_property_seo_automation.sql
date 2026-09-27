-- Elan SEO-sunun avtomatlaşdırılması: açar sözlər, sosial paylaşım mətni və
-- sahələrin avtomatik yaradıldığını göstərən işarə.
ALTER TABLE "Property" ADD COLUMN "metaKeywords" TEXT;
ALTER TABLE "Property" ADD COLUMN "socialText" TEXT;
ALTER TABLE "Property" ADD COLUMN "seoGeneratedAt" DATETIME;
