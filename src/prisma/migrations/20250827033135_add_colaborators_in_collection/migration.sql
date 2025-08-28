/*
  Warnings:

  - You are about to drop the `_CollectionMangas` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."CollaboratorRole" AS ENUM ('EDITOR', 'ADMIN');

-- DropForeignKey
ALTER TABLE "public"."_CollectionMangas" DROP CONSTRAINT "_CollectionMangas_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CollectionMangas" DROP CONSTRAINT "_CollectionMangas_B_fkey";

-- DropTable
DROP TABLE "public"."_CollectionMangas";

-- CreateTable
CREATE TABLE "public"."CollectionCollaborator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "role" "public"."CollaboratorRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionManga" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionManga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCollaborator_userId_collectionId_key" ON "public"."CollectionCollaborator"("userId", "collectionId");

-- CreateIndex
CREATE INDEX "CollectionManga_addedBy_idx" ON "public"."CollectionManga"("addedBy");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionManga_collectionId_mangaId_key" ON "public"."CollectionManga"("collectionId", "mangaId");

-- AddForeignKey
ALTER TABLE "public"."CollectionCollaborator" ADD CONSTRAINT "CollectionCollaborator_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionCollaborator" ADD CONSTRAINT "CollectionCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionManga" ADD CONSTRAINT "CollectionManga_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionManga" ADD CONSTRAINT "CollectionManga_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionManga" ADD CONSTRAINT "CollectionManga_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "public"."Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
