-- CreateTable
CREATE TABLE `enseignants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `matricule` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `postnom` VARCHAR(191) NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `sexe` VARCHAR(1) NOT NULL,
    `date_naissance` DATE NULL,
    `lieu_naissance` VARCHAR(191) NULL,
    `nationalite` VARCHAR(191) NULL DEFAULT 'Congolaise',
    `etat_civil` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NULL,
    `signature` VARCHAR(191) NULL,
    `fonction` VARCHAR(191) NOT NULL DEFAULT 'Enseignant',
    `specialite` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NULL,
    `date_engagement` DATE NULL,
    `numero_piece` VARCHAR(191) NULL,
    `type_piece` VARCHAR(191) NULL,
    `numero_carte_rfid` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'actif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `enseignants_numero_carte_rfid_key`(`numero_carte_rfid`),
    INDEX `enseignants_ecole_id_statut_idx`(`ecole_id`, `statut`),
    INDEX `enseignants_nom_prenom_idx`(`nom`, `prenom`),
    UNIQUE INDEX `enseignants_ecole_id_matricule_key`(`ecole_id`, `matricule`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diplomes_enseignants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enseignant_id` INTEGER NOT NULL,
    `intitule` VARCHAR(191) NOT NULL,
    `etablissement` VARCHAR(191) NULL,
    `annee` INTEGER NULL,
    `fichier` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `diplomes_enseignants_enseignant_id_idx`(`enseignant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contrats_enseignants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enseignant_id` INTEGER NOT NULL,
    `type_contrat` VARCHAR(191) NOT NULL,
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NULL,
    `salaire` DECIMAL(14, 2) NULL,
    `devise` VARCHAR(191) NOT NULL DEFAULT 'CDF',
    `statut` VARCHAR(191) NOT NULL DEFAULT 'actif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contrats_enseignants_enseignant_id_statut_idx`(`enseignant_id`, `statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affectations_enseignants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enseignant_id` INTEGER NOT NULL,
    `classe_id` INTEGER NULL,
    `matiere` VARCHAR(191) NOT NULL,
    `volume_horaire` INTEGER NULL,
    `annee_libelle` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `affectations_enseignants_enseignant_id_idx`(`enseignant_id`),
    INDEX `affectations_enseignants_classe_id_idx`(`classe_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents_enseignants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enseignant_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `nom_fichier` VARCHAR(191) NOT NULL,
    `chemin` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documents_enseignants_enseignant_id_idx`(`enseignant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historiques_enseignants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enseignant_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `auteur` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historiques_enseignants_enseignant_id_created_at_idx`(`enseignant_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `enseignants` ADD CONSTRAINT `enseignants_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diplomes_enseignants` ADD CONSTRAINT `diplomes_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contrats_enseignants` ADD CONSTRAINT `contrats_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affectations_enseignants` ADD CONSTRAINT `affectations_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affectations_enseignants` ADD CONSTRAINT `affectations_enseignants_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents_enseignants` ADD CONSTRAINT `documents_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historiques_enseignants` ADD CONSTRAINT `historiques_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
