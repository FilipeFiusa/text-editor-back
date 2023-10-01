/*
  Warnings:

  - You are about to drop the column `ownerId` on the `DirectChat` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DirectChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DirectChat" ("createdAt", "id") SELECT "createdAt", "id" FROM "DirectChat";
DROP TABLE "DirectChat";
ALTER TABLE "new_DirectChat" RENAME TO "DirectChat";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
