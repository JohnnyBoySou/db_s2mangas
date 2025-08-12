/*
  Warnings:

  - The primary key for the `wallpaper_images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `wallpapers` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "wallpaper_images" DROP CONSTRAINT "wallpaper_images_wallpaperId_fkey";

-- AlterTable
ALTER TABLE "wallpaper_images" DROP CONSTRAINT "wallpaper_images_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "wallpaperId" SET DATA TYPE TEXT,
ADD CONSTRAINT "wallpaper_images_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "wallpaper_images_id_seq";

-- AlterTable
ALTER TABLE "wallpapers" DROP CONSTRAINT "wallpapers_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "wallpapers_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "wallpapers_id_seq";

-- AddForeignKey
ALTER TABLE "wallpaper_images" ADD CONSTRAINT "wallpaper_images_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpapers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
