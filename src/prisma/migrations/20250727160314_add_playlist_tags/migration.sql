-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tags" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tags_playlistId_tagId_key" ON "playlist_tags"("playlistId", "tagId");

-- AddForeignKey
ALTER TABLE "playlist_tags" ADD CONSTRAINT "playlist_tags_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tags" ADD CONSTRAINT "playlist_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
