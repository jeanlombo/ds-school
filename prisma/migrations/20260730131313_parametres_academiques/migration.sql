-- CreateTable
CREATE TABLE `evenements_calendrier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `annee_scolaire_id` INTEGER NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NOT NULL,
    `description` TEXT NULL,
    `couleur` VARCHAR(191) NOT NULL DEFAULT '#1761A8',
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `ecoleId` INTEGER NULL,

    INDEX `evenements_calendrier_annee_scolaire_id_date_debut_idx`(`annee_scolaire_id`, `date_debut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodes_academiques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `annee_scolaire_id` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 1,
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NOT NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `periodes_academiques_annee_scolaire_id_ordre_idx`(`annee_scolaire_id`, `ordre`),
    UNIQUE INDEX `periodes_academiques_annee_scolaire_id_nom_key`(`annee_scolaire_id`, `nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jours_ouvrables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `jour` VARCHAR(191) NOT NULL,
    `ordre` INTEGER NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,

    INDEX `jours_ouvrables_ecole_id_actif_ordre_idx`(`ecole_id`, `actif`, `ordre`),
    UNIQUE INDEX `jours_ouvrables_ecole_id_jour_key`(`ecole_id`, `jour`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `creneaux_horaires` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `ordre` INTEGER NOT NULL,
    `heure_debut` VARCHAR(5) NOT NULL,
    `heure_fin` VARCHAR(5) NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `creneaux_horaires_ecole_id_actif_idx`(`ecole_id`, `actif`),
    UNIQUE INDEX `creneaux_horaires_ecole_id_ordre_key`(`ecole_id`, `ordre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pauses_academiques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `heure_debut` VARCHAR(5) NOT NULL,
    `heure_fin` VARCHAR(5) NOT NULL,
    `couleur` VARCHAR(191) NOT NULL DEFAULT '#F59E0B',
    `actif` BOOLEAN NOT NULL DEFAULT true,

    INDEX `pauses_academiques_ecole_id_actif_idx`(`ecole_id`, `actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `capacite` INTEGER NOT NULL DEFAULT 40,
    `batiment` VARCHAR(191) NULL,
    `etage` VARCHAR(191) NULL,
    `responsable` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `salles_ecole_id_statut_idx`(`ecole_id`, `statut`),
    UNIQUE INDEX `salles_ecole_id_code_key`(`ecole_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `types_cours` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `couleur` VARCHAR(191) NOT NULL DEFAULT '#1761A8',
    `actif` BOOLEAN NOT NULL DEFAULT true,

    INDEX `types_cours_ecole_id_actif_idx`(`ecole_id`, `actif`),
    UNIQUE INDEX `types_cours_ecole_id_code_key`(`ecole_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regles_academiques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `max_cours_jour` INTEGER NOT NULL DEFAULT 8,
    `max_periodes_enseignant` INTEGER NOT NULL DEFAULT 8,
    `max_cours_consecutifs` INTEGER NOT NULL DEFAULT 3,
    `duree_min_entre_cours` INTEGER NOT NULL DEFAULT 0,
    `duree_max_periode` INTEGER NOT NULL DEFAULT 120,
    `gestion_conflits` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `regles_academiques_ecole_id_key`(`ecole_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `evenements_calendrier` ADD CONSTRAINT `evenements_calendrier_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evenements_calendrier` ADD CONSTRAINT `evenements_calendrier_ecoleId_fkey` FOREIGN KEY (`ecoleId`) REFERENCES `ecoles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodes_academiques` ADD CONSTRAINT `periodes_academiques_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jours_ouvrables` ADD CONSTRAINT `jours_ouvrables_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creneaux_horaires` ADD CONSTRAINT `creneaux_horaires_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pauses_academiques` ADD CONSTRAINT `pauses_academiques_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salles` ADD CONSTRAINT `salles_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `types_cours` ADD CONSTRAINT `types_cours_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regles_academiques` ADD CONSTRAINT `regles_academiques_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
