-- CreateTable
CREATE TABLE "ConductReason" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DEDUCT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConductDeduction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DEDUCT',
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" TEXT,
    "recordedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConductDeduction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConductDeduction_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ConductDeduction" ("amount", "category", "createdAt", "id", "reason", "recordedByUserId", "studentId") SELECT "amount", "category", "createdAt", "id", "reason", "recordedByUserId", "studentId" FROM "ConductDeduction";
DROP TABLE "ConductDeduction";
ALTER TABLE "new_ConductDeduction" RENAME TO "ConductDeduction";
CREATE INDEX "ConductDeduction_studentId_idx" ON "ConductDeduction"("studentId");
CREATE INDEX "ConductDeduction_createdAt_idx" ON "ConductDeduction"("createdAt");
CREATE TABLE "new_PlanActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlanActivity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlanActivity" ("createdAt", "createdByUserId", "description", "endDate", "id", "month", "startDate", "title", "updatedAt", "year") SELECT "createdAt", "createdByUserId", "description", "endDate", "id", "month", "startDate", "title", "updatedAt", "year" FROM "PlanActivity";
DROP TABLE "PlanActivity";
ALTER TABLE "new_PlanActivity" RENAME TO "PlanActivity";
CREATE INDEX "PlanActivity_year_month_idx" ON "PlanActivity"("year", "month");
CREATE INDEX "PlanActivity_startDate_idx" ON "PlanActivity"("startDate");
CREATE TABLE "new_WasteScoreEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "classRoom" TEXT,
    "studentId" TEXT,
    "wasteTypeId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "pointsAwarded" REAL NOT NULL,
    "note" TEXT,
    "recordedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WasteScoreEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WasteScoreEntry" ("classRoom", "createdAt", "id", "note", "pointsAwarded", "quantity", "recordedByUserId", "studentId", "targetType", "wasteTypeId") SELECT "classRoom", "createdAt", "id", "note", "pointsAwarded", "quantity", "recordedByUserId", "studentId", "targetType", "wasteTypeId" FROM "WasteScoreEntry";
DROP TABLE "WasteScoreEntry";
ALTER TABLE "new_WasteScoreEntry" RENAME TO "WasteScoreEntry";
CREATE INDEX "WasteScoreEntry_classRoom_idx" ON "WasteScoreEntry"("classRoom");
CREATE INDEX "WasteScoreEntry_createdAt_idx" ON "WasteScoreEntry"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ConductReason_text_key" ON "ConductReason"("text");
