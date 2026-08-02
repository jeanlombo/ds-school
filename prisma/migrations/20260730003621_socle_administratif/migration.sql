-- AlterTable
ALTER TABLE `ecoles` ADD COLUMN `boite_postale` VARCHAR(191) NULL,
    ADD COLUMN `devise` VARCHAR(191) NOT NULL DEFAULT 'CDF',
    ADD COLUMN `directeur` VARCHAR(191) NULL,
    ADD COLUMN `logo` VARCHAR(191) NULL,
    ADD COLUMN `pays` VARCHAR(191) NULL DEFAULT 'République démocratique du Congo',
    ADD COLUMN `site_web` VARCHAR(191) NULL,
    ADD COLUMN `slogan` VARCHAR(191) NULL,
    ADD COLUMN `ville` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `annees_scolaires` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'ouverte',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `annees_scolaires_ecole_id_active_idx`(`ecole_id`, `active`),
    UNIQUE INDEX `annees_scolaires_ecole_id_libelle_key`(`ecole_id`, `libelle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sections_ecole_id_statut_idx`(`ecole_id`, `statut`),
    UNIQUE INDEX `sections_ecole_id_code_key`(`ecole_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `section_id` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `niveau` VARCHAR(191) NULL,
    `capacite` INTEGER NOT NULL DEFAULT 40,
    `titulaire` VARCHAR(191) NULL,
    `local` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `classes_section_id_idx`(`section_id`),
    INDEX `classes_ecole_id_statut_idx`(`ecole_id`, `statut`),
    UNIQUE INDEX `classes_ecole_id_code_key`(`ecole_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `annees_scolaires` ADD CONSTRAINT `annees_scolaires_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
