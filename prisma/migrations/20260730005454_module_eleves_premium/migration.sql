-- CreateTable
CREATE TABLE `eleves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `matricule` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `postnom` VARCHAR(191) NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `sexe` VARCHAR(1) NOT NULL,
    `date_naissance` DATE NOT NULL,
    `lieu_naissance` VARCHAR(191) NULL,
    `nationalite` VARCHAR(191) NULL DEFAULT 'Congolaise',
    `adresse` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NULL,
    `numero_permanent` VARCHAR(191) NULL,
    `groupe_sanguin` VARCHAR(191) NULL,
    `allergies` TEXT NULL,
    `handicap` TEXT NULL,
    `contact_urgence` VARCHAR(191) NULL,
    `telephone_urgence` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'actif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `eleves_ecole_id_statut_idx`(`ecole_id`, `statut`),
    INDEX `eleves_nom_prenom_idx`(`nom`, `prenom`),
    UNIQUE INDEX `eleves_ecole_id_matricule_key`(`ecole_id`, `matricule`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `responsables_eleves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `eleve_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `profession` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `principal` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `responsables_eleves_eleve_id_idx`(`eleve_id`),
    INDEX `responsables_eleves_ecole_id_idx`(`ecole_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eleve_id` INTEGER NOT NULL,
    `classe_id` INTEGER NOT NULL,
    `annee_scolaire_id` INTEGER NOT NULL,
    `date_inscription` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type_admission` VARCHAR(191) NOT NULL DEFAULT 'nouveau',
    `ancienne_ecole` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'inscrit',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inscriptions_classe_id_annee_scolaire_id_idx`(`classe_id`, `annee_scolaire_id`),
    UNIQUE INDEX `inscriptions_eleve_id_annee_scolaire_id_key`(`eleve_id`, `annee_scolaire_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents_eleves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eleve_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `nom_fichier` VARCHAR(191) NOT NULL,
    `chemin` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documents_eleves_eleve_id_idx`(`eleve_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `observations_eleves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eleve_id` INTEGER NOT NULL,
    `contenu` TEXT NOT NULL,
    `auteur` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `observations_eleves_eleve_id_idx`(`eleve_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `eleves` ADD CONSTRAINT `eleves_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `responsables_eleves` ADD CONSTRAINT `responsables_eleves_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `responsables_eleves` ADD CONSTRAINT `responsables_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscriptions` ADD CONSTRAINT `inscriptions_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscriptions` ADD CONSTRAINT `inscriptions_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscriptions` ADD CONSTRAINT `inscriptions_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents_eleves` ADD CONSTRAINT `documents_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observations_eleves` ADD CONSTRAINT `observations_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
