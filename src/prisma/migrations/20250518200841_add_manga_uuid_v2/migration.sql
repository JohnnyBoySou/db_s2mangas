/*
  Warnings:

  - A unique constraint covering the columns `[manga_uuid]` on the table `Manga` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Manga" ADD COLUMN     "manga_uuid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Manga_manga_uuid_key" ON "Manga"("manga_uuid");
