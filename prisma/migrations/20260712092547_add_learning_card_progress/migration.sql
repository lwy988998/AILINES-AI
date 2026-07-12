-- CreateTable
CREATE TABLE "LearningCardProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT,
    "anonymousId" TEXT,
    "goal" TEXT NOT NULL,
    "mode" TEXT,
    "phaseIndex" INTEGER NOT NULL,
    "phaseName" TEXT NOT NULL,
    "topicIndex" INTEGER NOT NULL,
    "topicTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningCardProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LearningCardProgress_anonymousId_idx" ON "LearningCardProgress"("anonymousId");

-- CreateIndex
CREATE INDEX "LearningCardProgress_goal_idx" ON "LearningCardProgress"("goal");

-- CreateIndex
CREATE INDEX "LearningCardProgress_courseId_idx" ON "LearningCardProgress"("courseId");

-- CreateIndex
CREATE INDEX "LearningCardProgress_phaseIndex_idx" ON "LearningCardProgress"("phaseIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LearningCardProgress_courseId_phaseIndex_topicIndex_key" ON "LearningCardProgress"("courseId", "phaseIndex", "topicIndex");
