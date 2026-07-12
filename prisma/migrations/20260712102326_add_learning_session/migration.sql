-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT,
    "anonymousId" TEXT,
    "goal" TEXT NOT NULL,
    "mode" TEXT,
    "phaseIndex" INTEGER NOT NULL,
    "phaseName" TEXT NOT NULL,
    "topicIndex" INTEGER NOT NULL,
    "topicTitle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "searchQuery" TEXT,
    "content" JSONB NOT NULL,
    "references" JSONB,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LearningSession_anonymousId_idx" ON "LearningSession"("anonymousId");

-- CreateIndex
CREATE INDEX "LearningSession_goal_idx" ON "LearningSession"("goal");

-- CreateIndex
CREATE INDEX "LearningSession_courseId_idx" ON "LearningSession"("courseId");

-- CreateIndex
CREATE INDEX "LearningSession_phaseIndex_idx" ON "LearningSession"("phaseIndex");

-- CreateIndex
CREATE INDEX "LearningSession_updatedAt_idx" ON "LearningSession"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningSession_courseId_phaseIndex_topicIndex_key" ON "LearningSession"("courseId", "phaseIndex", "topicIndex");
