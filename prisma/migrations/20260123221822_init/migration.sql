-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "fullName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shiftType" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "personnelStatus" TEXT NOT NULL,
    "operationalNotes" TEXT NOT NULL,
    "technicalIssues" TEXT,
    "closingChecklist" BOOLEAN NOT NULL DEFAULT false,
    "managerNote" TEXT,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
