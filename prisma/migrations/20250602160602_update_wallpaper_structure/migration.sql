-- CreateTable
CREATE TABLE "wallpapers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cover" VARCHAR(2083) NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "wallpapers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallpaper_images" (
    "id" BIGSERIAL NOT NULL,
    "wallpaperId" BIGINT NOT NULL,
    "url" VARCHAR(2083) NOT NULL,

    CONSTRAINT "wallpaper_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wallpaper_images" ADD CONSTRAINT "wallpaper_images_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "wallpapers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
