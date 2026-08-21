-- Yalnız `isDemo = true` olan ictimai məzmunu silir.
-- Skript təkrar icra üçün təhlükəsizdir.
DELETE FROM "BlogPost" WHERE "isDemo" = 1;
DELETE FROM "Property" WHERE "isDemo" = 1;
DELETE FROM "Project" WHERE "isDemo" = 1;
