-- Demo məzmun bayraqları.
--
-- `Property`, `Project` və `BlogPost` modellərində `isDemo` artıq var idi; nümunə
-- məzmun dəsti agentlik, agent və tərəfdaş səthlərini də əhatə etdiyi üçün eyni
-- bayraq həmin cədvəllərə də əlavə olunur. Semantika dəyişmir: `isDemo = 1` olan
-- qeyd yalnız demo rejimi açıq olduqda ictimai sorğularda görünür.
ALTER TABLE "Agency" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AgentProfile" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Partner" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Agency_isDemo_idx" ON "Agency"("isDemo");
CREATE INDEX "AgentProfile_isDemo_idx" ON "AgentProfile"("isDemo");
CREATE INDEX "Partner_isDemo_idx" ON "Partner"("isDemo");
