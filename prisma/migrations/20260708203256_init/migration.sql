-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'khatib',
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mosqueId" TEXT,
    CONSTRAINT "User_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mosque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mosqueId" TEXT NOT NULL,
    CONSTRAINT "Theme_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "themeId" TEXT NOT NULL,
    CONSTRAINT "SubTopic_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sermon" (
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
    "mosqueId" TEXT NOT NULL,
    "themeId" TEXT,
    "subTopicId" TEXT,
    CONSTRAINT "Sermon_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sermon_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sermon_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sermon_subTopicId_fkey" FOREIGN KEY ("subTopicId") REFERENCES "SubTopic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER,
    "comment" TEXT,
    "attendance" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sermonId" TEXT NOT NULL,
    CONSTRAINT "Feedback_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "url" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sermonId" TEXT NOT NULL,
    CONSTRAINT "Reference_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sermon_subTopicId_key" ON "Sermon"("subTopicId");
