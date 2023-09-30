/*
  Warnings:

  - You are about to drop the column `receivintUserId` on the `DirectMessage` table. All the data in the column will be lost.
  - Added the required column `directChatId` to the `DirectMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "DirectChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "DirectChat_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_UsersOnChats" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UsersOnChats_A_fkey" FOREIGN KEY ("A") REFERENCES "DirectChat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UsersOnChats_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DirectMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "directChatId" TEXT NOT NULL,
    CONSTRAINT "DirectMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DirectMessage_directChatId_fkey" FOREIGN KEY ("directChatId") REFERENCES "DirectChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DirectMessage" ("content", "id", "sentAt", "userId") SELECT "content", "id", "sentAt", "userId" FROM "DirectMessage";
DROP TABLE "DirectMessage";
ALTER TABLE "new_DirectMessage" RENAME TO "DirectMessage";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_UsersOnChats_AB_unique" ON "_UsersOnChats"("A", "B");

-- CreateIndex
CREATE INDEX "_UsersOnChats_B_index" ON "_UsersOnChats"("B");
