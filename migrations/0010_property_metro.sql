-- Əmlak üçün optional metro əlaqəsi. Mövcud elanlar NULL qalır; məlumat təxmin edilmir.
ALTER TABLE "Property" ADD COLUMN "metroId" TEXT;
CREATE INDEX "Property_metroId_idx" ON "Property"("metroId");
