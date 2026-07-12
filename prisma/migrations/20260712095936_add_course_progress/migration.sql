-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "anonymousId" TEXT,
    "userId" TEXT,
    "goal" TEXT NOT NULL,
    "mode" TEXT,
    "overallPercent" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitedUrl" TEXT,
    "lastPageType" TEXT,
    "lastPhaseIndex" INTEGER,
    "lastPhaseName" TEXT,
    "lastTopicIndex" INTEGER,
    "lastTopicTitle" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_courseId_key" ON "CourseProgress"("courseId");

-- CreateIndex
CREATE INDEX "CourseProgress_anonymousId_idx" ON "CourseProgress"("anonymousId");

-- CreateIndex
CREATE INDEX "CourseProgress_userId_idx" ON "CourseProgress"("userId");

-- CreateIndex
CREATE INDEX "CourseProgress_updatedAt_idx" ON "CourseProgress"("updatedAt");
