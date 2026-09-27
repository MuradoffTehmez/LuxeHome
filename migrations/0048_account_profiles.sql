-- Genişləndirilmiş profil sistemi: ad/soyad ayrıca, istəyə bağlı doğum tarixi və
-- biznes hesabları (agentlik, korporativ) üçün şirkət məlumatı. Yeni hesab növləri
-- (AGENT, CORPORATE) mövcud `accountType` sətir sütununda saxlanılır.
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "birthDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "companyName" TEXT;
ALTER TABLE "User" ADD COLUMN "companyTaxId" TEXT;
ALTER TABLE "User" ADD COLUMN "companyWebsite" TEXT;
ALTER TABLE "User" ADD COLUMN "position" TEXT;
