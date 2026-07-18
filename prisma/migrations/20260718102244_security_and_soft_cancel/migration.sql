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
    "cancelledAt" DATETIME,
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    CONSTRAINT "ConductDeduction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConductDeduction_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConductDeduction_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ConductDeduction" ("amount", "category", "createdAt", "id", "reason", "recordedByUserId", "studentId", "type") SELECT "amount", "category", "createdAt", "id", "reason", "recordedByUserId", "studentId", "type" FROM "ConductDeduction";
DROP TABLE "ConductDeduction";
ALTER TABLE "new_ConductDeduction" RENAME TO "ConductDeduction";
CREATE INDEX "ConductDeduction_studentId_idx" ON "ConductDeduction"("studentId");
CREATE INDEX "ConductDeduction_createdAt_idx" ON "ConductDeduction"("createdAt");
CREATE INDEX "ConductDeduction_cancelledAt_idx" ON "ConductDeduction"("cancelledAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("active", "createdAt", "fullName", "id", "passwordHash", "role", "updatedAt", "username") SELECT "active", "createdAt", "fullName", "id", "passwordHash", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
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
    "cancelledAt" DATETIME,
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    CONSTRAINT "WasteScoreEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WasteScoreEntry_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WasteScoreEntry" ("classRoom", "createdAt", "id", "note", "pointsAwarded", "quantity", "recordedByUserId", "studentId", "targetType", "wasteTypeId") SELECT "classRoom", "createdAt", "id", "note", "pointsAwarded", "quantity", "recordedByUserId", "studentId", "targetType", "wasteTypeId" FROM "WasteScoreEntry";
DROP TABLE "WasteScoreEntry";
ALTER TABLE "new_WasteScoreEntry" RENAME TO "WasteScoreEntry";
CREATE INDEX "WasteScoreEntry_classRoom_idx" ON "WasteScoreEntry"("classRoom");
CREATE INDEX "WasteScoreEntry_createdAt_idx" ON "WasteScoreEntry"("createdAt");
CREATE INDEX "WasteScoreEntry_cancelledAt_idx" ON "WasteScoreEntry"("cancelledAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
