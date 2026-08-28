ALTER TABLE "Property" ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PropertyType" ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Location" ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Feature" ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '';

UPDATE "Property" SET "searchText" = lower(COALESCE("title", '') || ' ' || COALESCE("description", '') || ' ' || COALESCE("address", ''));
UPDATE "PropertyType" SET "searchName" = lower("name");
UPDATE "Location" SET "searchName" = lower("name");
UPDATE "Feature" SET "searchName" = lower("name");

-- SQLite lower() yalnız ASCII-ni tam dəstəkləyir. Hər iki Azərbaycan registri
-- açıq əvəzlənir; beləliklə Bakı/baki, Xətai/xetai eyni nəticə verir.
UPDATE "Property" SET "searchText" = replace(replace("searchText", 'Ə', 'e'), 'ə', 'e');
UPDATE "Property" SET "searchText" = replace(replace("searchText", 'Ş', 's'), 'ş', 's');
UPDATE "Property" SET "searchText" = replace(replace("searchText", 'Ç', 'c'), 'ç', 'c');
UPDATE "Property" SET "searchText" = replace(replace("searchText", 'Ğ', 'g'), 'ğ', 'g');
UPDATE "Property" SET "searchText" = replace(replace(replace("searchText", 'İ', 'i'), 'I', 'i'), 'ı', 'i');
UPDATE "Property" SET "searchText" = replace(replace("searchText", 'Ö', 'o'), 'ö', 'o');
UPDATE "Property" SET "searchText" = replace(replace("searchText", 'Ü', 'u'), 'ü', 'u');

UPDATE "PropertyType" SET "searchName" = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace("searchName", 'Ə','e'),'ə','e'),'Ş','s'),'ş','s'),'Ç','c'),'ç','c'),'Ğ','g'),'ğ','g'),'İ','i'),'I','i'),'ı','i'),'Ö','o'),'ö','o'),'Ü','u'),'ü','u');
UPDATE "Location" SET "searchName" = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace("searchName", 'Ə','e'),'ə','e'),'Ş','s'),'ş','s'),'Ç','c'),'ç','c'),'Ğ','g'),'ğ','g'),'İ','i'),'I','i'),'ı','i'),'Ö','o'),'ö','o'),'Ü','u'),'ü','u');
UPDATE "Feature" SET "searchName" = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace("searchName", 'Ə','e'),'ə','e'),'Ş','s'),'ş','s'),'Ç','c'),'ç','c'),'Ğ','g'),'ğ','g'),'İ','i'),'I','i'),'ı','i'),'Ö','o'),'ö','o'),'Ü','u'),'ü','u');
