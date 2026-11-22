-- AlterTable
ALTER TABLE `orders` ADD COLUMN `couponCode` VARCHAR(191) NULL,
    ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `coupons` (
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('FIXED', 'PERCENT') NOT NULL,
    `value` INTEGER NOT NULL,
    `minimumOrder` INTEGER NOT NULL,
    `maximumDiscount` INTEGER NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `usageLimit` INTEGER NULL,
    `perUserLimit` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `orders_couponCode_status_idx` ON `orders`(`couponCode`, `status`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_couponCode_fkey` FOREIGN KEY (`couponCode`) REFERENCES `coupons`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;
