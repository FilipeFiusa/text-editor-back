/*
  Warnings:

  - Added the required column `userId` to the `WorkspaceMessage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkspaceMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "WorkspaceMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkspaceMessage" ("content", "id", "sentAt", "workspaceId") SELECT "content", "id", "sentAt", "workspaceId" FROM "WorkspaceMessage";
DROP TABLE "WorkspaceMessage";
ALTER TABLE "new_WorkspaceMessage" RENAME TO "WorkspaceMessage";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
