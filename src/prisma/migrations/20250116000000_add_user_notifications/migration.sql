-- CreateTable
-- Re-add userId, data, and isRead fields to Notification table

ALTER TABLE "Notification" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Notification" ADD COLUMN "data" JSONB;
ALTER TABLE "Notification" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;