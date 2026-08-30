-- Public Platform PRD §179 — Phase 2 data fundamenti.
-- Miqrasiya additivdir: mövcud cədvəllər və sətirlər yenidən qurulmur.

CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'az',
  "userAgent" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "lastUsedAt" DATETIME,
  CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "savedSearchEmail" BOOLEAN NOT NULL DEFAULT true,
  "savedSearchWeb" BOOLEAN NOT NULL DEFAULT true,
  "savedSearchPush" BOOLEAN NOT NULL DEFAULT false,
  "priceDropEmail" BOOLEAN NOT NULL DEFAULT true,
  "priceDropWeb" BOOLEAN NOT NULL DEFAULT true,
  "priceDropPush" BOOLEAN NOT NULL DEFAULT false,
  "reservationEmail" BOOLEAN NOT NULL DEFAULT true,
  "reservationWeb" BOOLEAN NOT NULL DEFAULT true,
  "reservationPush" BOOLEAN NOT NULL DEFAULT false,
  "recommendationEnabled" BOOLEAN NOT NULL DEFAULT true,
  "quietHoursStart" TEXT,
  "quietHoursEnd" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

CREATE TABLE "AgentProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "agencyId" TEXT,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "roleTitle" TEXT,
  "specialization" TEXT,
  "experienceYears" INTEGER,
  "bio" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "languages" TEXT NOT NULL DEFAULT '[]',
  "areas" TEXT NOT NULL DEFAULT '[]',
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "soldCount" INTEGER NOT NULL DEFAULT 0,
  "rentedCount" INTEGER NOT NULL DEFAULT 0,
  "responseMinutes" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AgentProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");
CREATE UNIQUE INDEX "AgentProfile_slug_key" ON "AgentProfile"("slug");
CREATE INDEX "AgentProfile_agencyId_isPublic_idx" ON "AgentProfile"("agencyId", "isPublic");
CREATE INDEX "AgentProfile_isVerified_isPublic_idx" ON "AgentProfile"("isVerified", "isPublic");

CREATE TABLE "NeighborhoodProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "locationId" TEXT NOT NULL,
  "description" TEXT,
  "descriptionEn" TEXT,
  "descriptionRu" TEXT,
  "coverUrl" TEXT,
  "averagePrice" REAL,
  "medianPrice" REAL,
  "averagePricePerSqm" REAL,
  "saleRentRatio" REAL,
  "annualChangePercent" REAL,
  "averageRent" REAL,
  "rentalYieldPercent" REAL,
  "dataSource" TEXT,
  "measuredAt" DATETIME,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "NeighborhoodProfile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NeighborhoodProfile_locationId_key" ON "NeighborhoodProfile"("locationId");

ALTER TABLE "Property" ADD COLUMN "featuredUntil" DATETIME;
ALTER TABLE "Property" ADD COLUMN "reservationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "assignedAgentId" TEXT REFERENCES "AgentProfile"("id") ON DELETE SET NULL;
CREATE INDEX "Property_featuredUntil_idx" ON "Property"("featuredUntil");
CREATE INDEX "Property_reservationEnabled_status_idx" ON "Property"("reservationEnabled", "status");
CREATE INDEX "Property_assignedAgentId_idx" ON "Property"("assignedAgentId");

ALTER TABLE "PropertyImage" ADD COLUMN "qualityScore" INTEGER;
ALTER TABLE "PropertyImage" ADD COLUMN "qualityIssues" TEXT;
ALTER TABLE "PropertyImage" ADD COLUMN "analyzedAt" DATETIME;

ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

CREATE TABLE "PropertyPriceHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "oldPrice" REAL NOT NULL,
  "newPrice" REAL NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AZN',
  "source" TEXT NOT NULL DEFAULT 'ADMIN',
  "changedById" TEXT,
  "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyPriceHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PropertyPriceHistory_propertyId_changedAt_idx" ON "PropertyPriceHistory"("propertyId", "changedAt");

CREATE TABLE "AgentReview" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agentId" TEXT NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "serviceType" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "moderationNote" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "moderatedAt" DATETIME,
  CONSTRAINT "AgentReview_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AgentReview_agentId_status_createdAt_idx" ON "AgentReview"("agentId", "status", "createdAt");
CREATE INDEX "AgentReview_customerId_idx" ON "AgentReview"("customerId");

CREATE TABLE "Testimonial" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "review" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "serviceType" TEXT,
  "agentId" TEXT,
  "agencyId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "occurredAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" DATETIME,
  CONSTRAINT "Testimonial_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Testimonial_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Testimonial_status_createdAt_idx" ON "Testimonial"("status", "createdAt");
CREATE INDEX "Testimonial_agentId_idx" ON "Testimonial"("agentId");
CREATE INDEX "Testimonial_agencyId_idx" ON "Testimonial"("agencyId");

CREATE TABLE "NearbyPlace" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "latitude" REAL,
  "longitude" REAL,
  "distanceMeters" INTEGER,
  "walkingMinutes" INTEGER,
  "source" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NearbyPlace_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "NearbyPlace_propertyId_category_idx" ON "NearbyPlace"("propertyId", "category");

CREATE TABLE "Reservation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "agentId" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "requestedFor" DATETIME NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "termsAcceptedAt" DATETIME NOT NULL,
  "expiresAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Reservation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Reservation_userId_createdAt_idx" ON "Reservation"("userId", "createdAt");
CREATE INDEX "Reservation_propertyId_status_idx" ON "Reservation"("propertyId", "status");
CREATE INDEX "Reservation_agentId_status_idx" ON "Reservation"("agentId", "status");

CREATE TABLE "ReservationEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reservationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "changedById" TEXT,
  "source" TEXT NOT NULL DEFAULT 'USER',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReservationEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ReservationEvent_reservationId_createdAt_idx" ON "ReservationEvent"("reservationId", "createdAt");

CREATE TABLE "AiContentDraft" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT,
  "requestedById" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'az',
  "inputJson" TEXT NOT NULL,
  "outputJson" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" DATETIME,
  CONSTRAINT "AiContentDraft_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiContentDraft_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AiContentDraft_propertyId_createdAt_idx" ON "AiContentDraft"("propertyId", "createdAt");
CREATE INDEX "AiContentDraft_requestedById_createdAt_idx" ON "AiContentDraft"("requestedById", "createdAt");
