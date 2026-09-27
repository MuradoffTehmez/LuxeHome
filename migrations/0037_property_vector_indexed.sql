-- Semantik indeksə yazılmış elanların izi (#108 rəyi): tam yenidən indeksləmə
-- gizlənmiş/arxivlənmiş elanların köhnə vektorlarını tapıb silə bilsin.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "vectorIndexedAt" DATETIME;
