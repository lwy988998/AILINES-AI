-- CreateTable
CREATE TABLE "TaskProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT,
    "anonymousId" TEXT,
    "goal" TEXT NOT NULL,
    "mode" TEXT,
    "phaseIndex" INTEGER NOT NULL,
    "phaseName" TEXT NOT NULL,
    "taskIndex" INTEGER NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TaskProgress_anonymousId_idx" ON "TaskProgress"("anonymousId");

-- CreateIndex
CREATE INDEX "TaskProgress_goal_idx" ON "TaskProgress"("goal");

-- CreateIndex
CREATE INDEX "TaskProgress_courseId_idx" ON "TaskProgress"("courseId");

-- CreateIndex
CREATE INDEX "TaskProgress_phaseIndex_idx" ON "TaskProgress"("phaseIndex");

-- CreateIndex
CREATE UNIQUE INDEX "TaskProgress_courseId_phaseIndex_taskIndex_key" ON "TaskProgress"("courseId", "phaseIndex", "taskIndex");
