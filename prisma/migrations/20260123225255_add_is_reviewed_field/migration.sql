-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shiftType" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "personnelStatus" TEXT NOT NULL,
    "operationalNotes" TEXT NOT NULL,
    "technicalIssues" TEXT,
    "closingChecklist" BOOLEAN NOT NULL DEFAULT false,
    "managerNote" TEXT,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("authorId", "closingChecklist", "createdAt", "department", "id", "managerNote", "operationalNotes", "personnelStatus", "shiftType", "technicalIssues") SELECT "authorId", "closingChecklist", "createdAt", "department", "id", "managerNote", "operationalNotes", "personnelStatus", "shiftType", "technicalIssues" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
