-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : lun. 03 août 2026 à 02:23
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `ds_school`
--

-- --------------------------------------------------------

--
-- Structure de la table `affectations_enseignants`
--

CREATE TABLE `affectations_enseignants` (
  `id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `matiere` varchar(191) NOT NULL,
  `volume_horaire` int(11) DEFAULT NULL,
  `annee_libelle` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `affectations_utilisateurs_classes`
--

CREATE TABLE `affectations_utilisateurs_classes` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `matiere_id` int(11) DEFAULT NULL,
  `fonction` varchar(80) NOT NULL,
  `principal` tinyint(1) NOT NULL DEFAULT 0,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `annees_scolaires`
--

CREATE TABLE `annees_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `libelle` varchar(191) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0,
  `statut` varchar(191) NOT NULL DEFAULT 'ouverte',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `annees_scolaires`
--

INSERT INTO `annees_scolaires` (`id`, `ecole_id`, `libelle`, `date_debut`, `date_fin`, `active`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-2027', '2026-06-30', '2026-12-30', 1, 'ouverte', '2026-07-30 00:45:39.491', '2026-07-30 00:45:51.931');

-- --------------------------------------------------------

--
-- Structure de la table `avantages_financiers_scolaires`
--

CREATE TABLE `avantages_financiers_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `inscription_id` int(11) NOT NULL,
  `type_avantage` varchar(30) NOT NULL,
  `libelle` varchar(180) NOT NULL,
  `type_valeur` varchar(30) NOT NULL,
  `valeur` decimal(15,2) NOT NULL,
  `devise` varchar(10) DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIF',
  `motif` text DEFAULT NULL,
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cartes_rfid`
--

CREATE TABLE `cartes_rfid` (
  `id` int(11) NOT NULL,
  `uid` varchar(191) NOT NULL,
  `numero_interne` varchar(100) DEFAULT NULL,
  `type_proprietaire` enum('ELEVE','ENSEIGNANT','PERSONNEL','VISITEUR') NOT NULL,
  `proprietaire_id` int(11) NOT NULL,
  `nom_proprietaire` varchar(191) NOT NULL,
  `photo_proprietaire` varchar(500) DEFAULT NULL,
  `classe_ou_fonction` varchar(191) DEFAULT NULL,
  `statut` enum('ACTIVE','SUSPENDUE','PERDUE','EXPIREE','ARCHIVEE') NOT NULL DEFAULT 'ACTIVE',
  `date_activation` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `date_expiration` datetime(3) DEFAULT NULL,
  `motif_desactivation` text DEFAULT NULL,
  `cree_le` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modifie_le` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cartes_rfid`
--

INSERT INTO `cartes_rfid` (`id`, `uid`, `numero_interne`, `type_proprietaire`, `proprietaire_id`, `nom_proprietaire`, `photo_proprietaire`, `classe_ou_fonction`, `statut`, `date_activation`, `date_expiration`, `motif_desactivation`, `cree_le`, `modifie_le`) VALUES
(1, '04A1B2C3D4', 'RFID-2026-0001', 'ELEVE', 1, 'LOMBO LOFUMA', NULL, '6A', 'ACTIVE', '2026-07-30 03:14:44.806', NULL, NULL, '2026-07-30 03:14:44.806', '2026-07-30 03:16:02.863');

-- --------------------------------------------------------

--
-- Structure de la table `categories_frais_scolaires`
--

CREATE TABLE `categories_frais_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `libelle` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `icone` varchar(80) DEFAULT NULL,
  `couleur` varchar(30) DEFAULT NULL,
  `ordre_affichage` int(11) NOT NULL DEFAULT 0,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories_frais_scolaires`
--

INSERT INTO `categories_frais_scolaires` (`id`, `ecole_id`, `code`, `libelle`, `description`, `icone`, `couleur`, `ordre_affichage`, `actif`, `cree_par`, `created_at`, `updated_at`) VALUES
(1, 1, 'MINERVAL', 'Minerval', 'Frais mensuels de scolarit', NULL, NULL, 0, 1, 'Administrateur Principal', '2026-08-01 20:36:22', '2026-08-01 20:36:22');

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `niveau` varchar(191) DEFAULT NULL,
  `capacite` int(11) NOT NULL DEFAULT 40,
  `titulaire` varchar(191) DEFAULT NULL,
  `local` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `classes`
--

INSERT INTO `classes` (`id`, `ecole_id`, `section_id`, `nom`, `code`, `niveau`, `capacite`, `titulaire`, `local`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '1ere A', '1A', '1ere Annee', 40, 'Jea LOMBO', 'Batimat A', 'active', '2026-07-30 01:12:24.776', '2026-07-30 01:12:24.776');

-- --------------------------------------------------------

--
-- Structure de la table `comptes_parents`
--

CREATE TABLE `comptes_parents` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `identifiant` varchar(100) NOT NULL,
  `email_connexion` varchar(191) DEFAULT NULL,
  `mot_de_passe_hash` varchar(255) NOT NULL,
  `doit_changer_mot_de_passe` tinyint(1) NOT NULL DEFAULT 1,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIF',
  `tentatives_echouees` int(11) NOT NULL DEFAULT 0,
  `verrouille_jusqua` datetime DEFAULT NULL,
  `derniere_connexion` datetime DEFAULT NULL,
  `derniere_ip` varchar(100) DEFAULT NULL,
  `dernier_appareil` text DEFAULT NULL,
  `qr_code` varchar(500) DEFAULT NULL,
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `connexions_parents`
--

CREATE TABLE `connexions_parents` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `date_connexion` datetime NOT NULL DEFAULT current_timestamp(),
  `date_deconnexion` datetime DEFAULT NULL,
  `adresse_ip` varchar(100) DEFAULT NULL,
  `appareil` text DEFAULT NULL,
  `navigateur` varchar(191) DEFAULT NULL,
  `localisation` varchar(191) DEFAULT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `contrats_enseignants`
--

CREATE TABLE `contrats_enseignants` (
  `id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `type_contrat` varchar(191) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `salaire` decimal(14,2) DEFAULT NULL,
  `devise` varchar(191) NOT NULL DEFAULT 'CDF',
  `statut` varchar(191) NOT NULL DEFAULT 'actif',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `creneaux_horaires`
--

CREATE TABLE `creneaux_horaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `ordre` int(11) NOT NULL,
  `heure_debut` varchar(5) NOT NULL,
  `heure_fin` varchar(5) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `crm_activites`
--

CREATE TABLE `crm_activites` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `prospect_id` int(11) NOT NULL,
  `type` varchar(40) NOT NULL,
  `objet` varchar(191) NOT NULL,
  `contenu` text DEFAULT NULL,
  `date_activite` datetime NOT NULL DEFAULT current_timestamp(),
  `auteur` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `crm_prospects`
--

CREATE TABLE `crm_prospects` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `code` varchar(40) NOT NULL,
  `nom_eleve` varchar(191) NOT NULL,
  `postnom_eleve` varchar(191) DEFAULT NULL,
  `prenom_eleve` varchar(191) DEFAULT NULL,
  `sexe` varchar(20) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `nom_responsable` varchar(191) NOT NULL,
  `telephone` varchar(50) NOT NULL,
  `telephone_secondaire` varchar(50) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `ville` varchar(120) DEFAULT NULL,
  `ecole_origine` varchar(191) DEFAULT NULL,
  `classe_souhaitee` varchar(120) DEFAULT NULL,
  `annee_scolaire` varchar(50) DEFAULT NULL,
  `source` varchar(80) NOT NULL DEFAULT 'Autre',
  `statut` varchar(40) NOT NULL DEFAULT 'NOUVEAU',
  `priorite` varchar(20) NOT NULL DEFAULT 'TIEDE',
  `score` int(11) NOT NULL DEFAULT 50,
  `montant_estime` decimal(14,2) NOT NULL DEFAULT 0.00,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `conseiller` varchar(191) DEFAULT NULL,
  `prochaine_relance` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `date_conversion` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `delegations_securite`
--

CREATE TABLE `delegations_securite` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `utilisateur_source_id` int(11) NOT NULL,
  `utilisateur_cible_id` int(11) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `motif` text DEFAULT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `details_paiements_scolaires`
--

CREATE TABLE `details_paiements_scolaires` (
  `id` int(11) NOT NULL,
  `paiement_id` int(11) NOT NULL,
  `frais_id` int(11) NOT NULL,
  `tarif_id` int(11) DEFAULT NULL,
  `montant` decimal(14,2) NOT NULL DEFAULT 0.00,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `details_paiements_scolaires`
--

INSERT INTO `details_paiements_scolaires` (`id`, `paiement_id`, `frais_id`, `tarif_id`, `montant`, `devise`, `created_at`) VALUES
(1, 1, 1, 1, 200000.00, 'CDF', '2026-08-01 23:21:04');

-- --------------------------------------------------------

--
-- Structure de la table `diplomes_enseignants`
--

CREATE TABLE `diplomes_enseignants` (
  `id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `intitule` varchar(191) NOT NULL,
  `etablissement` varchar(191) DEFAULT NULL,
  `annee` int(11) DEFAULT NULL,
  `fichier` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `disponibilites_enseignants`
--

CREATE TABLE `disponibilites_enseignants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `jour` varchar(20) NOT NULL,
  `creneau_horaire_id` int(11) NOT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `documents_academiques`
--

CREATE TABLE `documents_academiques` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `inscription_id` int(11) DEFAULT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `numero` varchar(191) NOT NULL,
  `code_verification` varchar(191) NOT NULL,
  `mention` varchar(191) DEFAULT NULL,
  `session` varchar(191) DEFAULT NULL,
  `motif` text DEFAULT NULL,
  `signataire` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'VALIDE',
  `cree_par` varchar(191) DEFAULT NULL,
  `annule_par` varchar(191) DEFAULT NULL,
  `date_delivrance` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `date_annulation` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `documents_academiques`
--

INSERT INTO `documents_academiques` (`id`, `ecole_id`, `eleve_id`, `inscription_id`, `classe_id`, `annee_scolaire_id`, `type`, `numero`, `code_verification`, `mention`, `session`, `motif`, `signataire`, `statut`, `cree_par`, `annule_par`, `date_delivrance`, `date_annulation`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 2, 1, 1, 'CERTIFICAT_REUSSITE', 'CER-CS-KIS-2026-2-29307027', 'C90FD98527D292EFC2D9008132EA09B4DEA2', 'Tres bien', 'Session Ordinaire', 'L\'eleve passe a la classe superieur', 'Marie France SHABANI', 'VALIDE', 'admin@dsschool.cd', NULL, '2026-08-02 00:08:27.074', NULL, '2026-08-02 00:08:27.074', '2026-08-02 00:08:27.074');

-- --------------------------------------------------------

--
-- Structure de la table `documents_academiques_enterprise`
--

CREATE TABLE `documents_academiques_enterprise` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `inscription_id` int(11) NOT NULL,
  `type_document` varchar(60) NOT NULL,
  `libelle` varchar(190) NOT NULL,
  `numero_document` varchar(100) NOT NULL,
  `code_verification` varchar(100) NOT NULL,
  `empreinte_securite` char(64) NOT NULL,
  `date_emission` date NOT NULL,
  `mention` varchar(120) DEFAULT NULL,
  `session` varchar(120) DEFAULT NULL,
  `motif` text DEFAULT NULL,
  `statut` enum('VALIDE','ANNULE','REMPLACE','SUSPENDU') NOT NULL DEFAULT 'VALIDE',
  `motif_annulation` text DEFAULT NULL,
  `annule_par` varchar(190) DEFAULT NULL,
  `annule_le` datetime DEFAULT NULL,
  `cree_par` varchar(190) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `documents_eleves`
--

CREATE TABLE `documents_eleves` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `nom_fichier` varchar(191) NOT NULL,
  `chemin` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `documents_enseignants`
--

CREATE TABLE `documents_enseignants` (
  `id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `nom_fichier` varchar(191) NOT NULL,
  `chemin` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `documents_parents`
--

CREATE TABLE `documents_parents` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `type_document` varchar(80) NOT NULL,
  `nom_fichier` varchar(191) NOT NULL,
  `chemin` varchar(500) NOT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'VALIDE',
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `echeanciers_scolaires`
--

CREATE TABLE `echeanciers_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `inscription_id` int(11) NOT NULL,
  `frais_id` int(11) NOT NULL,
  `montant_total` decimal(15,2) NOT NULL,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `nombre_echeances` int(11) NOT NULL,
  `date_debut` date NOT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIF',
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `ecoles`
--

CREATE TABLE `ecoles` (
  `id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `adresse` varchar(191) DEFAULT NULL,
  `telephone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `boite_postale` varchar(191) DEFAULT NULL,
  `devise` varchar(191) NOT NULL DEFAULT 'CDF',
  `directeur` varchar(191) DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `pays` varchar(191) DEFAULT 'République démocratique du Congo',
  `site_web` varchar(191) DEFAULT NULL,
  `slogan` varchar(191) DEFAULT NULL,
  `ville` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `ecoles`
--

INSERT INTO `ecoles` (`id`, `nom`, `code`, `adresse`, `telephone`, `email`, `statut`, `created_at`, `updated_at`, `boite_postale`, `devise`, `directeur`, `logo`, `pays`, `site_web`, `slogan`, `ville`) VALUES
(1, 'College du Cinquantenaire de Kisangani', 'CS-KIS', 'Kisangani', '0820646942', 'nmjpro88@gmail.com', 'active', '2026-07-30 00:37:59.154', '2026-07-30 00:43:19.178', '+243', 'CDF', 'Marie France SHABANI', 'C:\\Users\\AKAM\\Downloads\\TELCH\\logo_college.png', 'République démocratique du Congo', 'RAS', 'L\'excellence scolaire, pilotée autrement', 'Kisangani');

-- --------------------------------------------------------

--
-- Structure de la table `eleves`
--

CREATE TABLE `eleves` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `matricule` varchar(191) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `postnom` varchar(191) DEFAULT NULL,
  `prenom` varchar(191) NOT NULL,
  `sexe` varchar(1) NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance` varchar(191) DEFAULT NULL,
  `nationalite` varchar(191) DEFAULT 'Congolaise',
  `adresse` varchar(191) DEFAULT NULL,
  `photo` varchar(191) DEFAULT NULL,
  `numero_permanent` varchar(191) DEFAULT NULL,
  `groupe_sanguin` varchar(191) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `handicap` text DEFAULT NULL,
  `contact_urgence` varchar(191) DEFAULT NULL,
  `telephone_urgence` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'actif',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `eleves`
--

INSERT INTO `eleves` (`id`, `ecole_id`, `matricule`, `nom`, `postnom`, `prenom`, `sexe`, `date_naissance`, `lieu_naissance`, `nationalite`, `adresse`, `photo`, `numero_permanent`, `groupe_sanguin`, `allergies`, `handicap`, `contact_urgence`, `telephone_urgence`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, 'CS-KIS-2026-00001', 'LOMBO', 'LOFUMA', 'Jean', 'M', '2000-12-10', 'KISANGANI', 'Congolaise', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', '/uploads/eleves/1785379409756-a7643e9a-d49a-4480-a57b-c92cbe6f95f4.jpg', 'RAS', 'A+', 'RAS', 'RAS', '+243895517710', '0820646942', 'actif', '2026-07-30 01:16:07.320', '2026-07-30 02:43:29.844'),
(2, 1, 'CS-KIS-2026-00002', 'LIHAMBA', 'BOFATE', 'Freddy', 'M', '1984-12-12', 'KISANGANI', 'Congolaise', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', '/uploads/eleves/1785609994533-258eeb6a-8269-4c41-a263-aa4ad672d713.jpg', 'RAS', 'A+', 'RAS', 'RAS', '+243895517710', '0820646942', 'actif', '2026-08-01 18:46:34.604', '2026-08-01 18:46:54.511');

-- --------------------------------------------------------

--
-- Structure de la table `enseignants`
--

CREATE TABLE `enseignants` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `matricule` varchar(191) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `postnom` varchar(191) DEFAULT NULL,
  `prenom` varchar(191) NOT NULL,
  `sexe` varchar(1) NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(191) DEFAULT NULL,
  `nationalite` varchar(191) DEFAULT 'Congolaise',
  `etat_civil` varchar(191) DEFAULT NULL,
  `telephone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `adresse` varchar(191) DEFAULT NULL,
  `photo` varchar(191) DEFAULT NULL,
  `signature` varchar(191) DEFAULT NULL,
  `fonction` varchar(191) NOT NULL DEFAULT 'Enseignant',
  `specialite` varchar(191) DEFAULT NULL,
  `grade` varchar(191) DEFAULT NULL,
  `date_engagement` date DEFAULT NULL,
  `numero_piece` varchar(191) DEFAULT NULL,
  `type_piece` varchar(191) DEFAULT NULL,
  `numero_carte_rfid` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'actif',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `enseignants`
--

INSERT INTO `enseignants` (`id`, `ecole_id`, `matricule`, `nom`, `postnom`, `prenom`, `sexe`, `date_naissance`, `lieu_naissance`, `nationalite`, `etat_civil`, `telephone`, `email`, `adresse`, `photo`, `signature`, `fonction`, `specialite`, `grade`, `date_engagement`, `numero_piece`, `type_piece`, `numero_carte_rfid`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, 'MAT-2026-01', 'LIHAMBA', 'BOFATE', 'Freddy', 'M', '1983-12-07', 'KISANGANI', 'Congolaise', 'Marié(e)', '0820646942', 'nmjpro88@gmail.com', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', '/uploads/enseignants/enseignant-1785626259802-kbtiwa.jpg', NULL, 'Enseignant', 'Mathematique', 'Licencier', '2026-07-31', '23465789', 'Carte d’identité', 'RAS', 'actif', '2026-08-01 23:17:39.856', '2026-08-01 23:17:39.856');

-- --------------------------------------------------------

--
-- Structure de la table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `type_evaluation_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `periode_academique_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `titre` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `date_evaluation` date NOT NULL,
  `duree_minutes` int(11) DEFAULT NULL,
  `coefficient` decimal(6,2) NOT NULL DEFAULT 1.00,
  `statut` varchar(30) NOT NULL DEFAULT 'BROUILLON',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `bareme` decimal(8,2) NOT NULL DEFAULT 20.00,
  `heure_debut` varchar(5) DEFAULT NULL,
  `publiee` tinyint(1) NOT NULL DEFAULT 0,
  `salle_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `evaluations`
--

INSERT INTO `evaluations` (`id`, `ecole_id`, `type_evaluation_id`, `annee_scolaire_id`, `periode_academique_id`, `classe_id`, `matiere_id`, `enseignant_id`, `titre`, `description`, `date_evaluation`, `duree_minutes`, `coefficient`, `statut`, `created_at`, `updated_at`, `bareme`, `heure_debut`, `publiee`, `salle_id`) VALUES
(1, 1, 1, 1, 1, 1, 1, 1, 'Interrogation de Mathematique', 'Pas de telephone ni brullion', '2026-08-02', 60, 1.00, 'PUBLIEE', '2026-08-01 23:23:00.962', '2026-08-01 23:57:23.977', 20.00, '02:22', 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `evenements_calendrier`
--

CREATE TABLE `evenements_calendrier` (
  `id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `titre` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `description` text DEFAULT NULL,
  `couleur` varchar(191) NOT NULL DEFAULT '#1761A8',
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `ecoleId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `frais_scolaires`
--

CREATE TABLE `frais_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `libelle` varchar(191) NOT NULL,
  `famille` varchar(80) NOT NULL DEFAULT 'ACADEMIQUES',
  `nature` varchar(80) NOT NULL DEFAULT 'AUTRE',
  `categorie` varchar(80) NOT NULL,
  `periodicite` varchar(50) NOT NULL DEFAULT 'UNIQUE',
  `description` text DEFAULT NULL,
  `obligatoire` tinyint(1) NOT NULL DEFAULT 1,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `penalite_active` tinyint(1) NOT NULL DEFAULT 0,
  `type_penalite` varchar(30) DEFAULT NULL,
  `valeur_penalite` decimal(14,2) NOT NULL DEFAULT 0.00,
  `delai_grace_jours` int(11) NOT NULL DEFAULT 0,
  `cree_par` varchar(191) DEFAULT NULL,
  `modifie_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `frais_scolaires`
--

INSERT INTO `frais_scolaires` (`id`, `ecole_id`, `code`, `libelle`, `famille`, `nature`, `categorie`, `periodicite`, `description`, `obligatoire`, `actif`, `penalite_active`, `type_penalite`, `valeur_penalite`, `delai_grace_jours`, `cree_par`, `modifie_par`, `created_at`, `updated_at`) VALUES
(1, 1, 'FRAIS_DINSCRIPTION', 'Frais d’inscription', 'ACADEMIQUES', 'INSCRIPTION', 'INSCRIPTION', 'UNIQUE', 'Frais d’inscription pour l’année scolaire 2026-2027', 1, 1, 0, NULL, 0.00, 0, 'Administrateur Principal', NULL, '2026-08-01 23:15:48', '2026-08-01 23:15:48');

-- --------------------------------------------------------

--
-- Structure de la table `historiques_eleves`
--

CREATE TABLE `historiques_eleves` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `details` text NOT NULL,
  `auteur` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `historiques_eleves`
--

INSERT INTO `historiques_eleves` (`id`, `eleve_id`, `type`, `details`, `auteur`, `created_at`) VALUES
(1, 1, 'modification', 'Mise à jour des informations personnelles et médicales.', 'Administrateur Principal', '2026-07-30 02:43:29.844'),
(2, 2, 'creation', 'Création du dossier et inscription en classe ID 1.', 'Administrateur Principal', '2026-08-01 18:46:34.604'),
(3, 2, 'statut', 'Statut modifié vers « archive ».', 'Administrateur Principal', '2026-08-01 18:46:47.882'),
(4, 2, 'statut', 'Statut modifié vers « actif ».', 'Administrateur Principal', '2026-08-01 18:46:54.511'),
(5, 2, 'PAIEMENT_SCOLAIRE', '{\"paiementId\":1,\"numeroPaiement\":\"PAY-20260802-002104-B8E4D2\",\"numeroRecu\":\"REC-20260802-002104-3E07B0\",\"montant\":200000,\"devise\":\"CDF\",\"classe\":\"1ere A\",\"anneeScolaire\":\"2026-2027\"}', 'Administrateur Principal', '2026-08-01 21:21:04.759'),
(6, 2, 'DOCUMENT_ACADEMIQUE_DELIVRE', '{\"documentId\":1,\"numero\":\"CER-CS-KIS-2026-2-29307027\",\"type\":\"CERTIFICAT_REUSSITE\",\"anneeScolaire\":\"2026-2027\",\"classe\":\"1ere A\"}', 'admin@dsschool.cd', '2026-08-02 00:08:27.511');

-- --------------------------------------------------------

--
-- Structure de la table `historiques_enseignants`
--

CREATE TABLE `historiques_enseignants` (
  `id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `details` text NOT NULL,
  `auteur` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `historiques_enseignants`
--

INSERT INTO `historiques_enseignants` (`id`, `enseignant_id`, `type`, `details`, `auteur`, `created_at`) VALUES
(1, 1, 'creation', 'Création du dossier enseignant.', 'Administrateur Principal', '2026-08-01 23:17:39.856');

-- --------------------------------------------------------

--
-- Structure de la table `historique_documents_academiques`
--

CREATE TABLE `historique_documents_academiques` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `document_id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(60) NOT NULL,
  `details` text DEFAULT NULL,
  `utilisateur_nom` varchar(190) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inscriptions`
--

CREATE TABLE `inscriptions` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `date_inscription` date NOT NULL,
  `type_admission` varchar(191) NOT NULL DEFAULT 'nouveau',
  `ancienne_ecole` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'inscrit',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `inscriptions`
--

INSERT INTO `inscriptions` (`id`, `eleve_id`, `classe_id`, `annee_scolaire_id`, `date_inscription`, `type_admission`, `ancienne_ecole`, `statut`, `created_at`) VALUES
(1, 1, 1, 1, '2026-07-29', 'nouveau', 'cs le SALEH', 'inscrit', '2026-07-30 01:16:07.320'),
(2, 2, 1, 1, '2026-07-31', 'nouveau', 'cs le SALEH', 'inscrit', '2026-08-01 18:46:34.604');

-- --------------------------------------------------------

--
-- Structure de la table `journal_audit_securite`
--

CREATE TABLE `journal_audit_securite` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `utilisateur_nom` varchar(191) DEFAULT NULL,
  `action` varchar(120) NOT NULL,
  `module` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `niveau` varchar(30) NOT NULL DEFAULT 'INFO',
  `adresse_ip` varchar(100) DEFAULT NULL,
  `appareil` text DEFAULT NULL,
  `donnees_avant` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`donnees_avant`)),
  `donnees_apres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`donnees_apres`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `journal_audit_securite`
--

INSERT INTO `journal_audit_securite` (`id`, `ecole_id`, `utilisateur_id`, `utilisateur_nom`, `action`, `module`, `description`, `niveau`, `adresse_ip`, `appareil`, `donnees_avant`, `donnees_apres`, `created_at`) VALUES
(1, 1, NULL, 'Administrateur Principal', 'CREATION_UTILISATEUR', 'SECURITE', 'Utilisateur nmjpro88@gmail.com créé', 'IMPORTANT', NULL, NULL, NULL, NULL, '2026-07-31 20:08:29'),
(2, 1, NULL, 'Administrateur Principal', 'CREATION_UTILISATEUR', 'SECURITE', 'Utilisateur nmjpro89@gmail.com créé', 'IMPORTANT', NULL, NULL, NULL, NULL, '2026-07-31 20:09:02'),
(3, 1, NULL, 'Administrateur Principal', 'CREATION_UTILISATEUR', 'SECURITE', 'Utilisateur jeanlombo310@gmail.com créé', 'IMPORTANT', NULL, NULL, NULL, NULL, '2026-07-31 20:09:36'),
(4, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 4 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 20:12:57'),
(5, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 4 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 20:13:11'),
(6, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 4 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 20:13:54'),
(7, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 4 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 20:14:22'),
(8, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 5 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 20:34:03'),
(9, 1, NULL, 'MULUBA', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 5 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 21:00:41'),
(12, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 2 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 22:09:06'),
(13, 1, NULL, 'Administrateur Principal', 'SYNCHRONISATION_GLOBALE', 'SECURITE', '4 compte(s) synchronisé(s)', 'IMPORTANT', NULL, NULL, NULL, NULL, '2026-07-31 22:25:54'),
(14, 1, NULL, 'Administrateur Principal', 'MODIFICATION_UTILISATEUR', 'SECURITE', 'Utilisateur admin@dsschool.cd modifié et synchronisé', 'IMPORTANT', NULL, NULL, NULL, NULL, '2026-07-31 22:26:37'),
(15, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 1 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 22:28:20'),
(16, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 4 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 22:29:47'),
(17, 1, NULL, 'Administrateur Principal', 'MODIFICATION_UTILISATEUR', 'SECURITE', 'Utilisateur nmjpro88@gmail.com modifié et synchronisé', 'IMPORTANT', NULL, NULL, NULL, NULL, '2026-07-31 22:30:18'),
(18, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 1 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-07-31 22:32:31'),
(19, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 2 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 11:56:09'),
(20, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 1 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 11:59:32'),
(21, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 2 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 12:01:46'),
(22, 1, NULL, 'LOMBO LOFUMA Jean', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 2 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 12:02:41'),
(25, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', 'Permissions du rôle 5 mises à jour', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 12:07:12'),
(26, 1, NULL, 'Administrateur Principal', 'CREATION_ROLE', 'SECURITE', 'Rôle Directeur des Etudes créé avec le code DIRECTEUR', 'IMPORTANT', NULL, NULL, NULL, NULL, '2026-08-01 13:37:59'),
(27, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', '31 permission(s) attribuée(s) au rôle Directeur des Etudes', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 13:40:45'),
(28, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', '30 permission(s) attribuée(s) au rôle Direction', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 14:41:33'),
(31, 1, NULL, 'Administrateur Principal', 'MISE_A_JOUR_PERMISSIONS', 'SECURITE', '36 permission(s) attribuée(s) au rôle Directeur des Etudes', 'CRITIQUE', NULL, NULL, NULL, NULL, '2026-08-01 14:47:11');

-- --------------------------------------------------------

--
-- Structure de la table `journal_impressions_recus`
--

CREATE TABLE `journal_impressions_recus` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `recu_id` bigint(20) NOT NULL,
  `format_impression` enum('A4','A5','POS58','POS80') NOT NULL DEFAULT 'A4',
  `duplicata` tinyint(1) NOT NULL DEFAULT 1,
  `imprime_par` varchar(190) NOT NULL,
  `adresse_ip` varchar(100) DEFAULT NULL,
  `appareil` text DEFAULT NULL,
  `date_impression` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `journal_impressions_recus`
--

INSERT INTO `journal_impressions_recus` (`id`, `ecole_id`, `recu_id`, `format_impression`, `duplicata`, `imprime_par`, `adresse_ip`, `appareil`, `date_impression`) VALUES
(1, 1, 1, 'A4', 1, 'Administrateur Principal', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '2026-08-02 00:56:59'),
(2, 1, 1, 'A5', 1, 'Administrateur Principal', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '2026-08-02 00:57:14'),
(3, 1, 1, 'POS58', 1, 'Administrateur Principal', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '2026-08-02 00:57:25'),
(4, 1, 1, 'POS80', 1, 'Administrateur Principal', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '2026-08-02 00:57:37');

-- --------------------------------------------------------

--
-- Structure de la table `journal_parents`
--

CREATE TABLE `journal_parents` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `utilisateur_nom` varchar(191) DEFAULT NULL,
  `niveau` varchar(30) NOT NULL DEFAULT 'INFO',
  `adresse_ip` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `jours_ouvrables`
--

CREATE TABLE `jours_ouvrables` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `jour` varchar(191) NOT NULL,
  `ordre` int(11) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `lecteurs_rfid`
--

CREATE TABLE `lecteurs_rfid` (
  `id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `type` enum('USB_HID','NFC','RESEAU','ZKTECO','HID','ACS','AUTRE') NOT NULL DEFAULT 'USB_HID',
  `emplacement` varchar(191) NOT NULL,
  `adresse_ip` varchar(100) DEFAULT NULL,
  `port` int(11) DEFAULT NULL,
  `cle_api` varchar(191) DEFAULT NULL,
  `direction_defaut` enum('ENTREE','SORTIE') DEFAULT NULL,
  `statut` enum('ACTIF','INACTIF','MAINTENANCE') NOT NULL DEFAULT 'ACTIF',
  `derniere_activite` datetime(3) DEFAULT NULL,
  `cree_le` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modifie_le` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

CREATE TABLE `matieres` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `nom` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `departement` varchar(100) DEFAULT NULL,
  `coefficient` decimal(6,2) NOT NULL DEFAULT 1.00,
  `volume_horaire_hebdomadaire` int(11) NOT NULL DEFAULT 1,
  `couleur` varchar(20) NOT NULL DEFAULT '#2563EB',
  `statut` enum('ACTIF','INACTIF') NOT NULL DEFAULT 'ACTIF',
  `cree_le` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modifie_le` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `matieres`
--

INSERT INTO `matieres` (`id`, `code`, `nom`, `description`, `departement`, `coefficient`, `volume_horaire_hebdomadaire`, `couleur`, `statut`, `cree_le`, `modifie_le`) VALUES
(1, 'MAT001', 'MATHEMATIQUE', 'Rien a signaler', 'Sciences', 1.00, 1, '#2563eb', 'ACTIF', '2026-07-30 12:30:07.897', '2026-07-30 12:30:07.897');

-- --------------------------------------------------------

--
-- Structure de la table `modeles_bulletins`
--

CREATE TABLE `modeles_bulletins` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `nom` varchar(160) NOT NULL,
  `code` varchar(50) NOT NULL,
  `niveau` varchar(100) DEFAULT NULL,
  `orientation` varchar(20) NOT NULL DEFAULT 'PORTRAIT',
  `format_papier` varchar(20) NOT NULL DEFAULT 'A4',
  `couleur_principale` varchar(20) NOT NULL DEFAULT '#1761A8',
  `couleur_secondaire` varchar(20) NOT NULL DEFAULT '#F4B400',
  `titre_document` varchar(191) NOT NULL DEFAULT 'BULLETIN SCOLAIRE',
  `afficher_logo` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_photo` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_classement` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_absences` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_qr_code` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_cachet` tinyint(1) NOT NULL DEFAULT 1,
  `signature1` varchar(100) DEFAULT NULL,
  `signature2` varchar(100) DEFAULT NULL,
  `signature3` varchar(100) DEFAULT NULL,
  `texte_pied_page` text DEFAULT NULL,
  `fond_document` varchar(500) DEFAULT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration`)),
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `par_defaut` tinyint(1) NOT NULL DEFAULT 0,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `modeles_bulletins`
--

INSERT INTO `modeles_bulletins` (`id`, `ecole_id`, `nom`, `code`, `niveau`, `orientation`, `format_papier`, `couleur_principale`, `couleur_secondaire`, `titre_document`, `afficher_logo`, `afficher_photo`, `afficher_classement`, `afficher_absences`, `afficher_qr_code`, `afficher_cachet`, `signature1`, `signature2`, `signature3`, `texte_pied_page`, `fond_document`, `configuration`, `actif`, `par_defaut`, `version`, `created_at`, `updated_at`) VALUES
(1, 1, 'Bulletin officiel', 'BULLETIN_OFFICIEL', '1ere Annee', 'PORTRAIT', 'A4', '#1366b4', '#8e6a06', 'BULLETIN SCOLAIRE', 1, 1, 1, 1, 1, 1, 'Titulaire', 'Directeur / Préfet', 'Parent / Tuteur', 'Document généré par DS School Enterprise.', NULL, '{\"colonnes\":[\"matiere\",\"note\",\"coefficient\",\"moyenne\",\"appreciation\"]}', 1, 0, 1, '2026-08-02 00:04:45.090', '2026-08-02 00:04:45.090');

-- --------------------------------------------------------

--
-- Structure de la table `modes_paiements_scolaires`
--

CREATE TABLE `modes_paiements_scolaires` (
  `id` int(11) NOT NULL,
  `paiement_id` int(11) NOT NULL,
  `mode_paiement` varchar(50) NOT NULL,
  `montant` decimal(14,2) NOT NULL DEFAULT 0.00,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `reference_transaction` varchar(191) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `banque` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `modes_paiements_scolaires`
--

INSERT INTO `modes_paiements_scolaires` (`id`, `paiement_id`, `mode_paiement`, `montant`, `devise`, `reference_transaction`, `telephone`, `banque`, `created_at`) VALUES
(1, 1, 'ESPECES', 200000.00, 'CDF', 'BV00023', '+243820646942', 'RAWBANK', '2026-08-01 23:21:04');

-- --------------------------------------------------------

--
-- Structure de la table `mouvements_caisse_scolaire`
--

CREATE TABLE `mouvements_caisse_scolaire` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `session_caisse_id` int(11) NOT NULL,
  `paiement_id` int(11) DEFAULT NULL,
  `type_mouvement` varchar(20) NOT NULL,
  `libelle` varchar(191) NOT NULL,
  `montant` decimal(14,2) NOT NULL DEFAULT 0.00,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `reference_mouvement` varchar(100) DEFAULT NULL,
  `observation` text DEFAULT NULL,
  `cree_par` varchar(191) DEFAULT NULL,
  `date_mouvement` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `mouvements_caisse_scolaire`
--

INSERT INTO `mouvements_caisse_scolaire` (`id`, `ecole_id`, `session_caisse_id`, `paiement_id`, `type_mouvement`, `libelle`, `montant`, `devise`, `reference_mouvement`, `observation`, `cree_par`, `date_mouvement`, `created_at`) VALUES
(1, 1, 4, 1, 'ENTREE', 'Paiement scolaire - CS-KIS-2026-00002', 200000.00, 'CDF', 'PAY-20260802-002104-B8E4D2', 'TEST', 'Administrateur Principal', '2026-08-01 23:21:04', '2026-08-01 23:21:04');

-- --------------------------------------------------------

--
-- Structure de la table `notes_evaluations`
--

CREATE TABLE `notes_evaluations` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `valeur` decimal(8,2) DEFAULT NULL,
  `absent` tinyint(1) NOT NULL DEFAULT 0,
  `appreciation` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notes_evaluations`
--

INSERT INTO `notes_evaluations` (`id`, `evaluation_id`, `eleve_id`, `valeur`, `absent`, `appreciation`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 18.00, 0, 'bien', '2026-08-01 23:23:49.312', '2026-08-01 23:23:49.312'),
(2, 1, 1, 19.00, 0, 'tres bien', '2026-08-01 23:23:49.312', '2026-08-01 23:23:49.312');

-- --------------------------------------------------------

--
-- Structure de la table `numerotation_documents_academiques`
--

CREATE TABLE `numerotation_documents_academiques` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `type_document` varchar(60) NOT NULL,
  `annee` int(11) NOT NULL,
  `prochaine_sequence` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `observations_eleves`
--

CREATE TABLE `observations_eleves` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `contenu` text NOT NULL,
  `auteur` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiements_scolaires`
--

CREATE TABLE `paiements_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `inscription_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `session_caisse_id` int(11) DEFAULT NULL,
  `numero_paiement` varchar(100) NOT NULL,
  `date_paiement` datetime NOT NULL DEFAULT current_timestamp(),
  `montant_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `mode_paiement` varchar(50) NOT NULL DEFAULT 'ESPECES',
  `reference_transaction` varchar(191) DEFAULT NULL,
  `observation` text DEFAULT NULL,
  `motif_annulation` text DEFAULT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'VALIDE',
  `cree_par` varchar(191) DEFAULT NULL,
  `annule_par` varchar(191) DEFAULT NULL,
  `date_annulation` datetime DEFAULT NULL,
  `adresse_ip` varchar(100) DEFAULT NULL,
  `appareil` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `paiements_scolaires`
--

INSERT INTO `paiements_scolaires` (`id`, `ecole_id`, `inscription_id`, `annee_scolaire_id`, `session_caisse_id`, `numero_paiement`, `date_paiement`, `montant_total`, `devise`, `mode_paiement`, `reference_transaction`, `observation`, `motif_annulation`, `statut`, `cree_par`, `annule_par`, `date_annulation`, `adresse_ip`, `appareil`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 1, 4, 'PAY-20260802-002104-B8E4D2', '2026-08-01 23:21:04', 200000.00, 'CDF', 'ESPECES', 'BV00023', 'TEST', NULL, 'VALIDE', 'Administrateur Principal', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '2026-08-01 23:21:04', '2026-08-01 23:21:04');

-- --------------------------------------------------------

--
-- Structure de la table `parametres_documents_academiques`
--

CREATE TABLE `parametres_documents_academiques` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `prefixe` varchar(20) NOT NULL DEFAULT 'DSS',
  `longueur_sequence` int(11) NOT NULL DEFAULT 7,
  `couleur_officielle` varchar(20) NOT NULL DEFAULT '#5B2A86',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parametres_documents_academiques`
--

INSERT INTO `parametres_documents_academiques` (`id`, `ecole_id`, `prefixe`, `longueur_sequence`, `couleur_officielle`, `created_at`, `updated_at`) VALUES
(1, 1, 'DSS', 7, '#5B2A86', '2026-08-02 15:51:14', '2026-08-02 15:51:14');

-- --------------------------------------------------------

--
-- Structure de la table `parametres_impression_recus`
--

CREATE TABLE `parametres_impression_recus` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `format_defaut` enum('A4','A5','POS58','POS80') NOT NULL DEFAULT 'A4',
  `afficher_duplicata` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_caissier` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_reference` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_solde` tinyint(1) NOT NULL DEFAULT 1,
  `afficher_qr_code` tinyint(1) NOT NULL DEFAULT 1,
  `message_remerciement` varchar(255) NOT NULL DEFAULT 'Merci pour votre paiement.',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `parents`
--

CREATE TABLE `parents` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `nom` varchar(120) NOT NULL,
  `postnom` varchar(120) DEFAULT NULL,
  `prenom` varchar(120) NOT NULL,
  `sexe` varchar(10) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `nationalite` varchar(100) DEFAULT 'Congolaise',
  `profession` varchar(191) DEFAULT NULL,
  `employeur` varchar(191) DEFAULT NULL,
  `fonction` varchar(191) DEFAULT NULL,
  `telephone_principal` varchar(50) NOT NULL,
  `telephone_secondaire` varchar(50) DEFAULT NULL,
  `whatsapp` varchar(50) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `province` varchar(120) DEFAULT NULL,
  `ville` varchar(120) DEFAULT NULL,
  `commune` varchar(120) DEFAULT NULL,
  `quartier` varchar(120) DEFAULT NULL,
  `avenue` varchar(191) DEFAULT NULL,
  `numero_adresse` varchar(50) DEFAULT NULL,
  `piece_identite_type` varchar(80) DEFAULT NULL,
  `piece_identite_numero` varchar(120) DEFAULT NULL,
  `photo` varchar(500) DEFAULT NULL,
  `signature` varchar(500) DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `cree_par` varchar(191) DEFAULT NULL,
  `modifie_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parents`
--

INSERT INTO `parents` (`id`, `ecole_id`, `nom`, `postnom`, `prenom`, `sexe`, `date_naissance`, `nationalite`, `profession`, `employeur`, `fonction`, `telephone_principal`, `telephone_secondaire`, `whatsapp`, `email`, `province`, `ville`, `commune`, `quartier`, `avenue`, `numero_adresse`, `piece_identite_type`, `piece_identite_numero`, `photo`, `signature`, `actif`, `cree_par`, `modifie_par`, `created_at`, `updated_at`) VALUES
(1, 1, 'LOMBO LOFUMA Jean', NULL, '', NULL, NULL, 'Congolaise', 'agent de l\'etat', NULL, NULL, '0820646942', NULL, NULL, 'nmjpro88@gmail.com', NULL, 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'MIGRATION_RESPONSABLES', NULL, '2026-07-31 19:34:21', '2026-07-31 19:34:21'),
(2, 1, 'MAKAMBO LIWOZA Florentine', NULL, '', NULL, NULL, 'Congolaise', 'Menagere', NULL, NULL, '0820646942', NULL, NULL, 'nmjpro88@gmail.com', NULL, 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'MIGRATION_RESPONSABLES', NULL, '2026-07-31 19:34:21', '2026-07-31 19:34:21');

-- --------------------------------------------------------

--
-- Structure de la table `parents_eleves`
--

CREATE TABLE `parents_eleves` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `lien_parente` varchar(50) NOT NULL DEFAULT 'AUTRE',
  `principal` tinyint(1) NOT NULL DEFAULT 0,
  `responsable_legal` tinyint(1) NOT NULL DEFAULT 0,
  `autorise_finances` tinyint(1) NOT NULL DEFAULT 1,
  `autorise_academique` tinyint(1) NOT NULL DEFAULT 1,
  `autorise_communication` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parents_eleves`
--

INSERT INTO `parents_eleves` (`id`, `ecole_id`, `parent_id`, `eleve_id`, `lien_parente`, `principal`, `responsable_legal`, `autorise_finances`, `autorise_academique`, `autorise_communication`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'PERE', 1, 1, 1, 1, 1, '2026-07-31 19:34:22', '2026-07-31 19:34:22'),
(2, 1, 2, 1, 'PERE', 1, 1, 1, 1, 1, '2026-07-31 19:34:22', '2026-07-31 19:34:22');

-- --------------------------------------------------------

--
-- Structure de la table `parents_utilisateurs_portail`
--

CREATE TABLE `parents_utilisateurs_portail` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `utilisateur_securite_id` int(11) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `passages_rfid`
--

CREATE TABLE `passages_rfid` (
  `id` int(11) NOT NULL,
  `carte_id` int(11) DEFAULT NULL,
  `lecteur_id` int(11) DEFAULT NULL,
  `uid_lu` varchar(191) NOT NULL,
  `type_proprietaire` enum('ELEVE','ENSEIGNANT','PERSONNEL','VISITEUR') DEFAULT NULL,
  `proprietaire_id` int(11) DEFAULT NULL,
  `nom_proprietaire` varchar(191) DEFAULT NULL,
  `photo_proprietaire` varchar(500) DEFAULT NULL,
  `classe_ou_fonction` varchar(191) DEFAULT NULL,
  `direction` enum('ENTREE','SORTIE') NOT NULL,
  `resultat` enum('AUTORISE','REFUSE','CARTE_INCONNUE','CARTE_INACTIVE') NOT NULL,
  `message` varchar(500) DEFAULT NULL,
  `date_heure` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `adresse_ip_source` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `pauses_academiques`
--

CREATE TABLE `pauses_academiques` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `heure_debut` varchar(5) NOT NULL,
  `heure_fin` varchar(5) NOT NULL,
  `couleur` varchar(191) NOT NULL DEFAULT '#F59E0B',
  `actif` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `periodes_academiques`
--

CREATE TABLE `periodes_academiques` (
  `id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT 1,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `periodes_academiques`
--

INSERT INTO `periodes_academiques` (`id`, `annee_scolaire_id`, `nom`, `type`, `ordre`, `date_debut`, `date_fin`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, '1er Periode', 'TRIMESTRE', 1, '2026-08-01', '2026-08-31', 'ACTIVE', '2026-08-01 23:19:32.397', '2026-08-01 23:19:32.397');

-- --------------------------------------------------------

--
-- Structure de la table `permissions_securite`
--

CREATE TABLE `permissions_securite` (
  `id` int(11) NOT NULL,
  `module` varchar(100) NOT NULL,
  `code` varchar(150) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `action` varchar(80) NOT NULL,
  `description` text DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `permissions_securite`
--

INSERT INTO `permissions_securite` (`id`, `module`, `code`, `nom`, `action`, `description`, `actif`) VALUES
(1, 'ELEVES', 'ELEVES_VOIR', 'Voir les élèves', 'VOIR', NULL, 1),
(2, 'ELEVES', 'ELEVES_AJOUTER', 'Ajouter un élève', 'AJOUTER', NULL, 1),
(3, 'ELEVES', 'ELEVES_MODIFIER', 'Modifier un élève', 'MODIFIER', NULL, 1),
(4, 'ELEVES', 'ELEVES_SUPPRIMER', 'Supprimer un élève', 'SUPPRIMER', NULL, 1),
(5, 'ELEVES', 'ELEVES_EXPORTER', 'Exporter les élèves', 'EXPORTER', NULL, 1),
(6, 'FINANCES', 'FINANCES_VOIR', 'Voir les finances', 'VOIR', NULL, 1),
(7, 'FINANCES', 'FINANCES_ENCAISSER', 'Encaisser un paiement', 'ENCAISSER', NULL, 1),
(8, 'FINANCES', 'FINANCES_ANNULER', 'Annuler un paiement', 'ANNULER', NULL, 1),
(9, 'FINANCES', 'FINANCES_OUVRIR_CAISSE', 'Ouvrir une caisse', 'OUVRIR_CAISSE', NULL, 1),
(10, 'FINANCES', 'FINANCES_FERMER_CAISSE', 'Fermer une caisse', 'FERMER_CAISSE', NULL, 1),
(11, 'FINANCES', 'FINANCES_RAPPORTS', 'Voir les rapports financiers', 'VOIR_RAPPORTS', NULL, 1),
(12, 'ACADEMIQUE', 'ACADEMIQUE_VOIR', 'Voir le centre académique', 'VOIR', NULL, 1),
(13, 'ACADEMIQUE', 'ACADEMIQUE_NOTES', 'Saisir les notes', 'SAISIR_NOTES', NULL, 1),
(14, 'ACADEMIQUE', 'ACADEMIQUE_BULLETINS', 'Générer les bulletins', 'GENERER_BULLETINS', NULL, 1),
(15, 'ACADEMIQUE', 'ACADEMIQUE_DELIBERER', 'Effectuer les délibérations', 'DELIBERER', NULL, 1),
(16, 'PARENTS', 'PARENTS_VOIR', 'Voir les parents', 'VOIR', NULL, 1),
(17, 'PARENTS', 'PARENTS_AJOUTER', 'Ajouter un parent', 'AJOUTER', NULL, 1),
(18, 'PARENTS', 'PARENTS_MODIFIER', 'Modifier un parent', 'MODIFIER', NULL, 1),
(19, 'SECURITE', 'SECURITE_UTILISATEURS', 'Gérer les utilisateurs', 'GERER_UTILISATEURS', NULL, 1),
(20, 'SECURITE', 'SECURITE_ROLES', 'Gérer les rôles', 'GERER_ROLES', NULL, 1),
(21, 'SECURITE', 'SECURITE_PERMISSIONS', 'Gérer les permissions', 'GERER_PERMISSIONS', NULL, 1),
(22, 'SECURITE', 'SECURITE_AUDIT', 'Voir le journal d’audit', 'VOIR_AUDIT', NULL, 1),
(23, 'SECURITE', 'SECURITE_SESSIONS', 'Fermer les sessions', 'GERER_SESSIONS', NULL, 1),
(24, 'ENSEIGNANTS', 'ENSEIGNANTS_VOIR', 'Voir les enseignants', 'VOIR', NULL, 1),
(25, 'MATIERES', 'MATIERES_VOIR', 'Voir les matières', 'VOIR', NULL, 1),
(26, 'EMPLOI_DU_TEMPS', 'EMPLOI_DU_TEMPS_VOIR', 'Voir l’emploi du temps', 'VOIR', NULL, 1),
(27, 'CRM', 'CRM_VOIR', 'Voir le CRM', 'VOIR', NULL, 1),
(28, 'SAFE_CAMPUS', 'SAFE_CAMPUS_VOIR', 'Voir Safe Campus', 'VOIR', NULL, 1),
(29, 'CLASSES', 'CLASSE_ELEVES_VOIR', 'Voir les élèves de la classe', 'VOIR_ELEVES', NULL, 1),
(30, 'CLASSES', 'CLASSE_PARENTS_VOIR', 'Voir les parents de la classe', 'VOIR_PARENTS', NULL, 1),
(31, 'CLASSES', 'CLASSE_PRESENCES_VOIR', 'Voir les présences', 'VOIR_PRESENCES', NULL, 1),
(32, 'CLASSES', 'CLASSE_PRESENCES_SAISIR', 'Saisir les absences et retards', 'SAISIR_PRESENCES', NULL, 1),
(33, 'CLASSES', 'CLASSE_DISCIPLINE_GERER', 'Gérer la discipline', 'GERER_DISCIPLINE', NULL, 1),
(34, 'CLASSES', 'CLASSE_COMMUNICATION_ENVOYER', 'Communiquer avec les parents', 'ENVOYER_COMMUNICATION', NULL, 1),
(35, 'NOTES', 'NOTES_VOIR', 'Voir les notes', 'VOIR', NULL, 1),
(36, 'NOTES', 'NOTES_SAISIR', 'Saisir les notes', 'SAISIR', NULL, 1),
(37, 'NOTES', 'NOTES_MODIFIER_PROPRES', 'Modifier ses propres notes', 'MODIFIER_PROPRES', NULL, 1),
(38, 'NOTES', 'NOTES_MODIFIER_AUTRES', 'Modifier les notes d’un autre enseignant', 'MODIFIER_AUTRES', NULL, 1),
(39, 'NOTES', 'NOTES_CLOTURER', 'Clôturer les notes', 'CLOTURER', NULL, 1),
(40, 'NOTES', 'NOTES_DEVERROUILLER', 'Déverrouiller les notes', 'DEVERROUILLER', NULL, 1),
(41, 'BULLETINS', 'BULLETINS_VOIR', 'Voir les bulletins', 'VOIR', NULL, 1),
(42, 'BULLETINS', 'BULLETINS_PREPARER', 'Préparer les bulletins', 'PREPARER', NULL, 1),
(43, 'BULLETINS', 'BULLETINS_IMPRIMER', 'Imprimer les bulletins', 'IMPRIMER', NULL, 1),
(44, 'BULLETINS', 'BULLETINS_PUBLIER', 'Publier les bulletins', 'PUBLIER', NULL, 1),
(45, 'BULLETINS', 'BULLETINS_ANNULER', 'Annuler un bulletin', 'ANNULER', NULL, 1),
(46, 'FINANCES', 'FINANCES_STATUT_PAIEMENT_VOIR', 'Voir payé ou non payé', 'VOIR_STATUT', NULL, 1),
(47, 'FINANCES', 'FINANCES_MONTANTS_VOIR', 'Voir les montants détaillés', 'VOIR_MONTANTS', NULL, 1),
(72, 'ADMINISTRATION', 'ANNEES_SCOLAIRES_VOIR', 'Voir les années scolaires', 'VOIR', 'Affiche ce menu.', 1),
(73, 'ADMINISTRATION', 'SECTIONS_VOIR', 'Voir les sections', 'VOIR', 'Affiche ce menu.', 1),
(74, 'ADMINISTRATION', 'CLASSES_VOIR', 'Voir les classes', 'VOIR', 'Affiche ce menu.', 1),
(75, 'ADMINISTRATION', 'PARAMETRES_ACADEMIQUES_VOIR', 'Voir les paramètres académiques', 'VOIR', 'Affiche ce menu.', 1),
(76, 'FINANCES', 'FINANCES_FRAIS_VOIR', 'Voir les frais scolaires', 'VOIR', 'Affiche ce menu.', 1),
(77, 'FINANCES', 'FINANCES_PAIEMENTS_VOIR', 'Voir les paiements scolaires', 'VOIR', 'Affiche ce menu.', 1),
(78, 'FINANCES', 'FINANCES_RECUS_VOIR', 'Voir les reçus', 'VOIR', 'Affiche ce menu.', 1),
(79, 'FINANCES', 'FINANCES_CAISSE_VOIR', 'Voir la caisse scolaire', 'VOIR', 'Affiche ce menu.', 1),
(80, 'FINANCES', 'FINANCES_RAPPORTS_VOIR', 'Voir les rapports financiers', 'VOIR', 'Affiche ce menu.', 1),
(81, 'SECURITE', 'SECURITE_VOIR', 'Voir le Centre de Sécurité', 'VOIR', 'Affiche ce menu.', 1),
(82, 'PARAMETRES', 'PARAMETRES_VOIR', 'Voir les paramètres généraux', 'VOIR', 'Affiche ce menu.', 1),
(129, 'TABLEAU_DE_BORD', 'DASHBOARD_VOIR', 'Voir le tableau de bord', 'VOIR', 'Autorise l’accès au tableau de bord.', 1),
(130, 'TABLEAU_DE_BORD', 'DASHBOARD_WIDGET_ANNEE_ACTIVE', 'Voir l’année scolaire active', 'VOIR_WIDGET', 'Affiche le bandeau de l’année scolaire active.', 1),
(131, 'TABLEAU_DE_BORD', 'DASHBOARD_WIDGET_ANNEES', 'Voir le nombre d’années scolaires', 'VOIR_WIDGET', 'Affiche le compteur des années scolaires.', 1),
(132, 'TABLEAU_DE_BORD', 'DASHBOARD_WIDGET_SECTIONS', 'Voir le nombre de sections', 'VOIR_WIDGET', 'Affiche le compteur des sections actives.', 1),
(133, 'TABLEAU_DE_BORD', 'DASHBOARD_WIDGET_CLASSES', 'Voir le nombre de classes', 'VOIR_WIDGET', 'Affiche le compteur des classes actives.', 1),
(134, 'TABLEAU_DE_BORD', 'DASHBOARD_WIDGET_ELEVES', 'Voir le nombre d’élèves', 'VOIR_WIDGET', 'Affiche le compteur des élèves inscrits.', 1),
(135, 'TABLEAU_DE_BORD', 'DASHBOARD_CONFIGURATION_RAPIDE', 'Voir la configuration rapide', 'VOIR_WIDGET', 'Affiche les raccourcis de configuration autorisés.', 1),
(136, 'ELEVES', 'ELEVES_CHANGER_STATUT', 'Archiver ou réactiver un élève', 'CHANGER_STATUT', 'Modifier le statut actif ou archivé.', 1),
(137, 'ELEVES', 'ELEVES_CARTE_VOIR', 'Voir la carte scolaire', 'VOIR_CARTE', 'Consulter ou imprimer la carte scolaire.', 1),
(138, 'ELEVES', 'ELEVES_OBSERVATIONS_AJOUTER', 'Ajouter une observation', 'AJOUTER_OBSERVATION', 'Ajouter une observation dans le dossier d’un élève.', 1),
(181, 'ACADEMIQUE', 'ACADEMIQUE_AJOUTER', 'Academique Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(182, 'ACADEMIQUE', 'ACADEMIQUE_ANNULER', 'Academique Annuler', 'ANNULER', 'Permission générée par RBAC Global V3.', 1),
(183, 'ACADEMIQUE', 'ACADEMIQUE_CHANGER_STATUT', 'Academique Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(184, 'ACADEMIQUE', 'ACADEMIQUE_MODIFIER', 'Academique Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(185, 'ACADEMIQUE', 'ACADEMIQUE_SUPPRIMER', 'Academique Supprimer', 'SUPPRIMER', 'Permission générée par RBAC Global V3.', 1),
(186, 'ACADEMIQUE', 'ACADEMIQUE_VALIDER', 'Academique Valider', 'VALIDER', 'Permission générée par RBAC Global V3.', 1),
(187, 'ANNEES', 'ANNEES_SCOLAIRES_AJOUTER', 'Annees Scolaires Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(188, 'ANNEES', 'ANNEES_SCOLAIRES_CHANGER_STATUT', 'Annees Scolaires Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(189, 'CLASSES', 'CLASSES_AJOUTER', 'Classes Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(190, 'CLASSES', 'CLASSES_CHANGER_STATUT', 'Classes Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(191, 'CRM', 'CRM_AJOUTER', 'Crm Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(192, 'CRM', 'CRM_CHANGER_STATUT', 'Crm Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(193, 'CRM', 'CRM_MODIFIER', 'Crm Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(194, 'EMPLOI', 'EMPLOI_DU_TEMPS_AJOUTER', 'Emploi Du Temps Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(195, 'EMPLOI', 'EMPLOI_DU_TEMPS_SUPPRIMER', 'Emploi Du Temps Supprimer', 'SUPPRIMER', 'Permission générée par RBAC Global V3.', 1),
(196, 'ENSEIGNANTS', 'ENSEIGNANTS_AJOUTER', 'Enseignants Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(197, 'ENSEIGNANTS', 'ENSEIGNANTS_CHANGER_STATUT', 'Enseignants Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(198, 'ENSEIGNANTS', 'ENSEIGNANTS_MODIFIER', 'Enseignants Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(199, 'FINANCES', 'FINANCES_CAISSE_CHANGER_STATUT', 'Finances Caisse Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(200, 'FINANCES', 'FINANCES_FRAIS_AJOUTER', 'Finances Frais Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(201, 'FINANCES', 'FINANCES_FRAIS_CHANGER_STATUT', 'Finances Frais Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(202, 'FINANCES', 'FINANCES_FRAIS_MODIFIER', 'Finances Frais Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(203, 'FINANCES', 'FINANCES_FRAIS_SUPPRIMER', 'Finances Frais Supprimer', 'SUPPRIMER', 'Permission générée par RBAC Global V3.', 1),
(204, 'FINANCES', 'FINANCES_PAIEMENTS_AJOUTER', 'Finances Paiements Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(205, 'FINANCES', 'FINANCES_PAIEMENTS_ANNULER', 'Finances Paiements Annuler', 'ANNULER', 'Permission générée par RBAC Global V3.', 1),
(206, 'FINANCES', 'FINANCES_PAIEMENTS_MODIFIER', 'Finances Paiements Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(207, 'MATIERES', 'MATIERES_AJOUTER', 'Matieres Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(208, 'MATIERES', 'MATIERES_EXPORTER', 'Matieres Exporter', 'EXPORTER', 'Permission générée par RBAC Global V3.', 1),
(209, 'MATIERES', 'MATIERES_MODIFIER', 'Matieres Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(210, 'MATIERES', 'MATIERES_SUPPRIMER', 'Matieres Supprimer', 'SUPPRIMER', 'Permission générée par RBAC Global V3.', 1),
(211, 'PARAMETRES', 'PARAMETRES_ACADEMIQUES_AJOUTER', 'Parametres Academiques Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(212, 'PARAMETRES', 'PARAMETRES_ACADEMIQUES_MODIFIER', 'Parametres Academiques Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(213, 'PARAMETRES', 'PARAMETRES_ACADEMIQUES_SUPPRIMER', 'Parametres Academiques Supprimer', 'SUPPRIMER', 'Permission générée par RBAC Global V3.', 1),
(214, 'PARAMETRES', 'PARAMETRES_MODIFIER', 'Parametres Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(215, 'PARENTS', 'PARENTS_CHANGER_STATUT', 'Parents Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(216, 'PARENTS', 'PARENTS_SUPPRIMER', 'Parents Supprimer', 'SUPPRIMER', 'Permission générée par RBAC Global V3.', 1),
(217, 'SAFE', 'SAFE_CAMPUS_AJOUTER', 'Safe Campus Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(218, 'SAFE', 'SAFE_CAMPUS_CHANGER_STATUT', 'Safe Campus Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(219, 'SECTIONS', 'SECTIONS_AJOUTER', 'Sections Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(220, 'SECTIONS', 'SECTIONS_CHANGER_STATUT', 'Sections Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(221, 'SECURITE', 'SECURITE_AJOUTER', 'Securite Ajouter', 'AJOUTER', 'Permission générée par RBAC Global V3.', 1),
(222, 'SECURITE', 'SECURITE_CHANGER_STATUT', 'Securite Changer Statut', 'STATUT', 'Permission générée par RBAC Global V3.', 1),
(223, 'SECURITE', 'SECURITE_MODIFIER', 'Securite Modifier', 'MODIFIER', 'Permission générée par RBAC Global V3.', 1),
(224, 'SECURITE', 'SECURITE_SUPPRIMER', 'Securite Supprimer', 'SUPPRIMER', 'Permission générée par RBAC Global V3.', 1),
(301, 'FINANCES', 'FINANCES_CATEGORIES_VOIR', 'Voir les catégories de frais', 'VOIR', 'Consultation des catégories.', 1),
(302, 'FINANCES', 'FINANCES_CATEGORIES_AJOUTER', 'Ajouter une catégorie de frais', 'AJOUTER', 'Création de catégorie.', 1),
(303, 'FINANCES', 'FINANCES_CATEGORIES_MODIFIER', 'Modifier une catégorie de frais', 'MODIFIER', 'Modification et activation.', 1),
(304, 'FINANCES', 'FINANCES_TARIFS_GERER', 'Gérer les tarifs scolaires', 'GERER', 'Ajout et modification de tarifs.', 1),
(305, 'FINANCES', 'FINANCES_TARIFS_SUPPRIMER', 'Supprimer un tarif scolaire', 'SUPPRIMER', 'Suppression de tarif.', 1),
(306, 'FINANCES', 'FINANCES_CAISSE_OUVRIR', 'Ouvrir une caisse', 'OUVRIR', 'Ouverture de session de caisse.', 1),
(307, 'FINANCES', 'FINANCES_CAISSE_FERMER', 'Clôturer une caisse', 'FERMER', 'Clôture de session de caisse.', 1),
(308, 'FINANCES', 'FINANCES_ECHEANCIERS_VOIR', 'Voir les échéanciers', 'VOIR', 'Consultation des échéanciers.', 1),
(309, 'FINANCES', 'FINANCES_ECHEANCIERS_AJOUTER', 'Créer un échéancier', 'AJOUTER', 'Création d’un plan de paiement.', 1),
(310, 'FINANCES', 'FINANCES_BOURSES_REMISES_VOIR', 'Voir les bourses et remises', 'VOIR', 'Consultation des avantages.', 1),
(311, 'FINANCES', 'FINANCES_BOURSES_REMISES_AJOUTER', 'Attribuer une bourse ou remise', 'AJOUTER', 'Création d’un avantage financier.', 1),
(349, 'FINANCES', 'FINANCES_RECUS_REIMPRIMER', 'Réimprimer les reçus', 'REIMPRIMER', 'Autorise la réimpression A4, A5 et POS.', 1),
(350, 'FINANCES', 'FINANCES_RECUS_IMPRIMER_A4', 'Imprimer les reçus A4', 'IMPRIMER_A4', 'Autorise l’impression A4 ou PDF.', 1),
(351, 'FINANCES', 'FINANCES_RECUS_IMPRIMER_POS', 'Imprimer les reçus POS', 'IMPRIMER_POS', 'Autorise l’impression thermique 58 mm ou 80 mm.', 1),
(352, 'FINANCES', 'FINANCES_RECUS_HISTORIQUE_IMPRESSIONS', 'Voir l’historique des impressions', 'VOIR', 'Autorise la consultation des réimpressions.', 1),
(353, 'NOTES', 'NOTES_PUBLIER', 'Publier les notes', 'PUBLIER', 'Publication des résultats.', 1),
(354, 'NOTES', 'NOTES_EXPORTER', 'Exporter les notes', 'EXPORTER', 'Export des carnets et résultats.', 1),
(355, 'EVALUATIONS', 'EVALUATIONS_VOIR', 'Voir les évaluations', 'VOIR', 'Consultation des évaluations.', 1),
(356, 'EVALUATIONS', 'EVALUATIONS_AJOUTER', 'Créer une évaluation', 'AJOUTER', 'Création d’une interrogation, d’un devoir ou d’un examen.', 1),
(357, 'EVALUATIONS', 'EVALUATIONS_MODIFIER', 'Modifier une évaluation', 'MODIFIER', 'Modification d’une évaluation.', 1),
(358, 'EVALUATIONS', 'EVALUATIONS_CLOTURER', 'Clôturer une évaluation', 'CLOTURER', 'Clôture de la saisie des notes.', 1),
(359, 'RESULTATS', 'RESULTATS_VOIR', 'Voir les résultats', 'VOIR', 'Consultation des moyennes et résultats.', 1),
(360, 'RESULTATS', 'RESULTATS_CALCULER', 'Calculer les résultats', 'CALCULER', 'Calcul automatique des moyennes.', 1),
(361, 'RESULTATS', 'CLASSEMENTS_VOIR', 'Voir les classements', 'VOIR', 'Consultation des classements.', 1),
(362, 'RESULTATS', 'DELIBERATIONS_VOIR', 'Voir les délibérations', 'VOIR', 'Consultation des propositions de délibération.', 1),
(363, 'RESULTATS', 'DELIBERATIONS_VALIDER', 'Valider une délibération', 'VALIDER', 'Validation des décisions académiques.', 1),
(364, 'BULLETINS', 'BULLETINS_GENERER', 'Générer les bulletins', 'GENERER', 'Génération des bulletins.', 1),
(365, 'BULLETINS', 'BULLETINS_MODELES_VOIR', 'Voir les modèles de bulletins', 'VOIR', 'Consultation des modèles.', 1),
(366, 'BULLETINS', 'BULLETINS_MODELES_GERER', 'Gérer les modèles de bulletins', 'GERER', 'Création et modification des modèles.', 1),
(375, 'TITULAIRES', 'TITULAIRES_GERER', 'Gérer les titulaires', 'GERER', 'Accès à la page d’affectation des titulaires.', 1),
(376, 'TITULAIRES', 'TITULAIRES_AFFECTER', 'Affecter un titulaire', 'AFFECTER', 'Affectation d’un compte et enseignant à une classe.', 1),
(377, 'TITULAIRES', 'TITULAIRE_ESPACE_VOIR', 'Voir l’espace titulaire', 'VOIR', 'Accès au tableau de bord du titulaire.', 1),
(378, 'TITULAIRES', 'TITULAIRE_ELEVES_VOIR', 'Voir les élèves de sa classe', 'VOIR', 'Consultation limitée aux élèves de la classe titulaire.', 1),
(379, 'TITULAIRES', 'TITULAIRE_PRESENCES_VOIR', 'Voir les présences de sa classe', 'VOIR', 'Consultation des présences de la classe.', 1),
(380, 'TITULAIRES', 'TITULAIRE_PRESENCES_SAISIR', 'Saisir les présences', 'SAISIR', 'Saisie quotidienne des présences.', 1),
(381, 'TITULAIRES', 'TITULAIRE_NOTES_VOIR', 'Voir les notes de sa classe', 'VOIR', 'Consultation des évaluations de sa classe.', 1),
(382, 'TITULAIRES', 'TITULAIRE_NOTES_SAISIR', 'Saisir les notes de sa classe', 'SAISIR', 'Saisie des notes avant publication.', 1),
(383, 'TITULAIRES', 'TITULAIRE_OBSERVATIONS_VOIR', 'Voir les observations', 'VOIR', 'Consultation des observations des élèves de sa classe.', 1),
(384, 'TITULAIRES', 'TITULAIRE_OBSERVATIONS_AJOUTER', 'Ajouter des observations', 'AJOUTER', 'Ajout d’observations pour ses élèves.', 1),
(385, 'TITULAIRES', 'TITULAIRE_BULLETINS_VOIR', 'Voir les bulletins de sa classe', 'VOIR', 'Consultation des bulletins de la classe titulaire.', 1),
(386, 'PARENTS', 'PARENTS_COMPTES_PORTAIL_GERER', 'Gérer les comptes portail parents', 'GERER', 'Liaison entre un dossier parent et un compte utilisateur.', 1),
(387, 'PORTAIL_PARENT', 'PARENT_ESPACE_VOIR', 'Voir l’espace parent', 'VOIR', 'Accès au tableau de bord parent.', 1),
(388, 'PORTAIL_PARENT', 'PARENT_ENFANTS_VOIR', 'Voir ses enfants', 'VOIR', 'Consultation limitée aux enfants liés.', 1),
(389, 'PORTAIL_PARENT', 'PARENT_FINANCES_VOIR', 'Voir les finances de ses enfants', 'VOIR', 'Paiements, soldes et reçus autorisés.', 1),
(390, 'PORTAIL_PARENT', 'PARENT_RECUS_VOIR', 'Voir les reçus', 'VOIR', 'Consultation et réimpression des reçus autorisés.', 1),
(391, 'PORTAIL_PARENT', 'PARENT_BULLETINS_VOIR', 'Voir les bulletins', 'VOIR', 'Consultation des bulletins de ses enfants.', 1),
(392, 'PORTAIL_PARENT', 'PARENT_PRESENCES_VOIR', 'Voir les présences', 'VOIR', 'Consultation des présences et retards.', 1),
(393, 'PORTAIL_PARENT', 'PARENT_OBSERVATIONS_VOIR', 'Voir les observations', 'VOIR', 'Consultation des observations communiquées.', 1),
(394, 'DOCUMENTS', 'DOCUMENTS_ACADEMIQUES_VOIR', 'Voir les documents académiques', 'VOIR', 'Accès au registre.', 1),
(395, 'DOCUMENTS', 'DOCUMENTS_ACADEMIQUES_CREER', 'Créer les documents académiques', 'CREER', 'Création et numérotation.', 1),
(396, 'DOCUMENTS', 'DOCUMENTS_ACADEMIQUES_ANNULER', 'Annuler les documents académiques', 'ANNULER', 'Annulation journalisée.', 1),
(397, 'DOCUMENTS', 'DOCUMENTS_ACADEMIQUES_REIMPRIMER', 'Réimprimer les documents', 'REIMPRIMER', 'Réimpression et historique.', 1),
(398, 'DOCUMENTS', 'DOCUMENTS_PARAMETRES_GERER', 'Gérer les paramètres documents', 'GERER', 'Préfixe et numérotation.', 1),
(399, 'EMPLOI_DU_TEMPS', 'EMPLOI_DU_TEMPS_GENERER', 'Générer l’emploi du temps', 'GENERER', 'Génération intelligente des séances sans conflits.', 1),
(400, 'SALLES', 'SALLES_VOIR', 'Voir les salles', 'VOIR', 'Consultation des salles et locaux.', 1),
(401, 'SALLES', 'SALLES_AJOUTER', 'Créer une salle', 'AJOUTER', 'Création des salles et laboratoires.', 1),
(402, 'SALLES', 'SALLES_MODIFIER', 'Modifier une salle', 'MODIFIER', 'Activation et désactivation des salles.', 1),
(403, 'DISPONIBILITES', 'DISPONIBILITES_ENSEIGNANTS_VOIR', 'Voir les disponibilités enseignants', 'VOIR', 'Consultation des jours et créneaux disponibles.', 1),
(404, 'DISPONIBILITES', 'DISPONIBILITES_ENSEIGNANTS_GERER', 'Gérer les disponibilités enseignants', 'GERER', 'Configuration des disponibilités horaires.', 1);

-- --------------------------------------------------------

--
-- Structure de la table `presences_titulaires`
--

CREATE TABLE `presences_titulaires` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `titulaire_affectation_id` bigint(20) UNSIGNED NOT NULL,
  `date_presence` date NOT NULL,
  `statut` enum('PRESENT','ABSENT','RETARD','EXCUSE') NOT NULL DEFAULT 'PRESENT',
  `observation` varchar(500) DEFAULT NULL,
  `saisi_par` varchar(190) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `profils_permissions_securite`
--

CREATE TABLE `profils_permissions_securite` (
  `profil_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `profils_securite`
--

CREATE TABLE `profils_securite` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `nom` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `recus_scolaires`
--

CREATE TABLE `recus_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `paiement_id` int(11) NOT NULL,
  `numero_recu` varchar(100) NOT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'VALIDE',
  `code_verification` varchar(100) DEFAULT NULL,
  `date_emission` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `recus_scolaires`
--

INSERT INTO `recus_scolaires` (`id`, `ecole_id`, `paiement_id`, `numero_recu`, `statut`, `code_verification`, `date_emission`, `created_at`) VALUES
(1, 1, 1, 'REC-20260802-002104-3E07B0', 'VALIDE', '7FC758BF4DD6C3104423721D59184BAC', '2026-08-01 23:21:04', '2026-08-01 23:21:04');

-- --------------------------------------------------------

--
-- Structure de la table `regles_academiques`
--

CREATE TABLE `regles_academiques` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `max_cours_jour` int(11) NOT NULL DEFAULT 8,
  `max_periodes_enseignant` int(11) NOT NULL DEFAULT 8,
  `max_cours_consecutifs` int(11) NOT NULL DEFAULT 3,
  `duree_min_entre_cours` int(11) NOT NULL DEFAULT 0,
  `duree_max_periode` int(11) NOT NULL DEFAULT 120,
  `gestion_conflits` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `regles_evaluations`
--

CREATE TABLE `regles_evaluations` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `seuil_reussite` decimal(5,2) NOT NULL DEFAULT 50.00,
  `mention_excellent` decimal(5,2) NOT NULL DEFAULT 80.00,
  `mention_tres_bien` decimal(5,2) NOT NULL DEFAULT 70.00,
  `mention_bien` decimal(5,2) NOT NULL DEFAULT 60.00,
  `mention_assez_bien` decimal(5,2) NOT NULL DEFAULT 50.00,
  `arrondi_decimales` int(11) NOT NULL DEFAULT 2,
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reimpressions_documents_academiques`
--

CREATE TABLE `reimpressions_documents_academiques` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `document_id` bigint(20) UNSIGNED NOT NULL,
  `format_impression` varchar(30) NOT NULL DEFAULT 'A4',
  `imprime_par` varchar(190) NOT NULL,
  `adresse_ip` varchar(100) DEFAULT NULL,
  `appareil` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `responsables_eleves`
--

CREATE TABLE `responsables_eleves` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `telephone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `profession` varchar(191) DEFAULT NULL,
  `adresse` varchar(191) DEFAULT NULL,
  `principal` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `responsables_eleves`
--

INSERT INTO `responsables_eleves` (`id`, `ecole_id`, `eleve_id`, `type`, `nom`, `telephone`, `email`, `profession`, `adresse`, `principal`, `created_at`) VALUES
(1, 1, 1, 'pere', 'LOMBO LOFUMA Jean', '0820646942', 'nmjpro88@gmail.com', 'agent de l\'etat', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', 1, '2026-07-30 01:16:08.030'),
(2, 1, 1, 'mere', 'MAKAMBO LIWOZA Florentine', '0820646942', 'nmjpro88@gmail.com', 'Menagere', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', 0, '2026-07-30 01:16:08.030'),
(3, 1, 1, 'tuteur', 'LOMBO LOFUMA Jean', '0820646942', 'nmjpro88@gmail.com', 'Agent de l\'etat', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', 0, '2026-07-30 01:16:08.030'),
(4, 1, 2, 'pere', 'MULUBA', '0820646942', 'nmjpro88@gmail.com', 'agent de l\'etat', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', 0, '2026-08-01 18:46:35.429'),
(5, 1, 2, 'mere', 'MAKAMBO LIWOZA Florentine', '0820646942', 'nmjpro88@gmail.com', 'Menagere', 'kinshasa', 0, '2026-08-01 18:46:35.429'),
(6, 1, 2, 'tuteur', 'LOMBO LOFUMA Jean', '0820646942', 'nmjpro88@gmail.com', 'Agent de l\'etat', 'KINSHASA, MONT-NGAFULA, MBUDI, BANYINDO 03', 1, '2026-08-01 18:46:35.429');

-- --------------------------------------------------------

--
-- Structure de la table `roles_permissions_securite`
--

CREATE TABLE `roles_permissions_securite` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles_permissions_securite`
--

INSERT INTO `roles_permissions_securite` (`role_id`, `permission_id`, `created_at`) VALUES
(1, 1, '2026-08-01 11:59:32'),
(1, 2, '2026-08-01 11:59:32'),
(1, 3, '2026-08-01 11:59:32'),
(1, 4, '2026-08-01 11:59:32'),
(1, 5, '2026-08-01 11:59:32'),
(1, 6, '2026-08-01 11:59:32'),
(1, 7, '2026-08-01 11:59:32'),
(1, 8, '2026-08-01 11:59:32'),
(1, 9, '2026-08-01 11:59:32'),
(1, 10, '2026-08-01 11:59:32'),
(1, 11, '2026-08-01 11:59:32'),
(1, 12, '2026-08-01 11:59:32'),
(1, 13, '2026-08-01 11:59:32'),
(1, 14, '2026-08-01 11:59:32'),
(1, 15, '2026-08-01 11:59:32'),
(1, 16, '2026-08-01 11:59:32'),
(1, 17, '2026-08-01 11:59:32'),
(1, 18, '2026-08-01 11:59:32'),
(1, 19, '2026-08-01 11:59:32'),
(1, 20, '2026-08-01 11:59:32'),
(1, 21, '2026-08-01 11:59:32'),
(1, 22, '2026-08-01 11:59:32'),
(1, 23, '2026-08-01 11:59:32'),
(1, 24, '2026-08-01 11:59:32'),
(1, 25, '2026-08-01 11:59:32'),
(1, 26, '2026-08-01 11:59:32'),
(1, 27, '2026-08-01 11:59:32'),
(1, 28, '2026-08-01 11:59:32'),
(1, 29, '2026-08-01 11:59:32'),
(1, 30, '2026-08-01 11:59:32'),
(1, 31, '2026-08-01 11:59:32'),
(1, 32, '2026-08-01 11:59:32'),
(1, 33, '2026-08-01 11:59:32'),
(1, 34, '2026-08-01 11:59:32'),
(1, 35, '2026-08-01 11:59:32'),
(1, 36, '2026-08-01 11:59:32'),
(1, 37, '2026-08-01 11:59:32'),
(1, 38, '2026-08-01 11:59:32'),
(1, 39, '2026-08-01 11:59:32'),
(1, 40, '2026-08-01 11:59:32'),
(1, 41, '2026-08-01 11:59:32'),
(1, 42, '2026-08-01 11:59:32'),
(1, 43, '2026-08-01 11:59:32'),
(1, 44, '2026-08-01 11:59:32'),
(1, 45, '2026-08-01 11:59:32'),
(1, 46, '2026-08-01 11:59:32'),
(1, 47, '2026-08-01 11:59:32'),
(1, 72, '2026-08-01 11:59:32'),
(1, 73, '2026-08-01 11:59:32'),
(1, 74, '2026-08-01 11:59:32'),
(1, 75, '2026-08-01 11:59:32'),
(1, 76, '2026-08-01 11:59:32'),
(1, 77, '2026-08-01 11:59:32'),
(1, 78, '2026-08-01 11:59:32'),
(1, 79, '2026-08-01 11:59:32'),
(1, 80, '2026-08-01 11:59:32'),
(1, 81, '2026-08-01 11:59:32'),
(1, 82, '2026-08-01 11:59:32'),
(2, 1, '2026-08-01 14:41:33'),
(2, 5, '2026-08-01 14:41:33'),
(2, 11, '2026-08-01 14:41:33'),
(2, 12, '2026-08-01 14:41:33'),
(2, 16, '2026-08-01 14:41:33'),
(2, 24, '2026-08-01 14:41:33'),
(2, 25, '2026-08-01 14:41:33'),
(2, 26, '2026-08-01 14:41:33'),
(2, 27, '2026-08-01 14:41:33'),
(2, 28, '2026-08-01 14:41:33'),
(2, 29, '2026-08-01 14:41:33'),
(2, 30, '2026-08-01 14:41:33'),
(2, 31, '2026-08-01 14:41:33'),
(2, 32, '2026-08-01 14:41:33'),
(2, 33, '2026-08-01 14:41:33'),
(2, 34, '2026-08-01 14:41:33'),
(2, 41, '2026-08-01 14:41:33'),
(2, 44, '2026-08-01 14:41:33'),
(2, 46, '2026-08-01 14:41:33'),
(2, 47, '2026-08-01 14:41:33'),
(2, 72, '2026-08-01 14:41:33'),
(2, 73, '2026-08-01 14:41:33'),
(2, 74, '2026-08-01 14:41:33'),
(2, 75, '2026-08-01 14:41:33'),
(2, 76, '2026-08-01 14:41:33'),
(2, 77, '2026-08-01 14:41:33'),
(2, 78, '2026-08-01 14:41:33'),
(2, 79, '2026-08-01 14:41:33'),
(2, 80, '2026-08-01 14:41:33'),
(2, 137, '2026-08-01 14:41:33'),
(5, 1, '2026-08-01 12:07:11'),
(5, 5, '2026-08-01 12:07:11'),
(5, 16, '2026-08-01 12:07:11'),
(5, 24, '2026-08-01 12:07:11'),
(5, 25, '2026-08-01 12:07:11'),
(5, 26, '2026-08-01 12:07:11'),
(5, 28, '2026-08-01 12:07:11'),
(5, 29, '2026-08-01 12:07:11'),
(5, 30, '2026-08-01 12:07:11'),
(5, 31, '2026-08-01 12:07:11'),
(5, 32, '2026-08-01 12:07:11'),
(5, 33, '2026-08-01 12:07:11'),
(5, 34, '2026-08-01 12:07:11'),
(5, 35, '2026-08-01 12:07:11'),
(5, 36, '2026-08-01 12:07:11'),
(5, 37, '2026-08-01 12:07:11'),
(5, 39, '2026-08-01 12:07:11'),
(5, 40, '2026-08-01 12:07:11'),
(5, 42, '2026-08-01 12:07:11'),
(5, 43, '2026-08-01 12:07:11'),
(5, 45, '2026-08-01 12:07:11'),
(5, 46, '2026-08-01 12:07:11'),
(8, 1, '2026-08-01 14:47:11'),
(8, 6, '2026-08-01 14:47:11'),
(8, 11, '2026-08-01 14:47:11'),
(8, 12, '2026-08-01 14:47:11'),
(8, 16, '2026-08-01 14:47:11'),
(8, 17, '2026-08-01 14:47:11'),
(8, 18, '2026-08-01 14:47:11'),
(8, 22, '2026-08-01 14:47:11'),
(8, 24, '2026-08-01 14:47:11'),
(8, 25, '2026-08-01 14:47:11'),
(8, 26, '2026-08-01 14:47:11'),
(8, 28, '2026-08-01 14:47:11'),
(8, 29, '2026-08-01 14:47:11'),
(8, 30, '2026-08-01 14:47:11'),
(8, 31, '2026-08-01 14:47:11'),
(8, 32, '2026-08-01 14:47:11'),
(8, 33, '2026-08-01 14:47:11'),
(8, 34, '2026-08-01 14:47:11'),
(8, 35, '2026-08-01 14:47:11'),
(8, 41, '2026-08-01 14:47:11'),
(8, 46, '2026-08-01 14:47:11'),
(8, 47, '2026-08-01 14:47:11'),
(8, 72, '2026-08-01 14:47:11'),
(8, 73, '2026-08-01 14:47:11'),
(8, 74, '2026-08-01 14:47:11'),
(8, 75, '2026-08-01 14:47:11'),
(8, 76, '2026-08-01 14:47:11'),
(8, 77, '2026-08-01 14:47:11'),
(8, 78, '2026-08-01 14:47:11'),
(8, 79, '2026-08-01 14:47:11'),
(8, 80, '2026-08-01 14:47:11'),
(8, 130, '2026-08-01 14:47:11'),
(8, 131, '2026-08-01 14:47:11'),
(8, 132, '2026-08-01 14:47:11'),
(8, 133, '2026-08-01 14:47:11'),
(8, 134, '2026-08-01 14:47:11');

-- --------------------------------------------------------

--
-- Structure de la table `roles_securite`
--

CREATE TABLE `roles_securite` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `nom` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `systeme` tinyint(1) NOT NULL DEFAULT 0,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles_securite`
--

INSERT INTO `roles_securite` (`id`, `ecole_id`, `code`, `nom`, `description`, `systeme`, `actif`, `cree_par`, `created_at`, `updated_at`) VALUES
(1, 1, 'SUPER_ADMIN', 'Super Administrateur', 'Accès complet au système', 1, 1, 'INSTALLATION', '2026-07-31 19:52:40', '2026-07-31 19:52:40'),
(2, 1, 'DIRECTION', 'Direction', 'Gestion générale et validation', 1, 1, 'INSTALLATION', '2026-07-31 19:52:40', '2026-07-31 19:52:40'),
(3, 1, 'COMPTABLE', 'Comptable', 'Gestion financière et rapports', 1, 1, 'INSTALLATION', '2026-07-31 19:52:40', '2026-07-31 19:52:40'),
(4, 1, 'CAISSIER', 'Caissier', 'Encaissements, reçus et caisse', 1, 1, 'INSTALLATION', '2026-07-31 19:52:40', '2026-07-31 19:52:40'),
(5, 1, 'ENSEIGNANT', 'Enseignant', 'Classes, notes et bulletins', 1, 1, 'INSTALLATION', '2026-07-31 19:52:40', '2026-07-31 19:52:40'),
(6, 1, 'LECTURE_SEULE', 'Lecture seule', 'Profil minimal sans accès métier automatique.', 1, 1, 'INSTALLATION_UTILISATEURS_V1', '2026-07-31 22:24:02', '2026-07-31 22:24:02'),
(8, 1, 'DIRECTEUR', 'Directeur des Etudes', 'Celui qui s\'occupe de la discipline de l\'ecole', 0, 1, 'Administrateur Principal', '2026-08-01 13:37:59', '2026-08-01 13:37:59');

-- --------------------------------------------------------

--
-- Structure de la table `salles`
--

CREATE TABLE `salles` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `code` varchar(191) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `capacite` int(11) NOT NULL DEFAULT 40,
  `batiment` varchar(191) DEFAULT NULL,
  `etage` varchar(191) DEFAULT NULL,
  `responsable` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `salles`
--

INSERT INTO `salles` (`id`, `ecole_id`, `code`, `nom`, `type`, `capacite`, `batiment`, `etage`, `responsable`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, 'SAL001', 'BATIMENT A1', 'CLASSE', 40, 'A1', '1er etage', 'Freddy LIHAMBA', 'ACTIVE', '2026-08-01 23:21:13.763', '2026-08-01 23:21:13.763');

-- --------------------------------------------------------

--
-- Structure de la table `seances_emploi_temps`
--

CREATE TABLE `seances_emploi_temps` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `creneau_horaire_id` int(11) NOT NULL,
  `salle_id` int(11) DEFAULT NULL,
  `type_cours_id` int(11) DEFAULT NULL,
  `jour` varchar(20) NOT NULL,
  `observations` text DEFAULT NULL,
  `statut` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `sections`
--

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `statut` varchar(191) NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `sections`
--

INSERT INTO `sections` (`id`, `ecole_id`, `nom`, `code`, `description`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, 'PRIMAIRE', 'PRIM', 'Ecole primaire', 'active', '2026-07-30 01:11:09.214', '2026-07-30 01:11:09.214');

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `jeton_hash` varchar(64) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `expire_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `sessions`
--

INSERT INTO `sessions` (`id`, `jeton_hash`, `utilisateur_id`, `expire_at`, `created_at`) VALUES
(1, '31b5a14f75ad7392a13b55ca263611f17672e0b6a983ca51c8ec76d1b567e405', 1, '2026-07-30 08:25:55.406', '2026-07-30 00:25:55.443'),
(6, '278184f5bb6c3bc231ab8933eb05118a920ab371f91d2671906b84ee714711a1', 1, '2026-07-30 18:36:50.536', '2026-07-30 10:36:50.538'),
(39, '7e03666c397db1b57ed4e5094a0c0e82e36dc457418d788a06491397349b22cc', 1, '2026-08-01 04:32:37.970', '2026-07-31 20:32:37.972'),
(70, '3150f0ffb765d54781b1b99d5a4654d324b4b32bcd572d121f0e8562ea21c844', 1, '2026-08-02 09:18:52.919', '2026-08-02 01:18:52.921'),
(71, 'a00a21a8e60fed3b9d6a4889c5d56553371c36bad5f3cf35345dfb61c261ecfb', 1, '2026-08-02 22:42:59.806', '2026-08-02 14:42:59.808');

-- --------------------------------------------------------

--
-- Structure de la table `sessions_caisse_scolaire`
--

CREATE TABLE `sessions_caisse_scolaire` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `utilisateur_nom` varchar(191) NOT NULL,
  `date_ouverture` datetime NOT NULL DEFAULT current_timestamp(),
  `date_fermeture` datetime DEFAULT NULL,
  `solde_initial` decimal(14,2) NOT NULL DEFAULT 0.00,
  `solde_theorique` decimal(14,2) DEFAULT NULL,
  `solde_compte` decimal(14,2) DEFAULT NULL,
  `ecart` decimal(14,2) DEFAULT NULL,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `statut` varchar(30) NOT NULL DEFAULT 'OUVERTE',
  `observation_fermeture` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `sessions_caisse_scolaire`
--

INSERT INTO `sessions_caisse_scolaire` (`id`, `ecole_id`, `utilisateur_nom`, `date_ouverture`, `date_fermeture`, `solde_initial`, `solde_theorique`, `solde_compte`, `ecart`, `devise`, `statut`, `observation_fermeture`, `created_at`, `updated_at`) VALUES
(1, 1, 'Administrateur Principal', '2026-08-01 20:38:18', '2026-08-01 20:38:39', 0.00, 0.00, 0.00, 0.00, 'CDF', 'FERMEE', NULL, '2026-08-01 20:38:18', '2026-08-01 20:38:39'),
(2, 1, 'Administrateur Principal', '2026-08-01 20:38:47', '2026-08-01 20:39:16', 100.00, 100.00, 100.00, 0.00, 'USD', 'FERMEE', NULL, '2026-08-01 20:38:47', '2026-08-01 20:39:16'),
(3, 1, 'Administrateur Principal', '2026-08-01 20:39:25', '2026-08-01 20:39:31', 500000.00, 500000.00, 500000.00, 0.00, 'CDF', 'FERMEE', NULL, '2026-08-01 20:39:25', '2026-08-01 20:39:31'),
(4, 1, 'Administrateur Principal', '2026-08-01 23:18:37', NULL, 900000.00, NULL, NULL, NULL, 'CDF', 'OUVERTE', NULL, '2026-08-01 23:18:37', '2026-08-01 23:18:37');

-- --------------------------------------------------------

--
-- Structure de la table `sessions_securite`
--

CREATE TABLE `sessions_securite` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `utilisateur_nom` varchar(191) NOT NULL,
  `jeton_session` varchar(255) DEFAULT NULL,
  `adresse_ip` varchar(100) DEFAULT NULL,
  `appareil` text DEFAULT NULL,
  `navigateur` varchar(191) DEFAULT NULL,
  `localisation` varchar(191) DEFAULT NULL,
  `date_debut` datetime NOT NULL DEFAULT current_timestamp(),
  `date_fin` datetime DEFAULT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tarifs_frais_scolaires`
--

CREATE TABLE `tarifs_frais_scolaires` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `frais_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `classe_cle` int(11) GENERATED ALWAYS AS (ifnull(`classe_id`,0)) STORED,
  `montant` decimal(14,2) NOT NULL DEFAULT 0.00,
  `devise` varchar(10) NOT NULL DEFAULT 'CDF',
  `date_echeance` date DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `cree_par` varchar(191) DEFAULT NULL,
  `modifie_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `tarifs_frais_scolaires`
--

INSERT INTO `tarifs_frais_scolaires` (`id`, `ecole_id`, `frais_id`, `annee_scolaire_id`, `classe_id`, `montant`, `devise`, `date_echeance`, `actif`, `cree_par`, `modifie_par`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, NULL, 200000.00, 'CDF', '2026-08-07', 1, 'Administrateur Principal', NULL, '2026-08-01 23:15:49', '2026-08-01 23:15:49');

-- --------------------------------------------------------

--
-- Structure de la table `titulaires_classes`
--

CREATE TABLE `titulaires_classes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `utilisateur_securite_id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `annee_scolaire_id` int(11) NOT NULL,
  `principal` tinyint(1) NOT NULL DEFAULT 1,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `cree_par` varchar(190) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `types_cours`
--

CREATE TABLE `types_cours` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `code` varchar(191) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `couleur` varchar(191) NOT NULL DEFAULT '#1761A8',
  `actif` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `types_evaluations`
--

CREATE TABLE `types_evaluations` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `nom` varchar(120) NOT NULL,
  `code` varchar(50) NOT NULL,
  `couleur` varchar(20) NOT NULL DEFAULT '#2563EB',
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `coefficient` decimal(6,2) NOT NULL DEFAULT 1.00,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `types_evaluations`
--

INSERT INTO `types_evaluations` (`id`, `ecole_id`, `nom`, `code`, `couleur`, `actif`, `created_at`, `updated_at`, `coefficient`, `description`) VALUES
(1, 1, 'INTERROGATION', 'INTERRO', '#eb2498', 1, '2026-08-01 23:12:00.924', '2026-08-01 23:12:00.924', 1.00, 'Interrogation'),
(2, 1, 'DEVOIR', 'DV', '#24ebaf', 1, '2026-08-01 23:12:46.551', '2026-08-01 23:12:46.551', 1.00, 'Devoir a class et a domicile'),
(3, 1, 'EXAMEN', 'EXA', '#eb242e', 1, '2026-08-01 23:13:30.878', '2026-08-01 23:13:30.878', 1.00, 'Examen');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `mot_de_passe` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'administrateur',
  `statut` varchar(191) NOT NULL DEFAULT 'actif',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom`, `email`, `mot_de_passe`, `role`, `statut`, `created_at`, `updated_at`) VALUES
(1, 'Administrateur Principal', 'admin@dsschool.cd', 'scrypt:56f2969d50d3adcb21323d1841e650b1:ab575c5946051af298908e367d58355f561f437dba8ecd4769981c612645216582a49e1172c9eef926aaba4b5a00ad8775e648cff11ce6d481aa8330f1384d10', 'Super Administrateur', 'actif', '2026-07-30 00:23:58.414', '2026-07-31 20:26:37.117'),
(5, 'LOMBO LOFUMA Jean', 'direct@dsschool.cd', 'scrypt:93a28a34035e22e5081da2ec238bacf8:9d5c93b5e75448fbeac4a503bf0389de184d30c044e413790470c78d0cf0139b7aab036666e6cf306dc6bfd01838010927bcfb164768d57a578aaaca2a07ac22', 'Direction', 'actif', '2026-08-01 09:57:11.400', '2026-08-01 09:57:11.400'),
(6, 'MULUBA', 'ens@dsschool.cd', 'scrypt:b884c29d27004b7b95dd5b003fd5cde1:7c9a56e7022ed63a205abb51ad4a5dc933b974b1e889a5ae786280cbb67eb3245f7890a05b6e416ecb30659da60529ed849e2bd4adc4f5e7d2482a7e3d6a120b', 'Enseignant', 'actif', '2026-08-01 10:04:55.626', '2026-08-01 10:04:55.626'),
(7, 'LIHAMBA BOFATE Freddy', 'd.etude@dsschool.cd', 'scrypt:04195a6197b4d01c9a23132fd1390e44:98835c81bee98d8e82e0d9752528cf1f8c825f76c035078cc415de40b4aa1068fa97bfff8695bc0cb083deaa23c6d292521e4f284d210d3afcf59340efc112a3', 'Directeur des Etudes', 'actif', '2026-08-01 11:42:03.414', '2026-08-01 11:42:03.414');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs_permissions_securite`
--

CREATE TABLE `utilisateurs_permissions_securite` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `decision` varchar(20) NOT NULL DEFAULT 'AUTORISER',
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `ecole_id` int(11) DEFAULT NULL,
  `campus_id` int(11) DEFAULT NULL,
  `annee_scolaire_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `matiere_id` int(11) DEFAULT NULL,
  `eleve_id` int(11) DEFAULT NULL,
  `devise` varchar(10) DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs_roles_securite`
--

CREATE TABLE `utilisateurs_roles_securite` (
  `id` int(11) NOT NULL,
  `utilisateur_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `principal` tinyint(1) NOT NULL DEFAULT 0,
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs_roles_securite`
--

INSERT INTO `utilisateurs_roles_securite` (`id`, `utilisateur_id`, `role_id`, `date_debut`, `date_fin`, `actif`, `principal`, `cree_par`, `created_at`, `updated_at`) VALUES
(5, 4, 1, NULL, NULL, 1, 1, 'SYNCHRONISATION_RBAC', '2026-07-31 21:54:47', '2026-08-01 11:51:48'),
(13, 9, 2, NULL, NULL, 1, 1, 'Administrateur Principal', '2026-08-01 11:57:11', '2026-08-01 11:57:11'),
(14, 10, 5, NULL, NULL, 1, 1, 'Administrateur Principal', '2026-08-01 12:04:55', '2026-08-01 12:04:55'),
(15, 11, 8, NULL, NULL, 1, 1, 'Administrateur Principal', '2026-08-01 13:42:03', '2026-08-01 13:42:03');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs_securite`
--

CREATE TABLE `utilisateurs_securite` (
  `id` int(11) NOT NULL,
  `ecole_id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `mot_de_passe_hash` varchar(255) NOT NULL,
  `doit_changer_mot_de_passe` tinyint(1) NOT NULL DEFAULT 1,
  `statut` varchar(30) NOT NULL DEFAULT 'ACTIF',
  `tentatives_echouees` int(11) NOT NULL DEFAULT 0,
  `verrouille_jusqua` datetime DEFAULT NULL,
  `derniere_connexion` datetime DEFAULT NULL,
  `derniere_ip` varchar(100) DEFAULT NULL,
  `dernier_appareil` text DEFAULT NULL,
  `deux_facteurs_actif` tinyint(1) NOT NULL DEFAULT 0,
  `secret_deux_facteurs` varchar(255) DEFAULT NULL,
  `cree_par` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs_securite`
--

INSERT INTO `utilisateurs_securite` (`id`, `ecole_id`, `nom`, `email`, `telephone`, `role_id`, `mot_de_passe_hash`, `doit_changer_mot_de_passe`, `statut`, `tentatives_echouees`, `verrouille_jusqua`, `derniere_connexion`, `derniere_ip`, `dernier_appareil`, `deux_facteurs_actif`, `secret_deux_facteurs`, `cree_par`, `created_at`, `updated_at`) VALUES
(4, 1, 'Administrateur Principal', 'admin@dsschool.cd', '0820646942', 1, 'scrypt:56f2969d50d3adcb21323d1841e650b1:ab575c5946051af298908e367d58355f561f437dba8ecd4769981c612645216582a49e1172c9eef926aaba4b5a00ad8775e648cff11ce6d481aa8330f1384d10', 0, 'ACTIF', 0, NULL, '2026-08-03 02:21:58', NULL, NULL, 0, NULL, 'SYNCHRONISATION_RBAC', '2026-07-31 21:54:47', '2026-08-03 02:21:58'),
(9, 1, 'LOMBO LOFUMA Jean', 'direct@dsschool.cd', '0820646942', 2, 'scrypt:93a28a34035e22e5081da2ec238bacf8:9d5c93b5e75448fbeac4a503bf0389de184d30c044e413790470c78d0cf0139b7aab036666e6cf306dc6bfd01838010927bcfb164768d57a578aaaca2a07ac22', 1, 'ACTIF', 0, NULL, '2026-08-01 14:43:45', NULL, NULL, 0, NULL, 'Administrateur Principal', '2026-08-01 11:57:11', '2026-08-01 14:43:45'),
(10, 1, 'MULUBA', 'ens@dsschool.cd', '0820646942', 5, 'scrypt:b884c29d27004b7b95dd5b003fd5cde1:7c9a56e7022ed63a205abb51ad4a5dc933b974b1e889a5ae786280cbb67eb3245f7890a05b6e416ecb30659da60529ed849e2bd4adc4f5e7d2482a7e3d6a120b', 1, 'ACTIF', 0, NULL, '2026-08-01 12:07:21', NULL, NULL, 0, NULL, 'Administrateur Principal', '2026-08-01 12:04:55', '2026-08-01 12:07:21'),
(11, 1, 'LIHAMBA BOFATE Freddy', 'd.etude@dsschool.cd', '0820646942', 8, 'scrypt:04195a6197b4d01c9a23132fd1390e44:98835c81bee98d8e82e0d9752528cf1f8c825f76c035078cc415de40b4aa1068fa97bfff8695bc0cb083deaa23c6d292521e4f284d210d3afcf59340efc112a3', 1, 'ACTIF', 0, NULL, '2026-08-01 15:13:58', NULL, NULL, 0, NULL, 'Administrateur Principal', '2026-08-01 13:42:03', '2026-08-01 15:13:58');

-- --------------------------------------------------------

--
-- Structure de la table `versions_modeles_bulletins`
--

CREATE TABLE `versions_modeles_bulletins` (
  `id` int(11) NOT NULL,
  `modele_bulletin_id` int(11) NOT NULL,
  `numero_version` int(11) NOT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration`)),
  `commentaire` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `versions_modeles_bulletins`
--

INSERT INTO `versions_modeles_bulletins` (`id`, `modele_bulletin_id`, `numero_version`, `configuration`, `commentaire`, `created_at`) VALUES
(1, 1, 1, '{\"colonnes\":[\"matiere\",\"note\",\"coefficient\",\"moyenne\",\"appreciation\"]}', 'Création du modèle', '2026-08-02 00:04:45.306');

-- --------------------------------------------------------

--
-- Structure de la table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('1c563db1-1ad8-463e-b702-8e4248073996', '50e1e4a7a8aba55ba51738f4c336877f5e9313908f73111f9743b0629917722d', '2026-07-30 03:10:04.463', '20260730030957_safe_campus_core_v1', NULL, NULL, '2026-07-30 03:09:58.183', 1),
('2226745e-bf8c-4a95-8493-5adbf9032308', '0729275826802f3ceaa7edf3f370e127a24456c3dbe877ab8390c9fdd2be280b', '2026-07-30 13:13:32.754', '20260730131313_parametres_academiques', NULL, NULL, '2026-07-30 13:13:14.136', 1),
('40807548-cd46-4a97-b019-71a8fb92212a', 'a1b4c1554a13ba474553da3e37bfa0c2b50e450db827eb3df4cebbc115643d7e', '2026-07-30 00:36:26.601', '20260730003621_socle_administratif', NULL, NULL, '2026-07-30 00:36:21.043', 1),
('426c49c5-d8cd-4ac1-bed7-b60449e82de0', '328503b21994698da75daf489133f88f013b1206568cc4af940f28a7e848d668', '2026-07-30 00:55:10.391', '20260730005454_module_eleves_premium', NULL, NULL, '2026-07-30 00:54:55.011', 1),
('4cc31293-7d1a-4537-9d6b-9ccbe2ef2ae9', '4c52223cba4c9120ec2d128e09f5ff837bfa50229b86b498ec2c67703023438c', '2026-07-30 00:23:15.409', '20260730002313_ajout_sessions_authentification', NULL, NULL, '2026-07-30 00:23:13.556', 1),
('6d52d884-1301-4dc4-ac72-7078a5f49668', '8fd9da7b7bbf34c3e62e81889c94d01e0fb50c7736791f97bde6484351bd29da', '2026-07-30 22:46:24.723', '20260730224618_bulletins_personnalisables_v2', NULL, NULL, '2026-07-30 22:46:19.023', 1),
('70bcf60f-8adb-4887-a115-239977470a9f', '05fa6ea0573e6eb0a576fd6c9cec40fa637384a85e4fdc0cb0a0ee21640e4958', '2026-07-30 22:22:57.584', '20260730222238_centre_academique_premium_v1', NULL, NULL, '2026-07-30 22:22:38.728', 1),
('a554d4b3-c5d3-492c-b992-3675da397f01', '14d7c2be66ed0525bea78873cd442d791ce2d97df8afcfaa525b81b3fa91dfc6', '2026-07-29 23:27:44.473', '20260729232743_initialisation', NULL, NULL, '2026-07-29 23:27:43.778', 1),
('b32fa763-ad9b-4de6-8bab-4a6b67c350f6', 'dd822403fedfae5b576caa14098ecb685cd3b23848c61eb5f67af719ace1017c', NULL, '20260730233316_evaluations_premium_v1', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260730233316_evaluations_premium_v1\n\nDatabase error code: 1005\n\nDatabase error:\nCan\'t create table `ds_school`.`enseignants` (errno: 121 \"Duplicate key on write or update\")\n\nPlease check the query number 23 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260730233316_evaluations_premium_v1\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260730233316_evaluations_premium_v1\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260', '2026-07-30 23:35:25.322', '2026-07-30 23:33:16.662', 0),
('c9456902-8732-4826-b491-34c3099bc108', '5782210698afdb0f0a6873f5a581d1518ca1e824e862e16b799605d92dd8f7aa', '2026-07-30 01:28:37.460', '20260730012834_eleves_premium_v2', NULL, NULL, '2026-07-30 01:28:34.390', 1),
('ca4f4f8d-8755-4d00-848a-8f20a2616cda', '76d0cbec5bc0a74225fc973c54458146d63e2331682402713939596118d1e80b', '2026-07-30 02:41:25.244', '20260730024109_module_enseignants_premium_v1', NULL, NULL, '2026-07-30 02:41:09.829', 1),
('ce28d205-faba-4bf9-a2d4-358ba1561675', 'c1fd0b07abe143bed71194fada9d82debde1bd27b85a9f574877f3461edd35ff', '2026-07-30 21:53:55.429', '20260730215335_emploi_du_temps_intelligent', NULL, NULL, '2026-07-30 21:53:35.918', 1),
('cf0e539d-9abd-4b5c-bc26-61e5705eddb5', '2fe80920eadf8e2e3ef3bc7421d3f150b1facdc0d0e86941ccd53e6a46359962', '2026-07-30 11:55:09.733', '20260730115459_ajout_module_matieres', NULL, NULL, '2026-07-30 11:54:59.598', 1);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `affectations_enseignants`
--
ALTER TABLE `affectations_enseignants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `affectations_enseignants_enseignant_id_idx` (`enseignant_id`),
  ADD KEY `affectations_enseignants_classe_id_idx` (`classe_id`);

--
-- Index pour la table `affectations_utilisateurs_classes`
--
ALTER TABLE `affectations_utilisateurs_classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_affectation_utilisateur` (`utilisateur_id`,`statut`),
  ADD KEY `idx_affectation_classe` (`annee_scolaire_id`,`classe_id`,`fonction`),
  ADD KEY `fk_affectation_classe` (`classe_id`),
  ADD KEY `fk_affectation_matiere` (`matiere_id`);

--
-- Index pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `annees_scolaires_ecole_id_libelle_key` (`ecole_id`,`libelle`),
  ADD KEY `annees_scolaires_ecole_id_active_idx` (`ecole_id`,`active`);

--
-- Index pour la table `avantages_financiers_scolaires`
--
ALTER TABLE `avantages_financiers_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_avantage_ecole` (`ecole_id`,`statut`),
  ADD KEY `idx_avantage_inscription` (`inscription_id`);

--
-- Index pour la table `cartes_rfid`
--
ALTER TABLE `cartes_rfid`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cartes_rfid_uid_key` (`uid`),
  ADD UNIQUE KEY `cartes_rfid_numero_interne_key` (`numero_interne`),
  ADD KEY `cartes_rfid_type_proprietaire_proprietaire_id_idx` (`type_proprietaire`,`proprietaire_id`),
  ADD KEY `cartes_rfid_statut_idx` (`statut`);

--
-- Index pour la table `categories_frais_scolaires`
--
ALTER TABLE `categories_frais_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_cat_frais_ecole_code` (`ecole_id`,`code`),
  ADD KEY `idx_cat_frais_ecole` (`ecole_id`,`actif`);

--
-- Index pour la table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `classes_ecole_id_code_key` (`ecole_id`,`code`),
  ADD KEY `classes_section_id_idx` (`section_id`),
  ADD KEY `classes_ecole_id_statut_idx` (`ecole_id`,`statut`);

--
-- Index pour la table `comptes_parents`
--
ALTER TABLE `comptes_parents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_compte_parent_identifiant` (`ecole_id`,`identifiant`),
  ADD UNIQUE KEY `uk_compte_parent_parent` (`parent_id`),
  ADD KEY `idx_compte_parent_statut` (`ecole_id`,`statut`);

--
-- Index pour la table `connexions_parents`
--
ALTER TABLE `connexions_parents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_connexion_parent` (`parent_id`,`date_connexion`),
  ADD KEY `idx_connexion_ecole` (`ecole_id`,`statut`);

--
-- Index pour la table `contrats_enseignants`
--
ALTER TABLE `contrats_enseignants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contrats_enseignants_enseignant_id_statut_idx` (`enseignant_id`,`statut`);

--
-- Index pour la table `creneaux_horaires`
--
ALTER TABLE `creneaux_horaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `creneaux_horaires_ecole_id_ordre_key` (`ecole_id`,`ordre`),
  ADD KEY `creneaux_horaires_ecole_id_actif_idx` (`ecole_id`,`actif`);

--
-- Index pour la table `crm_activites`
--
ALTER TABLE `crm_activites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_crm_activite_prospect` (`prospect_id`,`date_activite`),
  ADD KEY `fk_crm_activite_ecole` (`ecole_id`);

--
-- Index pour la table `crm_prospects`
--
ALTER TABLE `crm_prospects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_crm_prospect_code` (`code`),
  ADD KEY `idx_crm_prospect_ecole_statut` (`ecole_id`,`statut`),
  ADD KEY `idx_crm_prospect_relance` (`ecole_id`,`prochaine_relance`);

--
-- Index pour la table `delegations_securite`
--
ALTER TABLE `delegations_securite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_delegation_securite_dates` (`ecole_id`,`date_debut`,`date_fin`),
  ADD KEY `fk_delegation_source` (`utilisateur_source_id`),
  ADD KEY `fk_delegation_cible` (`utilisateur_cible_id`),
  ADD KEY `fk_delegation_role` (`role_id`);

--
-- Index pour la table `details_paiements_scolaires`
--
ALTER TABLE `details_paiements_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_detail_paiement` (`paiement_id`),
  ADD KEY `idx_detail_frais` (`frais_id`),
  ADD KEY `fk_detail_tarif` (`tarif_id`);

--
-- Index pour la table `diplomes_enseignants`
--
ALTER TABLE `diplomes_enseignants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `diplomes_enseignants_enseignant_id_idx` (`enseignant_id`);

--
-- Index pour la table `disponibilites_enseignants`
--
ALTER TABLE `disponibilites_enseignants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_disponibilite_enseignant` (`ecole_id`,`enseignant_id`,`jour`,`creneau_horaire_id`),
  ADD KEY `idx_dispo_enseignant` (`enseignant_id`),
  ADD KEY `idx_dispo_jour_creneau` (`jour`,`creneau_horaire_id`);

--
-- Index pour la table `documents_academiques`
--
ALTER TABLE `documents_academiques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documents_academiques_numero_key` (`numero`),
  ADD UNIQUE KEY `documents_academiques_code_verification_key` (`code_verification`),
  ADD KEY `documents_academiques_ecole_id_statut_idx` (`ecole_id`,`statut`),
  ADD KEY `documents_academiques_eleve_id_date_delivrance_idx` (`eleve_id`,`date_delivrance`),
  ADD KEY `documents_academiques_type_date_delivrance_idx` (`type`,`date_delivrance`),
  ADD KEY `documents_academiques_inscription_id_fkey` (`inscription_id`),
  ADD KEY `documents_academiques_classe_id_fkey` (`classe_id`),
  ADD KEY `documents_academiques_annee_scolaire_id_fkey` (`annee_scolaire_id`);

--
-- Index pour la table `documents_academiques_enterprise`
--
ALTER TABLE `documents_academiques_enterprise`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_doc_numero` (`ecole_id`,`numero_document`),
  ADD UNIQUE KEY `uk_doc_verification` (`code_verification`),
  ADD KEY `idx_doc_eleve` (`eleve_id`),
  ADD KEY `idx_doc_inscription` (`inscription_id`),
  ADD KEY `idx_doc_type` (`type_document`),
  ADD KEY `idx_doc_statut` (`statut`);

--
-- Index pour la table `documents_eleves`
--
ALTER TABLE `documents_eleves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documents_eleves_eleve_id_idx` (`eleve_id`);

--
-- Index pour la table `documents_enseignants`
--
ALTER TABLE `documents_enseignants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documents_enseignants_enseignant_id_idx` (`enseignant_id`);

--
-- Index pour la table `documents_parents`
--
ALTER TABLE `documents_parents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_document_parent` (`parent_id`),
  ADD KEY `idx_document_parent_ecole` (`ecole_id`);

--
-- Index pour la table `echeanciers_scolaires`
--
ALTER TABLE `echeanciers_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ech_ecole` (`ecole_id`,`statut`),
  ADD KEY `idx_ech_inscription` (`inscription_id`);

--
-- Index pour la table `ecoles`
--
ALTER TABLE `ecoles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ecoles_code_key` (`code`);

--
-- Index pour la table `eleves`
--
ALTER TABLE `eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `eleves_ecole_id_matricule_key` (`ecole_id`,`matricule`),
  ADD KEY `eleves_ecole_id_statut_idx` (`ecole_id`,`statut`),
  ADD KEY `eleves_nom_prenom_idx` (`nom`,`prenom`);

--
-- Index pour la table `enseignants`
--
ALTER TABLE `enseignants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `enseignants_ecole_id_matricule_key` (`ecole_id`,`matricule`),
  ADD UNIQUE KEY `enseignants_numero_carte_rfid_key` (`numero_carte_rfid`),
  ADD KEY `enseignants_ecole_id_statut_idx` (`ecole_id`,`statut`),
  ADD KEY `enseignants_nom_prenom_idx` (`nom`,`prenom`);

--
-- Index pour la table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluations_type_evaluation_id_fkey` (`type_evaluation_id`),
  ADD KEY `evaluations_annee_scolaire_id_fkey` (`annee_scolaire_id`),
  ADD KEY `evaluations_periode_academique_id_fkey` (`periode_academique_id`),
  ADD KEY `evaluations_ecole_id_annee_scolaire_id_statut_idx` (`ecole_id`,`annee_scolaire_id`,`statut`),
  ADD KEY `evaluations_classe_id_periode_academique_id_idx` (`classe_id`,`periode_academique_id`),
  ADD KEY `evaluations_enseignant_id_date_evaluation_idx` (`enseignant_id`,`date_evaluation`),
  ADD KEY `evaluations_matiere_id_classe_id_idx` (`matiere_id`,`classe_id`),
  ADD KEY `evaluations_salle_id_fkey` (`salle_id`);

--
-- Index pour la table `evenements_calendrier`
--
ALTER TABLE `evenements_calendrier`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evenements_calendrier_annee_scolaire_id_date_debut_idx` (`annee_scolaire_id`,`date_debut`),
  ADD KEY `evenements_calendrier_ecoleId_fkey` (`ecoleId`);

--
-- Index pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_frais_ecole_code` (`ecole_id`,`code`),
  ADD KEY `idx_frais_ecole_statut` (`ecole_id`,`actif`),
  ADD KEY `idx_frais_categorie` (`categorie`);

--
-- Index pour la table `historiques_eleves`
--
ALTER TABLE `historiques_eleves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `historiques_eleves_eleve_id_created_at_idx` (`eleve_id`,`created_at`);

--
-- Index pour la table `historiques_enseignants`
--
ALTER TABLE `historiques_enseignants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `historiques_enseignants_enseignant_id_created_at_idx` (`enseignant_id`,`created_at`);

--
-- Index pour la table `historique_documents_academiques`
--
ALTER TABLE `historique_documents_academiques`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hist_doc` (`document_id`),
  ADD KEY `idx_hist_ecole` (`ecole_id`);

--
-- Index pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `inscriptions_eleve_id_annee_scolaire_id_key` (`eleve_id`,`annee_scolaire_id`),
  ADD KEY `inscriptions_classe_id_annee_scolaire_id_idx` (`classe_id`,`annee_scolaire_id`),
  ADD KEY `inscriptions_annee_scolaire_id_fkey` (`annee_scolaire_id`);

--
-- Index pour la table `journal_audit_securite`
--
ALTER TABLE `journal_audit_securite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_securite_ecole_date` (`ecole_id`,`created_at`),
  ADD KEY `idx_audit_securite_module` (`module`,`niveau`),
  ADD KEY `fk_audit_securite_utilisateur` (`utilisateur_id`);

--
-- Index pour la table `journal_impressions_recus`
--
ALTER TABLE `journal_impressions_recus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_impressions_ecole` (`ecole_id`),
  ADD KEY `idx_impressions_recu` (`recu_id`),
  ADD KEY `idx_impressions_date` (`date_impression`);

--
-- Index pour la table `journal_parents`
--
ALTER TABLE `journal_parents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_journal_parent` (`parent_id`,`created_at`),
  ADD KEY `idx_journal_parent_ecole` (`ecole_id`,`niveau`);

--
-- Index pour la table `jours_ouvrables`
--
ALTER TABLE `jours_ouvrables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `jours_ouvrables_ecole_id_jour_key` (`ecole_id`,`jour`),
  ADD KEY `jours_ouvrables_ecole_id_actif_ordre_idx` (`ecole_id`,`actif`,`ordre`);

--
-- Index pour la table `lecteurs_rfid`
--
ALTER TABLE `lecteurs_rfid`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lecteurs_rfid_code_key` (`code`),
  ADD KEY `lecteurs_rfid_statut_idx` (`statut`);

--
-- Index pour la table `matieres`
--
ALTER TABLE `matieres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matieres_code_key` (`code`),
  ADD KEY `matieres_nom_idx` (`nom`),
  ADD KEY `matieres_departement_idx` (`departement`),
  ADD KEY `matieres_statut_idx` (`statut`);

--
-- Index pour la table `modeles_bulletins`
--
ALTER TABLE `modeles_bulletins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `modeles_bulletins_ecole_id_code_key` (`ecole_id`,`code`),
  ADD KEY `modeles_bulletins_ecole_id_actif_par_defaut_idx` (`ecole_id`,`actif`,`par_defaut`);

--
-- Index pour la table `modes_paiements_scolaires`
--
ALTER TABLE `modes_paiements_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mode_paiement` (`paiement_id`),
  ADD KEY `idx_mode_type` (`mode_paiement`);

--
-- Index pour la table `mouvements_caisse_scolaire`
--
ALTER TABLE `mouvements_caisse_scolaire`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mouvement_session` (`session_caisse_id`),
  ADD KEY `idx_mouvement_ecole_date` (`ecole_id`,`date_mouvement`),
  ADD KEY `fk_mouvement_paiement` (`paiement_id`);

--
-- Index pour la table `notes_evaluations`
--
ALTER TABLE `notes_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `notes_evaluations_evaluation_id_eleve_id_key` (`evaluation_id`,`eleve_id`),
  ADD KEY `notes_evaluations_eleve_id_idx` (`eleve_id`);

--
-- Index pour la table `numerotation_documents_academiques`
--
ALTER TABLE `numerotation_documents_academiques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_numerotation_doc` (`ecole_id`,`type_document`,`annee`);

--
-- Index pour la table `observations_eleves`
--
ALTER TABLE `observations_eleves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `observations_eleves_eleve_id_idx` (`eleve_id`);

--
-- Index pour la table `paiements_scolaires`
--
ALTER TABLE `paiements_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_paiement_numero` (`numero_paiement`),
  ADD KEY `idx_paiement_ecole_date` (`ecole_id`,`date_paiement`),
  ADD KEY `idx_paiement_inscription` (`inscription_id`),
  ADD KEY `idx_paiement_annee` (`annee_scolaire_id`),
  ADD KEY `idx_paiement_session_caisse` (`session_caisse_id`);

--
-- Index pour la table `parametres_documents_academiques`
--
ALTER TABLE `parametres_documents_academiques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_param_docs_ecole` (`ecole_id`);

--
-- Index pour la table `parametres_impression_recus`
--
ALTER TABLE `parametres_impression_recus`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_parametres_impression_ecole` (`ecole_id`);

--
-- Index pour la table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_parent_ecole_nom` (`ecole_id`,`nom`,`prenom`),
  ADD KEY `idx_parent_telephone` (`telephone_principal`),
  ADD KEY `idx_parent_email` (`email`);

--
-- Index pour la table `parents_eleves`
--
ALTER TABLE `parents_eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_parent_eleve` (`parent_id`,`eleve_id`),
  ADD KEY `idx_parent_eleve_ecole` (`ecole_id`),
  ADD KEY `idx_parent_eleve_eleve` (`eleve_id`);

--
-- Index pour la table `parents_utilisateurs_portail`
--
ALTER TABLE `parents_utilisateurs_portail`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_parent_portail_parent` (`ecole_id`,`parent_id`),
  ADD UNIQUE KEY `uk_parent_portail_utilisateur` (`ecole_id`,`utilisateur_securite_id`),
  ADD KEY `idx_parent_portail_actif` (`actif`);

--
-- Index pour la table `passages_rfid`
--
ALTER TABLE `passages_rfid`
  ADD PRIMARY KEY (`id`),
  ADD KEY `passages_rfid_date_heure_idx` (`date_heure`),
  ADD KEY `passages_rfid_proprietaire_id_type_proprietaire_idx` (`proprietaire_id`,`type_proprietaire`),
  ADD KEY `passages_rfid_resultat_idx` (`resultat`),
  ADD KEY `passages_rfid_carte_id_idx` (`carte_id`),
  ADD KEY `passages_rfid_lecteur_id_idx` (`lecteur_id`);

--
-- Index pour la table `pauses_academiques`
--
ALTER TABLE `pauses_academiques`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pauses_academiques_ecole_id_actif_idx` (`ecole_id`,`actif`);

--
-- Index pour la table `periodes_academiques`
--
ALTER TABLE `periodes_academiques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `periodes_academiques_annee_scolaire_id_nom_key` (`annee_scolaire_id`,`nom`),
  ADD KEY `periodes_academiques_annee_scolaire_id_ordre_idx` (`annee_scolaire_id`,`ordre`);

--
-- Index pour la table `permissions_securite`
--
ALTER TABLE `permissions_securite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_permission_code` (`code`),
  ADD KEY `idx_permission_module` (`module`,`action`);

--
-- Index pour la table `presences_titulaires`
--
ALTER TABLE `presences_titulaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_presence_eleve_date` (`eleve_id`,`date_presence`),
  ADD KEY `idx_presence_classe_date` (`classe_id`,`date_presence`),
  ADD KEY `idx_presence_ecole` (`ecole_id`),
  ADD KEY `idx_presence_annee` (`annee_scolaire_id`);

--
-- Index pour la table `profils_permissions_securite`
--
ALTER TABLE `profils_permissions_securite`
  ADD PRIMARY KEY (`profil_id`,`permission_id`),
  ADD KEY `fk_profil_permission_permission` (`permission_id`);

--
-- Index pour la table `profils_securite`
--
ALTER TABLE `profils_securite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_profil_securite_code` (`ecole_id`,`code`);

--
-- Index pour la table `recus_scolaires`
--
ALTER TABLE `recus_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_recu_numero` (`numero_recu`),
  ADD UNIQUE KEY `uk_recu_paiement` (`paiement_id`),
  ADD KEY `idx_recu_ecole` (`ecole_id`);

--
-- Index pour la table `regles_academiques`
--
ALTER TABLE `regles_academiques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `regles_academiques_ecole_id_key` (`ecole_id`);

--
-- Index pour la table `regles_evaluations`
--
ALTER TABLE `regles_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `regles_evaluations_ecole_id_key` (`ecole_id`);

--
-- Index pour la table `reimpressions_documents_academiques`
--
ALTER TABLE `reimpressions_documents_academiques`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reimp_doc` (`document_id`),
  ADD KEY `idx_reimp_ecole` (`ecole_id`);

--
-- Index pour la table `responsables_eleves`
--
ALTER TABLE `responsables_eleves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `responsables_eleves_eleve_id_idx` (`eleve_id`),
  ADD KEY `responsables_eleves_ecole_id_idx` (`ecole_id`);

--
-- Index pour la table `roles_permissions_securite`
--
ALTER TABLE `roles_permissions_securite`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `fk_role_permission_permission` (`permission_id`);

--
-- Index pour la table `roles_securite`
--
ALTER TABLE `roles_securite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_role_ecole_code` (`ecole_id`,`code`),
  ADD KEY `idx_role_ecole_actif` (`ecole_id`,`actif`);

--
-- Index pour la table `salles`
--
ALTER TABLE `salles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `salles_ecole_id_code_key` (`ecole_id`,`code`),
  ADD KEY `salles_ecole_id_statut_idx` (`ecole_id`,`statut`);

--
-- Index pour la table `seances_emploi_temps`
--
ALTER TABLE `seances_emploi_temps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_edt_classe_creneau` (`annee_scolaire_id`,`classe_id`,`jour`,`creneau_horaire_id`),
  ADD UNIQUE KEY `uq_edt_enseignant_creneau` (`annee_scolaire_id`,`enseignant_id`,`jour`,`creneau_horaire_id`),
  ADD UNIQUE KEY `uq_edt_salle_creneau` (`annee_scolaire_id`,`salle_id`,`jour`,`creneau_horaire_id`),
  ADD KEY `idx_edt_salle_creneau` (`annee_scolaire_id`,`salle_id`,`jour`,`creneau_horaire_id`),
  ADD KEY `seances_emploi_temps_ecole_id_annee_scolaire_id_statut_idx` (`ecole_id`,`annee_scolaire_id`,`statut`),
  ADD KEY `seances_emploi_temps_classe_id_jour_idx` (`classe_id`,`jour`),
  ADD KEY `seances_emploi_temps_enseignant_id_jour_idx` (`enseignant_id`,`jour`),
  ADD KEY `seances_emploi_temps_matiere_id_fkey` (`matiere_id`),
  ADD KEY `seances_emploi_temps_creneau_horaire_id_fkey` (`creneau_horaire_id`),
  ADD KEY `seances_emploi_temps_salle_id_fkey` (`salle_id`),
  ADD KEY `seances_emploi_temps_type_cours_id_fkey` (`type_cours_id`);

--
-- Index pour la table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sections_ecole_id_code_key` (`ecole_id`,`code`),
  ADD KEY `sections_ecole_id_statut_idx` (`ecole_id`,`statut`);

--
-- Index pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sessions_jeton_hash_key` (`jeton_hash`),
  ADD KEY `sessions_utilisateur_id_idx` (`utilisateur_id`),
  ADD KEY `sessions_expire_at_idx` (`expire_at`);

--
-- Index pour la table `sessions_caisse_scolaire`
--
ALTER TABLE `sessions_caisse_scolaire`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_caisse_ecole_statut` (`ecole_id`,`statut`),
  ADD KEY `idx_caisse_utilisateur` (`utilisateur_nom`);

--
-- Index pour la table `sessions_securite`
--
ALTER TABLE `sessions_securite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_securite_ecole` (`ecole_id`,`statut`),
  ADD KEY `idx_session_securite_utilisateur` (`utilisateur_id`);

--
-- Index pour la table `tarifs_frais_scolaires`
--
ALTER TABLE `tarifs_frais_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_tarif_frais_annee_classe` (`frais_id`,`annee_scolaire_id`,`classe_cle`),
  ADD KEY `idx_tarif_ecole_annee` (`ecole_id`,`annee_scolaire_id`),
  ADD KEY `idx_tarif_classe` (`classe_id`),
  ADD KEY `fk_tarif_annee` (`annee_scolaire_id`);

--
-- Index pour la table `titulaires_classes`
--
ALTER TABLE `titulaires_classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_titulaire_compte_annee` (`utilisateur_securite_id`,`annee_scolaire_id`),
  ADD UNIQUE KEY `uk_titulaire_classe_annee` (`classe_id`,`annee_scolaire_id`),
  ADD KEY `idx_titulaire_ecole` (`ecole_id`),
  ADD KEY `idx_titulaire_enseignant` (`enseignant_id`),
  ADD KEY `idx_titulaire_actif` (`actif`);

--
-- Index pour la table `types_cours`
--
ALTER TABLE `types_cours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `types_cours_ecole_id_code_key` (`ecole_id`,`code`),
  ADD KEY `types_cours_ecole_id_actif_idx` (`ecole_id`,`actif`);

--
-- Index pour la table `types_evaluations`
--
ALTER TABLE `types_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `types_evaluations_ecole_id_code_key` (`ecole_id`,`code`),
  ADD KEY `types_evaluations_ecole_id_actif_idx` (`ecole_id`,`actif`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `utilisateurs_email_key` (`email`);

--
-- Index pour la table `utilisateurs_permissions_securite`
--
ALTER TABLE `utilisateurs_permissions_securite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_permission_utilisateur_perimetre` (`utilisateur_id`,`permission_id`,`decision`,`ecole_id`,`annee_scolaire_id`,`section_id`,`classe_id`,`matiere_id`,`eleve_id`,`devise`),
  ADD KEY `idx_permission_utilisateur` (`utilisateur_id`,`actif`),
  ADD KEY `idx_permission_periode` (`date_debut`,`date_fin`),
  ADD KEY `fk_permission_utilisateur_permission` (`permission_id`),
  ADD KEY `fk_permission_utilisateur_ecole` (`ecole_id`),
  ADD KEY `fk_permission_utilisateur_annee` (`annee_scolaire_id`),
  ADD KEY `fk_permission_utilisateur_section` (`section_id`),
  ADD KEY `fk_permission_utilisateur_classe` (`classe_id`),
  ADD KEY `fk_permission_utilisateur_matiere` (`matiere_id`),
  ADD KEY `fk_permission_utilisateur_eleve` (`eleve_id`);

--
-- Index pour la table `utilisateurs_roles_securite`
--
ALTER TABLE `utilisateurs_roles_securite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_utilisateur_role` (`utilisateur_id`,`role_id`),
  ADD KEY `idx_utilisateur_role_dates` (`date_debut`,`date_fin`,`actif`),
  ADD KEY `fk_utilisateur_role_role` (`role_id`);

--
-- Index pour la table `utilisateurs_securite`
--
ALTER TABLE `utilisateurs_securite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_utilisateur_securite_email` (`ecole_id`,`email`),
  ADD KEY `idx_utilisateur_securite_statut` (`ecole_id`,`statut`),
  ADD KEY `idx_utilisateur_securite_role` (`role_id`);

--
-- Index pour la table `versions_modeles_bulletins`
--
ALTER TABLE `versions_modeles_bulletins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `versions_modeles_bulletins_modele_bulletin_id_numero_version_key` (`modele_bulletin_id`,`numero_version`);

--
-- Index pour la table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `affectations_enseignants`
--
ALTER TABLE `affectations_enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `affectations_utilisateurs_classes`
--
ALTER TABLE `affectations_utilisateurs_classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `avantages_financiers_scolaires`
--
ALTER TABLE `avantages_financiers_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `cartes_rfid`
--
ALTER TABLE `cartes_rfid`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `categories_frais_scolaires`
--
ALTER TABLE `categories_frais_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `comptes_parents`
--
ALTER TABLE `comptes_parents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `connexions_parents`
--
ALTER TABLE `connexions_parents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `contrats_enseignants`
--
ALTER TABLE `contrats_enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `creneaux_horaires`
--
ALTER TABLE `creneaux_horaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `crm_activites`
--
ALTER TABLE `crm_activites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `crm_prospects`
--
ALTER TABLE `crm_prospects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `delegations_securite`
--
ALTER TABLE `delegations_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `details_paiements_scolaires`
--
ALTER TABLE `details_paiements_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `diplomes_enseignants`
--
ALTER TABLE `diplomes_enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `disponibilites_enseignants`
--
ALTER TABLE `disponibilites_enseignants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `documents_academiques`
--
ALTER TABLE `documents_academiques`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `documents_academiques_enterprise`
--
ALTER TABLE `documents_academiques_enterprise`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `documents_eleves`
--
ALTER TABLE `documents_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `documents_enseignants`
--
ALTER TABLE `documents_enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `documents_parents`
--
ALTER TABLE `documents_parents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `echeanciers_scolaires`
--
ALTER TABLE `echeanciers_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `ecoles`
--
ALTER TABLE `ecoles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `eleves`
--
ALTER TABLE `eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `enseignants`
--
ALTER TABLE `enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `evenements_calendrier`
--
ALTER TABLE `evenements_calendrier`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `historiques_eleves`
--
ALTER TABLE `historiques_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `historiques_enseignants`
--
ALTER TABLE `historiques_enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `historique_documents_academiques`
--
ALTER TABLE `historique_documents_academiques`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `journal_audit_securite`
--
ALTER TABLE `journal_audit_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT pour la table `journal_impressions_recus`
--
ALTER TABLE `journal_impressions_recus`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `journal_parents`
--
ALTER TABLE `journal_parents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `jours_ouvrables`
--
ALTER TABLE `jours_ouvrables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `lecteurs_rfid`
--
ALTER TABLE `lecteurs_rfid`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `matieres`
--
ALTER TABLE `matieres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `modeles_bulletins`
--
ALTER TABLE `modeles_bulletins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `modes_paiements_scolaires`
--
ALTER TABLE `modes_paiements_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `mouvements_caisse_scolaire`
--
ALTER TABLE `mouvements_caisse_scolaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `notes_evaluations`
--
ALTER TABLE `notes_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `numerotation_documents_academiques`
--
ALTER TABLE `numerotation_documents_academiques`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `observations_eleves`
--
ALTER TABLE `observations_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `paiements_scolaires`
--
ALTER TABLE `paiements_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `parametres_documents_academiques`
--
ALTER TABLE `parametres_documents_academiques`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `parametres_impression_recus`
--
ALTER TABLE `parametres_impression_recus`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `parents`
--
ALTER TABLE `parents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `parents_eleves`
--
ALTER TABLE `parents_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `parents_utilisateurs_portail`
--
ALTER TABLE `parents_utilisateurs_portail`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `passages_rfid`
--
ALTER TABLE `passages_rfid`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pauses_academiques`
--
ALTER TABLE `pauses_academiques`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `periodes_academiques`
--
ALTER TABLE `periodes_academiques`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `permissions_securite`
--
ALTER TABLE `permissions_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=405;

--
-- AUTO_INCREMENT pour la table `presences_titulaires`
--
ALTER TABLE `presences_titulaires`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `profils_securite`
--
ALTER TABLE `profils_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `recus_scolaires`
--
ALTER TABLE `recus_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `regles_academiques`
--
ALTER TABLE `regles_academiques`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `regles_evaluations`
--
ALTER TABLE `regles_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reimpressions_documents_academiques`
--
ALTER TABLE `reimpressions_documents_academiques`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `responsables_eleves`
--
ALTER TABLE `responsables_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `roles_securite`
--
ALTER TABLE `roles_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `salles`
--
ALTER TABLE `salles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `seances_emploi_temps`
--
ALTER TABLE `seances_emploi_temps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT pour la table `sessions_caisse_scolaire`
--
ALTER TABLE `sessions_caisse_scolaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `sessions_securite`
--
ALTER TABLE `sessions_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `tarifs_frais_scolaires`
--
ALTER TABLE `tarifs_frais_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `titulaires_classes`
--
ALTER TABLE `titulaires_classes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `types_cours`
--
ALTER TABLE `types_cours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `types_evaluations`
--
ALTER TABLE `types_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `utilisateurs_permissions_securite`
--
ALTER TABLE `utilisateurs_permissions_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `utilisateurs_roles_securite`
--
ALTER TABLE `utilisateurs_roles_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `utilisateurs_securite`
--
ALTER TABLE `utilisateurs_securite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `versions_modeles_bulletins`
--
ALTER TABLE `versions_modeles_bulletins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `affectations_enseignants`
--
ALTER TABLE `affectations_enseignants`
  ADD CONSTRAINT `affectations_enseignants_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `affectations_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `affectations_utilisateurs_classes`
--
ALTER TABLE `affectations_utilisateurs_classes`
  ADD CONSTRAINT `fk_affectation_annee` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_affectation_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_affectation_matiere` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_affectation_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  ADD CONSTRAINT `annees_scolaires_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `classes_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON UPDATE CASCADE;

--
-- Contraintes pour la table `comptes_parents`
--
ALTER TABLE `comptes_parents`
  ADD CONSTRAINT `fk_compte_parent_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compte_parent_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `connexions_parents`
--
ALTER TABLE `connexions_parents`
  ADD CONSTRAINT `fk_connexion_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_connexion_parent_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `contrats_enseignants`
--
ALTER TABLE `contrats_enseignants`
  ADD CONSTRAINT `contrats_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `creneaux_horaires`
--
ALTER TABLE `creneaux_horaires`
  ADD CONSTRAINT `creneaux_horaires_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `crm_activites`
--
ALTER TABLE `crm_activites`
  ADD CONSTRAINT `fk_crm_activite_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_crm_activite_prospect` FOREIGN KEY (`prospect_id`) REFERENCES `crm_prospects` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `crm_prospects`
--
ALTER TABLE `crm_prospects`
  ADD CONSTRAINT `fk_crm_prospect_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `delegations_securite`
--
ALTER TABLE `delegations_securite`
  ADD CONSTRAINT `fk_delegation_cible` FOREIGN KEY (`utilisateur_cible_id`) REFERENCES `utilisateurs_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_delegation_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_delegation_role` FOREIGN KEY (`role_id`) REFERENCES `roles_securite` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_delegation_source` FOREIGN KEY (`utilisateur_source_id`) REFERENCES `utilisateurs_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `details_paiements_scolaires`
--
ALTER TABLE `details_paiements_scolaires`
  ADD CONSTRAINT `fk_detail_frais` FOREIGN KEY (`frais_id`) REFERENCES `frais_scolaires` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_paiement` FOREIGN KEY (`paiement_id`) REFERENCES `paiements_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_tarif` FOREIGN KEY (`tarif_id`) REFERENCES `tarifs_frais_scolaires` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `diplomes_enseignants`
--
ALTER TABLE `diplomes_enseignants`
  ADD CONSTRAINT `diplomes_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `documents_academiques`
--
ALTER TABLE `documents_academiques`
  ADD CONSTRAINT `documents_academiques_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_academiques_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_academiques_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_academiques_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_academiques_inscription_id_fkey` FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `documents_eleves`
--
ALTER TABLE `documents_eleves`
  ADD CONSTRAINT `documents_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `documents_enseignants`
--
ALTER TABLE `documents_enseignants`
  ADD CONSTRAINT `documents_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `documents_parents`
--
ALTER TABLE `documents_parents`
  ADD CONSTRAINT `fk_document_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_document_parent_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `eleves`
--
ALTER TABLE `eleves`
  ADD CONSTRAINT `eleves_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `enseignants`
--
ALTER TABLE `enseignants`
  ADD CONSTRAINT `enseignants_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `evaluations_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `evaluations_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `evaluations_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `evaluations_matiere_id_fkey` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `evaluations_periode_academique_id_fkey` FOREIGN KEY (`periode_academique_id`) REFERENCES `periodes_academiques` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `evaluations_salle_id_fkey` FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `evaluations_type_evaluation_id_fkey` FOREIGN KEY (`type_evaluation_id`) REFERENCES `types_evaluations` (`id`) ON UPDATE CASCADE;

--
-- Contraintes pour la table `evenements_calendrier`
--
ALTER TABLE `evenements_calendrier`
  ADD CONSTRAINT `evenements_calendrier_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `evenements_calendrier_ecoleId_fkey` FOREIGN KEY (`ecoleId`) REFERENCES `ecoles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  ADD CONSTRAINT `fk_frais_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `historiques_eleves`
--
ALTER TABLE `historiques_eleves`
  ADD CONSTRAINT `historiques_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `historiques_enseignants`
--
ALTER TABLE `historiques_enseignants`
  ADD CONSTRAINT `historiques_enseignants_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  ADD CONSTRAINT `inscriptions_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `inscriptions_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `inscriptions_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `journal_audit_securite`
--
ALTER TABLE `journal_audit_securite`
  ADD CONSTRAINT `fk_audit_securite_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_audit_securite_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_securite` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `journal_parents`
--
ALTER TABLE `journal_parents`
  ADD CONSTRAINT `fk_journal_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_journal_parent_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `jours_ouvrables`
--
ALTER TABLE `jours_ouvrables`
  ADD CONSTRAINT `jours_ouvrables_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `modeles_bulletins`
--
ALTER TABLE `modeles_bulletins`
  ADD CONSTRAINT `modeles_bulletins_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `modes_paiements_scolaires`
--
ALTER TABLE `modes_paiements_scolaires`
  ADD CONSTRAINT `fk_mode_paiement` FOREIGN KEY (`paiement_id`) REFERENCES `paiements_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `mouvements_caisse_scolaire`
--
ALTER TABLE `mouvements_caisse_scolaire`
  ADD CONSTRAINT `fk_mouvement_paiement` FOREIGN KEY (`paiement_id`) REFERENCES `paiements_scolaires` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mouvement_session` FOREIGN KEY (`session_caisse_id`) REFERENCES `sessions_caisse_scolaire` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `notes_evaluations`
--
ALTER TABLE `notes_evaluations`
  ADD CONSTRAINT `notes_evaluations_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notes_evaluations_evaluation_id_fkey` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `observations_eleves`
--
ALTER TABLE `observations_eleves`
  ADD CONSTRAINT `observations_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `paiements_scolaires`
--
ALTER TABLE `paiements_scolaires`
  ADD CONSTRAINT `fk_paiement_annee` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_paiement_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_paiement_inscription` FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_paiement_session_caisse` FOREIGN KEY (`session_caisse_id`) REFERENCES `sessions_caisse_scolaire` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `fk_parent_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `parents_eleves`
--
ALTER TABLE `parents_eleves`
  ADD CONSTRAINT `fk_parent_eleve_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_parent_eleve_eleve` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_parent_eleve_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `passages_rfid`
--
ALTER TABLE `passages_rfid`
  ADD CONSTRAINT `passages_rfid_carte_id_fkey` FOREIGN KEY (`carte_id`) REFERENCES `cartes_rfid` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `passages_rfid_lecteur_id_fkey` FOREIGN KEY (`lecteur_id`) REFERENCES `lecteurs_rfid` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `pauses_academiques`
--
ALTER TABLE `pauses_academiques`
  ADD CONSTRAINT `pauses_academiques_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `periodes_academiques`
--
ALTER TABLE `periodes_academiques`
  ADD CONSTRAINT `periodes_academiques_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `profils_permissions_securite`
--
ALTER TABLE `profils_permissions_securite`
  ADD CONSTRAINT `fk_profil_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_profil_permission_profil` FOREIGN KEY (`profil_id`) REFERENCES `profils_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `profils_securite`
--
ALTER TABLE `profils_securite`
  ADD CONSTRAINT `fk_profil_securite_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `recus_scolaires`
--
ALTER TABLE `recus_scolaires`
  ADD CONSTRAINT `fk_recu_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recu_paiement` FOREIGN KEY (`paiement_id`) REFERENCES `paiements_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `regles_academiques`
--
ALTER TABLE `regles_academiques`
  ADD CONSTRAINT `regles_academiques_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `regles_evaluations`
--
ALTER TABLE `regles_evaluations`
  ADD CONSTRAINT `regles_evaluations_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `responsables_eleves`
--
ALTER TABLE `responsables_eleves`
  ADD CONSTRAINT `responsables_eleves_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `responsables_eleves_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `roles_permissions_securite`
--
ALTER TABLE `roles_permissions_securite`
  ADD CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `roles_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `roles_securite`
--
ALTER TABLE `roles_securite`
  ADD CONSTRAINT `fk_role_securite_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `salles`
--
ALTER TABLE `salles`
  ADD CONSTRAINT `salles_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `seances_emploi_temps`
--
ALTER TABLE `seances_emploi_temps`
  ADD CONSTRAINT `seances_emploi_temps_annee_scolaire_id_fkey` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seances_emploi_temps_classe_id_fkey` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seances_emploi_temps_creneau_horaire_id_fkey` FOREIGN KEY (`creneau_horaire_id`) REFERENCES `creneaux_horaires` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `seances_emploi_temps_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seances_emploi_temps_enseignant_id_fkey` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `seances_emploi_temps_matiere_id_fkey` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `seances_emploi_temps_salle_id_fkey` FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `seances_emploi_temps_type_cours_id_fkey` FOREIGN KEY (`type_cours_id`) REFERENCES `types_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `sections_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `sessions_securite`
--
ALTER TABLE `sessions_securite`
  ADD CONSTRAINT `fk_session_securite_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_session_securite_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_securite` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `tarifs_frais_scolaires`
--
ALTER TABLE `tarifs_frais_scolaires`
  ADD CONSTRAINT `fk_tarif_annee` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tarif_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tarif_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tarif_frais` FOREIGN KEY (`frais_id`) REFERENCES `frais_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `types_cours`
--
ALTER TABLE `types_cours`
  ADD CONSTRAINT `types_cours_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `types_evaluations`
--
ALTER TABLE `types_evaluations`
  ADD CONSTRAINT `types_evaluations_ecole_id_fkey` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `utilisateurs_permissions_securite`
--
ALTER TABLE `utilisateurs_permissions_securite`
  ADD CONSTRAINT `fk_permission_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permission_utilisateur_annee` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permission_utilisateur_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permission_utilisateur_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permission_utilisateur_eleve` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permission_utilisateur_matiere` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permission_utilisateur_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_permission_utilisateur_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `utilisateurs_roles_securite`
--
ALTER TABLE `utilisateurs_roles_securite`
  ADD CONSTRAINT `fk_utilisateur_role_role` FOREIGN KEY (`role_id`) REFERENCES `roles_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_utilisateur_role_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_securite` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `utilisateurs_securite`
--
ALTER TABLE `utilisateurs_securite`
  ADD CONSTRAINT `fk_utilisateur_securite_ecole` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_utilisateur_securite_role` FOREIGN KEY (`role_id`) REFERENCES `roles_securite` (`id`) ON UPDATE CASCADE;

--
-- Contraintes pour la table `versions_modeles_bulletins`
--
ALTER TABLE `versions_modeles_bulletins`
  ADD CONSTRAINT `versions_modeles_bulletins_modele_bulletin_id_fkey` FOREIGN KEY (`modele_bulletin_id`) REFERENCES `modeles_bulletins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
