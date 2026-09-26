-- CSV idxalının irəliləyiş markeri (#103): sətir heşi və tamamlanma vaxtı.
-- D1 tranzaksiya dəstəkləmir — əsas qeyd yazılıb əlaqələr yarımçıq qalanda təkrar
-- idxal `importCompletedAt IS NULL` qeydini davam etdirir. Köhnə sətirlərdə hər ikisi boşdur.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "importKey" TEXT;
ALTER TABLE "Property" ADD COLUMN "importCompletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Property_importKey_idx" ON "Property"("importKey");
