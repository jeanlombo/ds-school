-- CreateTable
CREATE TABLE `historiques_eleves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eleve_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `auteur` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historiques_eleves_eleve_id_created_at_idx`(`eleve_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `historiques_eleves` ADD CONSTRAINT `historiques_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
