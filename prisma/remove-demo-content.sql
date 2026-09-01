-- Yalnız `isDemo = 1` olan nümunə məzmunu silir.
-- Skript təkrar icra üçün təhlükəsizdir.
--
-- Silinmə sırası xarici açar asılılıqlarına görədir: əvvəlcə əmlaklar (onların
-- şəkil, xüsusiyyət və tərəfdaş bağları CASCADE ilə gedir), sonra layihələr,
-- agent profilləri, agentliklər və nəhayət agentliyin sahib istifadəçiləri.
DELETE FROM "BlogPost" WHERE "isDemo" = 1;
DELETE FROM "Property" WHERE "isDemo" = 1;
DELETE FROM "Project" WHERE "isDemo" = 1;
DELETE FROM "Partner" WHERE "isDemo" = 1;
DELETE FROM "AgentProfile" WHERE "isDemo" = 1;

-- Agentliyin sahib istifadəçisi `Agency`-dən əvvəl silinsə FK pozulardı,
-- ona görə əvvəlcə agentlik, sonra ona bağlı nümunə istifadəçi silinir.
DELETE FROM "User"
WHERE "id" IN (SELECT "userId" FROM "Agency" WHERE "isDemo" = 1);
DELETE FROM "Agency" WHERE "isDemo" = 1;

-- Nümunə məzmun silindikdə rejim də söndürülür: açar açıq qalsa, panel
-- «aktiv» göstərər, sayt isə boş olardı.
DELETE FROM "Setting" WHERE "key" = 'demo.content_enabled';
