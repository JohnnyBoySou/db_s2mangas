-- CreateEnum
CREATE TYPE "MangaListStatus" AS ENUM ('PRIVATE', 'PUBLIC', 'UNLISTED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "data" JSONB;

-- CreateTable
CREATE TABLE "MangaList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "description" TEXT,
    "status" "MangaListStatus" NOT NULL DEFAULT 'PRIVATE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MangaList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MangaListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MangaListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MangaListLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MangaListLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MangaList_status_idx" ON "MangaList"("status");

-- CreateIndex
CREATE INDEX "MangaListItem_listId_order_idx" ON "MangaListItem"("listId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "MangaListItem_listId_mangaId_key" ON "MangaListItem"("listId", "mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "MangaListLike_userId_listId_key" ON "MangaListLike"("userId", "listId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "MangaListItem" ADD CONSTRAINT "MangaListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "MangaList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaListItem" ADD CONSTRAINT "MangaListItem_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaListLike" ADD CONSTRAINT "MangaListLike_listId_fkey" FOREIGN KEY ("listId") REFERENCES "MangaList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaListLike" ADD CONSTRAINT "MangaListLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
