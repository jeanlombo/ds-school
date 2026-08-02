-- CreateTable
CREATE TABLE `matieres` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `nom` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `departement` VARCHAR(100) NULL,
    `coefficient` DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    `volume_horaire_hebdomadaire` INTEGER NOT NULL DEFAULT 1,
    `couleur` VARCHAR(20) NOT NULL DEFAULT '#2563EB',
    `statut` ENUM('ACTIF', 'INACTIF') NOT NULL DEFAULT 'ACTIF',
    `cree_le` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modifie_le` DATETIME(3) NOT NULL,

    UNIQUE INDEX `matieres_code_key`(`code`),
    INDEX `matieres_nom_idx`(`nom`),
    INDEX `matieres_departement_idx`(`departement`),
    INDEX `matieres_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
