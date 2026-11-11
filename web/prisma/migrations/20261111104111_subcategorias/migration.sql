-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "subcategory" TEXT;

-- CreateIndex
CREATE INDEX "Listing_status_category_subcategory_idx" ON "Listing"("status", "category", "subcategory");
