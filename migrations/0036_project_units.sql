-- Yeni tikilinin mənzil şahmatı (#107).

-- CreateTable
CREATE TABLE "ProjectUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "rooms" INTEGER,
    "area" REAL,
    "price" REAL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectUnit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUnit_projectId_block_number_key" ON "ProjectUnit"("projectId", "block", "number");

-- CreateIndex
CREATE INDEX "ProjectUnit_projectId_block_floor_idx" ON "ProjectUnit"("projectId", "block", "floor");
