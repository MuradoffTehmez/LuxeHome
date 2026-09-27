-- İyerarxik ünvan forması: küçə, bina/əlavə məlumat və siyahıda olmayan məhəllə
-- ayrıca saxlanılır. `address` tam ünvan sətri kimi qalır (axtarış, JSON-LD, geokod).
ALTER TABLE "Property" ADD COLUMN "street" TEXT;
ALTER TABLE "Property" ADD COLUMN "building" TEXT;
ALTER TABLE "Property" ADD COLUMN "neighborhoodName" TEXT;
