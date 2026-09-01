-- Tema seçimi yalnız açıq və tünd rejimdən ibarətdir.
-- Köhnə "system" dəyərləri yeni default olan açıq temaya keçirilir.
UPDATE "User"
SET "themePreference" = 'light'
WHERE "themePreference" NOT IN ('light', 'dark');
