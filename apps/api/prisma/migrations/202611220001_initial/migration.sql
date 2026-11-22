-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `googleId` VARCHAR(191) NULL,
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_googleId_key`(`googleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `hash` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_tokens` (
    `hash` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    INDEX `account_tokens_userId_kind_idx`(`userId`, `kind`),
    PRIMARY KEY (`hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `templates` (
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `style` VARCHAR(191) NOT NULL,
    `badge` VARCHAR(191) NULL,
    `classification` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `regularPrice` INTEGER NOT NULL,
    `offerPrice` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_versions` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `number` INTEGER NOT NULL,
    `config` JSON NOT NULL,

    UNIQUE INDEX `template_versions_templateId_number_key`(`templateId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `music_library` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `artist` VARCHAR(191) NOT NULL,
    `license` VARCHAR(191) NOT NULL,
    `file` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitations` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `templateVersionId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PAYMENT_PENDING', 'ACTIVE', 'LOCKED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `source` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `slug` VARCHAR(191) NULL,
    `previewToken` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `names` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `story` TEXT NOT NULL,
    `family` TEXT NOT NULL,
    `rsvpEnabled` BOOLEAN NOT NULL DEFAULT true,
    `musicId` VARCHAR(191) NULL,
    `finalEventAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invitations_slug_key`(`slug`),
    UNIQUE INDEX `invitations_previewToken_key`(`previewToken`),
    INDEX `invitations_ownerId_createdAt_idx`(`ownerId`, `createdAt`),
    INDEX `invitations_status_finalEventAt_idx`(`status`, `finalEventAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitation_events` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `venue` VARCHAR(191) NOT NULL,
    `mapUrl` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,

    INDEX `invitation_events_invitationId_startsAt_idx`(`invitationId`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_assets` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `file` VARCHAR(191) NOT NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `media_assets_file_key`(`file`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `source` ENUM('CUSTOMER', 'ADMIN') NOT NULL,
    `method` ENUM('ONLINE', 'LINK', 'OFFLINE') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `regularPrice` INTEGER NOT NULL,
    `offerPrice` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `gatewayOrderId` VARCHAR(191) NULL,
    `paymentLinkId` VARCHAR(191) NULL,
    `paymentLinkUrl` VARCHAR(191) NULL,
    `gatewayPaymentId` VARCHAR(191) NULL,
    `offlineReference` VARCHAR(191) NULL,
    `offlineNotes` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `orders_invitationId_key`(`invitationId`),
    UNIQUE INDEX `orders_gatewayOrderId_key`(`gatewayOrderId`),
    UNIQUE INDEX `orders_paymentLinkId_key`(`paymentLinkId`),
    UNIQUE INDEX `orders_gatewayPaymentId_key`(`gatewayPaymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guests` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `guests_invitationId_email_key`(`invitationId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rsvp_responses` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `attending` BOOLEAN NOT NULL,
    `party` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rsvp_responses_invitationId_email_key`(`invitationId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitation_views` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `invitation_views_invitationId_createdAt_idx`(`invitationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `detail` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_tokens` ADD CONSTRAINT `account_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `template_versions` ADD CONSTRAINT `template_versions_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `templates`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_templateVersionId_fkey` FOREIGN KEY (`templateVersionId`) REFERENCES `template_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_musicId_fkey` FOREIGN KEY (`musicId`) REFERENCES `music_library`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitation_events` ADD CONSTRAINT `invitation_events_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `invitations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `invitations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `invitations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guests` ADD CONSTRAINT `guests_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `invitations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rsvp_responses` ADD CONSTRAINT `rsvp_responses_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `invitations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitation_views` ADD CONSTRAINT `invitation_views_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `invitations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
