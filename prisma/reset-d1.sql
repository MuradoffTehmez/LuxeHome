-- Boş köhnə sxemi təmizləyir ki, 0001_init.sql miqrasiyası tətbiq oluna bilsin.
PRAGMA defer_foreign_keys = true;
DROP TABLE IF EXISTS "PropertyImage";
DROP TABLE IF EXISTS "PropertyFeature";
DROP TABLE IF EXISTS "ProjectImage";
DROP TABLE IF EXISTS "Favorite";
DROP TABLE IF EXISTS "Lead";
DROP TABLE IF EXISTS "Media";
DROP TABLE IF EXISTS "Property";
DROP TABLE IF EXISTS "Project";
DROP TABLE IF EXISTS "BlogPost";
DROP TABLE IF EXISTS "BlogCategory";
DROP TABLE IF EXISTS "Service";
DROP TABLE IF EXISTS "Setting";
DROP TABLE IF EXISTS "Feature";
DROP TABLE IF EXISTS "Location";
DROP TABLE IF EXISTS "PropertyType";
DROP TABLE IF EXISTS "User";
DELETE FROM d1_migrations;
