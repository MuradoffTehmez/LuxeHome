-- Abunə planları və tarifləri (#244, PRD v2 16.1–16.3).
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "description" TEXT,
    "capabilities" TEXT NOT NULL,
    "limits" TEXT,
    "trialDays" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "SubscriptionPlan_code_audience_key" ON "SubscriptionPlan"("code", "audience");
CREATE INDEX "SubscriptionPlan_audience_isActive_sortOrder_idx" ON "SubscriptionPlan"("audience", "isActive", "sortOrder");

CREATE TABLE "SubscriptionPlanPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionPlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SubscriptionPlanPrice_planId_months_key" ON "SubscriptionPlanPrice"("planId", "months");

-- PRD 16.2 imkan cədvəli ilə üç plan hər auditoriya üçün; qiymət yazılmır (ayrıca təsdiqlənir).
INSERT OR IGNORE INTO "SubscriptionPlan" ("id", "code", "audience", "capabilities", "trialDays", "sortOrder", "updatedAt") VALUES ('plan_basic_individual', 'BASIC', 'INDIVIDUAL', '{"LISTINGS":"INCLUDED","LISTING_STATS":"BASIC","FEATURED":"INCLUDED","REPORTS":"INCLUDED","NOTIFICATIONS":"BASIC","ANALYTICS":"BASIC","EXPORT":"LIMITED","AGENCY_MANAGEMENT":"BASIC","CRM":"LIMITED","AUTOMATION":"NONE","SUPPORT":"STANDARD"}', 15, 0, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "SubscriptionPlan" ("id", "code", "audience", "capabilities", "trialDays", "sortOrder", "updatedAt") VALUES ('plan_pro_individual', 'PRO', 'INDIVIDUAL', '{"LISTINGS":"INCLUDED","LISTING_STATS":"EXTENDED","FEATURED":"INCLUDED","REPORTS":"INCLUDED","NOTIFICATIONS":"EXTENDED","ANALYTICS":"EXTENDED","EXPORT":"INCLUDED","AGENCY_MANAGEMENT":"EXTENDED","CRM":"INCLUDED","AUTOMATION":"LIMITED","SUPPORT":"PRIORITY"}', 15, 1, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "SubscriptionPlan" ("id", "code", "audience", "capabilities", "trialDays", "sortOrder", "updatedAt") VALUES ('plan_premium_individual', 'PREMIUM', 'INDIVIDUAL', '{"LISTINGS":"INCLUDED","LISTING_STATS":"FULL","FEATURED":"INCLUDED","REPORTS":"INCLUDED","NOTIFICATIONS":"EXTENDED","ANALYTICS":"PROFESSIONAL","EXPORT":"EXTENDED","AGENCY_MANAGEMENT":"FULL","CRM":"EXTENDED","AUTOMATION":"INCLUDED","SUPPORT":"HIGH"}', 15, 2, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "SubscriptionPlan" ("id", "code", "audience", "capabilities", "trialDays", "sortOrder", "updatedAt") VALUES ('plan_basic_agency', 'BASIC', 'AGENCY', '{"LISTINGS":"INCLUDED","LISTING_STATS":"BASIC","FEATURED":"INCLUDED","REPORTS":"INCLUDED","NOTIFICATIONS":"BASIC","ANALYTICS":"BASIC","EXPORT":"LIMITED","AGENCY_MANAGEMENT":"BASIC","CRM":"LIMITED","AUTOMATION":"NONE","SUPPORT":"STANDARD"}', 15, 0, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "SubscriptionPlan" ("id", "code", "audience", "capabilities", "trialDays", "sortOrder", "updatedAt") VALUES ('plan_pro_agency', 'PRO', 'AGENCY', '{"LISTINGS":"INCLUDED","LISTING_STATS":"EXTENDED","FEATURED":"INCLUDED","REPORTS":"INCLUDED","NOTIFICATIONS":"EXTENDED","ANALYTICS":"EXTENDED","EXPORT":"INCLUDED","AGENCY_MANAGEMENT":"EXTENDED","CRM":"INCLUDED","AUTOMATION":"LIMITED","SUPPORT":"PRIORITY"}', 15, 1, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "SubscriptionPlan" ("id", "code", "audience", "capabilities", "trialDays", "sortOrder", "updatedAt") VALUES ('plan_premium_agency', 'PREMIUM', 'AGENCY', '{"LISTINGS":"INCLUDED","LISTING_STATS":"FULL","FEATURED":"INCLUDED","REPORTS":"INCLUDED","NOTIFICATIONS":"EXTENDED","ANALYTICS":"PROFESSIONAL","EXPORT":"EXTENDED","AGENCY_MANAGEMENT":"FULL","CRM":"EXTENDED","AUTOMATION":"INCLUDED","SUPPORT":"HIGH"}', 15, 2, CURRENT_TIMESTAMP);
