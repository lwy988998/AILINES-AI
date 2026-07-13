-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "membershipTier" TEXT NOT NULL DEFAULT 'free',
    "membershipStatus" TEXT NOT NULL DEFAULT 'active',
    "membershipStartedAt" DATETIME,
    "membershipExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_membershipTier_idx" ON "User"("membershipTier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "UsageCounter_scopeId_idx" ON "UsageCounter"("scopeId");

-- CreateIndex
CREATE INDEX "UsageCounter_type_idx" ON "UsageCounter"("type");

-- CreateIndex
CREATE INDEX "UsageCounter_dateKey_idx" ON "UsageCounter"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "UsageCounter_scopeId_scopeType_type_dateKey_key" ON "UsageCounter"("scopeId", "scopeType", "type", "dateKey");
