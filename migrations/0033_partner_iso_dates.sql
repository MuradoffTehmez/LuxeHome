-- Partner tarixlərini ISO mətninə normallaşdırır (#99).
--
-- `prisma/seed.sql` TREVA qeydini `createdAt`/`updatedAt` = 1787850000000 (epoch ms)
-- ilə yazırdı. Prisma D1-də DateTime-ı ISO mətn kimi oxuyur; rəqəm dəyəri sorğunu
-- çökdürür və `/admin/terefdaslar` server render-də xəta verirdi. Bütün sütunlar
-- üzrə skan yalnız Partner cədvəlində belə dəyər tapdı.
UPDATE "Partner" SET "createdAt" = strftime('%Y-%m-%dT%H:%M:%fZ', "createdAt" / 1000.0, 'unixepoch') WHERE typeof("createdAt") = 'integer';
UPDATE "Partner" SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', "updatedAt" / 1000.0, 'unixepoch') WHERE typeof("updatedAt") = 'integer';
UPDATE "Partner" SET "verifiedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', "verifiedAt" / 1000.0, 'unixepoch') WHERE typeof("verifiedAt") = 'integer';
UPDATE "Partner" SET "officialSince" = strftime('%Y-%m-%dT%H:%M:%fZ', "officialSince" / 1000.0, 'unixepoch') WHERE typeof("officialSince") = 'integer';
UPDATE "Partner" SET "partnershipEndDate" = strftime('%Y-%m-%dT%H:%M:%fZ', "partnershipEndDate" / 1000.0, 'unixepoch') WHERE typeof("partnershipEndDate") = 'integer';
UPDATE "Partner" SET "contractStartDate" = strftime('%Y-%m-%dT%H:%M:%fZ', "contractStartDate" / 1000.0, 'unixepoch') WHERE typeof("contractStartDate") = 'integer';
UPDATE "Partner" SET "contractEndDate" = strftime('%Y-%m-%dT%H:%M:%fZ', "contractEndDate" / 1000.0, 'unixepoch') WHERE typeof("contractEndDate") = 'integer';
