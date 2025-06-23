-- CreateTable
CREATE TABLE "ProfileLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLike_userId_targetId_key" ON "ProfileLike"("userId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileFollow_userId_targetId_key" ON "ProfileFollow"("userId", "targetId");

-- AddForeignKey
ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFollow" ADD CONSTRAINT "ProfileFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFollow" ADD CONSTRAINT "ProfileFollow_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
