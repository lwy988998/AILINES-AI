-- CreateTable
CREATE TABLE "LearningStepProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT,
    "anonymousId" TEXT,
    "goal" TEXT NOT NULL,
    "mode" TEXT,
    "phaseIndex" INTEGER NOT NULL,
    "phaseName" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unset',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningStepProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LearningStepProgress_anonymousId_idx" ON "LearningStepProgress"("anonymousId");

-- CreateIndex
CREATE INDEX "LearningStepProgress_goal_idx" ON "LearningStepProgress"("goal");

-- CreateIndex
CREATE INDEX "LearningStepProgress_courseId_idx" ON "LearningStepProgress"("courseId");

-- CreateIndex
CREATE INDEX "LearningStepProgress_phaseIndex_idx" ON "LearningStepProgress"("phaseIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LearningStepProgress_courseId_phaseIndex_stepIndex_key" ON "LearningStepProgress"("courseId", "phaseIndex", "stepIndex");
