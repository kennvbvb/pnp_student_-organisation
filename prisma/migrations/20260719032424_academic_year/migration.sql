-- AlterTable
ALTER TABLE "Student" ADD COLUMN "graduatedYear" INTEGER;

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
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
    "academicYearId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    CONSTRAINT "ConductDeduction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConductDeduction_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConductDeduction_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConductDeduction_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ConductDeduction" ("amount", "cancelReason", "cancelledAt", "cancelledByUserId", "category", "createdAt", "id", "reason", "recordedByUserId", "studentId", "type") SELECT "amount", "cancelReason", "cancelledAt", "cancelledByUserId", "category", "createdAt", "id", "reason", "recordedByUserId", "studentId", "type" FROM "ConductDeduction";
DROP TABLE "ConductDeduction";
ALTER TABLE "new_ConductDeduction" RENAME TO "ConductDeduction";
CREATE INDEX "ConductDeduction_studentId_idx" ON "ConductDeduction"("studentId");
CREATE INDEX "ConductDeduction_createdAt_idx" ON "ConductDeduction"("createdAt");
CREATE INDEX "ConductDeduction_cancelledAt_idx" ON "ConductDeduction"("cancelledAt");
CREATE INDEX "ConductDeduction_academicYearId_idx" ON "ConductDeduction"("academicYearId");
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
    "academicYearId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    CONSTRAINT "WasteScoreEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WasteScoreEntry" ("cancelReason", "cancelledAt", "cancelledByUserId", "classRoom", "createdAt", "id", "note", "pointsAwarded", "quantity", "recordedByUserId", "studentId", "targetType", "wasteTypeId") SELECT "cancelReason", "cancelledAt", "cancelledByUserId", "classRoom", "createdAt", "id", "note", "pointsAwarded", "quantity", "recordedByUserId", "studentId", "targetType", "wasteTypeId" FROM "WasteScoreEntry";
DROP TABLE "WasteScoreEntry";
ALTER TABLE "new_WasteScoreEntry" RENAME TO "WasteScoreEntry";
CREATE INDEX "WasteScoreEntry_classRoom_idx" ON "WasteScoreEntry"("classRoom");
CREATE INDEX "WasteScoreEntry_createdAt_idx" ON "WasteScoreEntry"("createdAt");
CREATE INDEX "WasteScoreEntry_cancelledAt_idx" ON "WasteScoreEntry"("cancelledAt");
CREATE INDEX "WasteScoreEntry_academicYearId_idx" ON "WasteScoreEntry"("academicYearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_year_key" ON "AcademicYear"("year");
