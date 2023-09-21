/*
  Warnings:

  - Added the required column `name` to the `Workspace` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workspaceImage" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "workspaceRootFolder" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Workspace" ("createdAt", "id", "inviteCode", "ownerId", "workspaceImage", "workspaceRootFolder") SELECT "createdAt", "id", "inviteCode", "ownerId", "workspaceImage", "workspaceRootFolder" FROM "Workspace";
DROP TABLE "Workspace";
ALTER TABLE "new_Workspace" RENAME TO "Workspace";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
