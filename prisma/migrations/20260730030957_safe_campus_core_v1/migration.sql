-- CreateTable
CREATE TABLE `cartes_rfid` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(191) NOT NULL,
    `numero_interne` VARCHAR(100) NULL,
    `type_proprietaire` ENUM('ELEVE', 'ENSEIGNANT', 'PERSONNEL', 'VISITEUR') NOT NULL,
    `proprietaire_id` INTEGER NOT NULL,
    `nom_proprietaire` VARCHAR(191) NOT NULL,
    `photo_proprietaire` VARCHAR(500) NULL,
    `classe_ou_fonction` VARCHAR(191) NULL,
    `statut` ENUM('ACTIVE', 'SUSPENDUE', 'PERDUE', 'EXPIREE', 'ARCHIVEE') NOT NULL DEFAULT 'ACTIVE',
    `date_activation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_expiration` DATETIME(3) NULL,
    `motif_desactivation` TEXT NULL,
    `cree_le` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modifie_le` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cartes_rfid_uid_key`(`uid`),
    UNIQUE INDEX `cartes_rfid_numero_interne_key`(`numero_interne`),
    INDEX `cartes_rfid_type_proprietaire_proprietaire_id_idx`(`type_proprietaire`, `proprietaire_id`),
    INDEX `cartes_rfid_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lecteurs_rfid` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(80) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `type` ENUM('USB_HID', 'NFC', 'RESEAU', 'ZKTECO', 'HID', 'ACS', 'AUTRE') NOT NULL DEFAULT 'USB_HID',
    `emplacement` VARCHAR(191) NOT NULL,
    `adresse_ip` VARCHAR(100) NULL,
    `port` INTEGER NULL,
    `cle_api` VARCHAR(191) NULL,
    `direction_defaut` ENUM('ENTREE', 'SORTIE') NULL,
    `statut` ENUM('ACTIF', 'INACTIF', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIF',
    `derniere_activite` DATETIME(3) NULL,
    `cree_le` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modifie_le` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lecteurs_rfid_code_key`(`code`),
    INDEX `lecteurs_rfid_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passages_rfid` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carte_id` INTEGER NULL,
    `lecteur_id` INTEGER NULL,
    `uid_lu` VARCHAR(191) NOT NULL,
    `type_proprietaire` ENUM('ELEVE', 'ENSEIGNANT', 'PERSONNEL', 'VISITEUR') NULL,
    `proprietaire_id` INTEGER NULL,
    `nom_proprietaire` VARCHAR(191) NULL,
    `photo_proprietaire` VARCHAR(500) NULL,
    `classe_ou_fonction` VARCHAR(191) NULL,
    `direction` ENUM('ENTREE', 'SORTIE') NOT NULL,
    `resultat` ENUM('AUTORISE', 'REFUSE', 'CARTE_INCONNUE', 'CARTE_INACTIVE') NOT NULL,
    `message` VARCHAR(500) NULL,
    `date_heure` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adresse_ip_source` VARCHAR(100) NULL,

    INDEX `passages_rfid_date_heure_idx`(`date_heure`),
    INDEX `passages_rfid_proprietaire_id_type_proprietaire_idx`(`proprietaire_id`, `type_proprietaire`),
    INDEX `passages_rfid_resultat_idx`(`resultat`),
    INDEX `passages_rfid_carte_id_idx`(`carte_id`),
    INDEX `passages_rfid_lecteur_id_idx`(`lecteur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `passages_rfid` ADD CONSTRAINT `passages_rfid_carte_id_fkey` FOREIGN KEY (`carte_id`) REFERENCES `cartes_rfid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passages_rfid` ADD CONSTRAINT `passages_rfid_lecteur_id_fkey` FOREIGN KEY (`lecteur_id`) REFERENCES `lecteurs_rfid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
