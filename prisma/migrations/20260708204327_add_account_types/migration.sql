/*
  Warnings:

  - You are about to drop the column `mosqueId` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `mosqueId` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'organization',
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mosque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "capacity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT,
    CONSTRAINT "Mosque_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mosque" ("address", "city", "country", "createdAt", "id", "name", "updatedAt") SELECT "address", "city", "country", "createdAt", "id", "name", "updatedAt" FROM "Mosque";
DROP TABLE "Mosque";
ALTER TABLE "new_Mosque" RENAME TO "Mosque";
CREATE TABLE "new_Sermon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "outline" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledDate" DATETIME,
    "deliveredDate" DATETIME,
    "duration" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    "mosqueId" TEXT,
    "themeId" TEXT,
    "subTopicId" TEXT,
    CONSTRAINT "Sermon_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sermon_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sermon_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sermon_subTopicId_fkey" FOREIGN KEY ("subTopicId") REFERENCES "SubTopic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sermon" ("authorId", "content", "createdAt", "deliveredDate", "duration", "id", "mosqueId", "notes", "outline", "scheduledDate", "status", "subTopicId", "themeId", "title", "updatedAt") SELECT "authorId", "content", "createdAt", "deliveredDate", "duration", "id", "mosqueId", "notes", "outline", "scheduledDate", "status", "subTopicId", "themeId", "title", "updatedAt" FROM "Sermon";
DROP TABLE "Sermon";
ALTER TABLE "new_Sermon" RENAME TO "Sermon";
CREATE UNIQUE INDEX "Sermon_subTopicId_key" ON "Sermon"("subTopicId");
CREATE TABLE "new_Theme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT,
    "ownerId" TEXT,
    CONSTRAINT "Theme_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Theme" ("color", "createdAt", "description", "id", "month", "name", "updatedAt", "year") SELECT "color", "createdAt", "description", "id", "month", "name", "updatedAt", "year" FROM "Theme";
DROP TABLE "Theme";
ALTER TABLE "new_Theme" RENAME TO "Theme";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'khatib',
    "accountType" TEXT NOT NULL DEFAULT 'individual',
    "avatarUrl" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "firebaseUid", "id", "name", "role", "updatedAt") SELECT "avatarUrl", "createdAt", "email", "firebaseUid", "id", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
