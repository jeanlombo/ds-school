-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jeton_hash` VARCHAR(64) NOT NULL,
    `utilisateur_id` INTEGER NOT NULL,
    `expire_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_jeton_hash_key`(`jeton_hash`),
    INDEX `sessions_utilisateur_id_idx`(`utilisateur_id`),
    INDEX `sessions_expire_at_idx`(`expire_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
