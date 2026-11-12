-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_bookingId_fkey";

-- DropIndex
DROP INDEX "Message_bookingId_createdAt_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "conversationId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSenderId" TEXT,
    "ownerReadAt" TIMESTAMP(3),
    "renterReadAt" TIMESTAMP(3),
    "ownerEmailedAt" TIMESTAMP(3),
    "renterEmailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Nadie puede escribirse a sí mismo.
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_two_people" CHECK ("ownerId" <> "renterId");

-- Los mensajes que ya existían (chat de cada reserva) pasan a su conversación.
INSERT INTO "Conversation" ("id", "listingId", "ownerId", "renterId", "lastMessageAt", "createdAt")
SELECT 'c' || md5(b."listingId" || ':' || b."renterId"), b."listingId", min(b."ownerId"), b."renterId", max(m."createdAt"), min(m."createdAt")
FROM "Message" m JOIN "Booking" b ON b."id" = m."bookingId"
GROUP BY b."listingId", b."renterId";

UPDATE "Message" m SET "conversationId" = 'c' || md5(b."listingId" || ':' || b."renterId")
FROM "Booking" b WHERE b."id" = m."bookingId";

UPDATE "Conversation" c SET "lastSenderId" = (
  SELECT m."senderId" FROM "Message" m WHERE m."conversationId" = c."id" ORDER BY m."createdAt" DESC LIMIT 1
);

ALTER TABLE "Message" ALTER COLUMN "conversationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Conversation_ownerId_lastMessageAt_idx" ON "Conversation"("ownerId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_renterId_lastMessageAt_idx" ON "Conversation"("renterId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_listingId_renterId_key" ON "Conversation"("listingId", "renterId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
