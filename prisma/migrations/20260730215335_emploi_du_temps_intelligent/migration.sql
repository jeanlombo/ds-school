-- CreateTable
CREATE TABLE `seances_emploi_temps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ecole_id` INTEGER NOT NULL,
    `annee_scolaire_id` INTEGER NOT NULL,
    `classe_id` INTEGER NOT NULL,
    `matiere_id` INTEGER NOT NULL,
    `enseignant_id` INTEGER NOT NULL,
    `creneau_horaire_id` INTEGER NOT NULL,
    `salle_id` INTEGER NULL,
    `type_cours_id` INTEGER NULL,
    `jour` VARCHAR(20) NOT NULL,
    `observations` TEXT NULL,
    `statut` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_edt_salle_creneau`(`annee_scolaire_id`, `salle_id`, `jour`, `creneau_horaire_id`),
    INDEX `seances_emploi_temps_ecole_id_annee_scolaire_id_statut_idx`(`ecole_id`, `annee_scolaire_id`, `statut`),
    INDEX `seances_emploi_temps_classe_id_jour_idx`(`classe_id`, `jour`),
    INDEX `seances_emploi_temps_enseignant_id_jour_idx`(`enseignant_id`, `jour`),
    UNIQUE INDEX `uq_edt_classe_creneau`(`annee_scolaire_id`, `classe_id`, `jour`, `creneau_horaire_id`),
    UNIQUE INDEX `uq_edt_enseignant_creneau`(`annee_scolaire_id`, `enseignant_id`, `jour`, `creneau_horaire_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_matiere_id_fkey` FOREIGN KEY (`matiere_id`) REFERENCES `matieres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_creneau_horaire_id_fkey` FOREIGN KEY (`creneau_horaire_id`) REFERENCES `creneaux_horaires`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_salle_id_fkey` FOREIGN KEY (`salle_id`) REFERENCES `salles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seances_emploi_temps` ADD CONSTRAINT `seances_emploi_temps_type_cours_id_fkey` FOREIGN KEY (`type_cours_id`) REFERENCES `types_cours`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
