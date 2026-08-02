-- CreateTable
CREATE TABLE `modeles_bulletins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `nom` VARCHAR(160) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `niveau` VARCHAR(100) NULL,
    `orientation` VARCHAR(20) NOT NULL DEFAULT 'PORTRAIT',
    `format_papier` VARCHAR(20) NOT NULL DEFAULT 'A4',
    `couleur_principale` VARCHAR(20) NOT NULL DEFAULT '#1761A8',
    `couleur_secondaire` VARCHAR(20) NOT NULL DEFAULT '#F4B400',
    `titre_document` VARCHAR(191) NOT NULL DEFAULT 'BULLETIN SCOLAIRE',
    `afficher_logo` BOOLEAN NOT NULL DEFAULT true,
    `afficher_photo` BOOLEAN NOT NULL DEFAULT true,
    `afficher_classement` BOOLEAN NOT NULL DEFAULT true,
    `afficher_absences` BOOLEAN NOT NULL DEFAULT true,
    `afficher_qr_code` BOOLEAN NOT NULL DEFAULT true,
    `afficher_cachet` BOOLEAN NOT NULL DEFAULT true,
    `signature1` VARCHAR(100) NULL,
    `signature2` VARCHAR(100) NULL,
    `signature3` VARCHAR(100) NULL,
    `texte_pied_page` TEXT NULL,
    `fond_document` VARCHAR(500) NULL,
    `configuration` JSON NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `par_defaut` BOOLEAN NOT NULL DEFAULT false,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `modeles_bulletins_ecole_id_actif_par_defaut_idx`(`ecole_id`, `actif`, `par_defaut`),
    UNIQUE INDEX `modeles_bulletins_ecole_id_code_key`(`ecole_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `versions_modeles_bulletins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modele_bulletin_id` INTEGER NOT NULL,
    `numero_version` INTEGER NOT NULL,
    `configuration` JSON NULL,
    `commentaire` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `versions_modeles_bulletins_modele_bulletin_id_numero_version_key`(`modele_bulletin_id`, `numero_version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `modeles_bulletins` ADD CONSTRAINT `modeles_bulletins_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `versions_modeles_bulletins` ADD CONSTRAINT `versions_modeles_bulletins_modele_bulletin_id_fkey` FOREIGN KEY (`modele_bulletin_id`) REFERENCES `modeles_bulletins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
