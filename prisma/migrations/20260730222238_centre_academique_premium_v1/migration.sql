-- CreateTable
CREATE TABLE `types_evaluations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `nom` VARCHAR(120) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `coefficient_par_defaut` DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    `note_max_par_defaut` DECIMAL(8, 2) NOT NULL DEFAULT 20.00,
    `couleur` VARCHAR(20) NOT NULL DEFAULT '#1761A8',
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `types_evaluations_ecole_id_actif_idx`(`ecole_id`, `actif`),
    UNIQUE INDEX `types_evaluations_ecole_id_code_key`(`ecole_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `type_evaluation_id` INTEGER NOT NULL,
    `annee_scolaire_id` INTEGER NOT NULL,
    `periode_academique_id` INTEGER NOT NULL,
    `classe_id` INTEGER NOT NULL,
    `matiere_id` INTEGER NOT NULL,
    `enseignant_id` INTEGER NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `date_evaluation` DATE NOT NULL,
    `duree_minutes` INTEGER NULL,
    `note_max` DECIMAL(8, 2) NOT NULL DEFAULT 20.00,
    `coefficient` DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    `statut` ENUM('BROUILLON', 'PUBLIEE', 'CLOTUREE') NOT NULL DEFAULT 'BROUILLON',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `evaluations_ecole_id_annee_scolaire_id_periode_academique_id_idx`(`ecole_id`, `annee_scolaire_id`, `periode_academique_id`),
    INDEX `evaluations_classe_id_matiere_id_date_evaluation_idx`(`classe_id`, `matiere_id`, `date_evaluation`),
    INDEX `evaluations_enseignant_id_statut_idx`(`enseignant_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notes_academiques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evaluation_id` INTEGER NOT NULL,
    `inscription_id` INTEGER NOT NULL,
    `note` DECIMAL(8, 2) NULL,
    `absent` BOOLEAN NOT NULL DEFAULT false,
    `appreciation` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notes_academiques_inscription_id_idx`(`inscription_id`),
    UNIQUE INDEX `notes_academiques_evaluation_id_inscription_id_key`(`evaluation_id`, `inscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regles_evaluations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `seuil_reussite` DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    `mention_excellent` DECIMAL(5, 2) NOT NULL DEFAULT 80.00,
    `mention_tres_bien` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    `mention_bien` DECIMAL(5, 2) NOT NULL DEFAULT 60.00,
    `mention_assez_bien` DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    `arrondi_decimales` INTEGER NOT NULL DEFAULT 2,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `regles_evaluations_ecole_id_key`(`ecole_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `types_evaluations` ADD CONSTRAINT `types_evaluations_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_type_evaluation_id_fkey` FOREIGN KEY (`type_evaluation_id`) REFERENCES `types_evaluations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_periode_academique_id_fkey` FOREIGN KEY (`periode_academique_id`) REFERENCES `periodes_academiques`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_matiere_id_fkey` FOREIGN KEY (`matiere_id`) REFERENCES `matieres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes_academiques` ADD CONSTRAINT `notes_academiques_evaluation_id_fkey` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes_academiques` ADD CONSTRAINT `notes_academiques_inscription_id_fkey` FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regles_evaluations` ADD CONSTRAINT `regles_evaluations_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
