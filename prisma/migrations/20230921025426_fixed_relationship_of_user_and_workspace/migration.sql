/*
  Warnings:

  - You are about to drop the `UsersOnWorkspaces` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UsersOnWorkspaces";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_UsersOnWorkspaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UsersOnWorkspaces_A_fkey" FOREIGN KEY ("A") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UsersOnWorkspaces_B_fkey" FOREIGN KEY ("B") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_UsersOnWorkspaces_AB_unique" ON "_UsersOnWorkspaces"("A", "B");

-- CreateIndex
CREATE INDEX "_UsersOnWorkspaces_B_index" ON "_UsersOnWorkspaces"("B");
