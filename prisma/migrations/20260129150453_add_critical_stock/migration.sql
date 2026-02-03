-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT,
    "startStock" REAL NOT NULL,
    "currentStock" REAL NOT NULL,
    "criticalStock" REAL NOT NULL DEFAULT 10,
    "lastReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("category", "currentStock", "id", "lastReset", "name", "startStock", "unit") SELECT "category", "currentStock", "id", "lastReset", "name", "startStock", "unit" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
