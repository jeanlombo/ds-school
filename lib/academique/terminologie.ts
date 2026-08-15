/**
 * DS School Enterprise
 * Terminologie académique centralisée selon la section / le type d'établissement.
 */

export type TypeStructureAcademique =
  | "PRIMAIRE"
  | "SECONDAIRE"
  | "HUMANITES"
  | "UNIVERSITE"
  | "INSTITUT_SUPERIEUR"
  | "AUTRE";

export type ProfilAcademique = {
  type: TypeStructureAcademique;
  apprenantSingulier: string;
  apprenantPluriel: string;
  inscriptionSingulier: string;
  inscriptionPluriel: string;
  groupeSingulier: string;
  groupePluriel: string;
  sousStructureSingulier: string | null;
  sousStructurePluriel: string | null;
  enseignementSingulier: string;
  enseignementPluriel: string;
  periodeSingulier: string;
  periodePluriel: string;
  carteTitre: string;
  ficheInscriptionTitre: string;
  documentResultatsTitre: string;
  responsableSingulier: string;
  responsablePluriel: string;
  libelleNiveau: string;
};

function nettoyer(value?: string | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function detecterTypeAcademique(
  sectionNom?: string | null,
  sectionCode?: string | null,
): TypeStructureAcademique {
  const source = `${nettoyer(sectionNom)} ${nettoyer(sectionCode)}`;

  if (
    source.includes("INSTITUT SUPERIEUR") ||
    source.includes("INSTITUT SUP") ||
    source.includes("INSTITUT") ||
    source.includes("ISP") ||
    source.includes("ISPT") ||
    source.includes("IST")
  ) return "INSTITUT_SUPERIEUR";

  if (
    source.includes("UNIVERSITE") ||
    source.includes("UNIV") ||
    source.includes("FACULTE")
  ) return "UNIVERSITE";

  if (
    source.includes("HUMANITE") ||
    source.includes("HUMANITES") ||
    source.includes("OPTION")
  ) return "HUMANITES";

  if (
    source.includes("SECONDAIRE") ||
    source.includes("SECOND") ||
    source.includes("SEC")
  ) return "SECONDAIRE";

  if (
    source.includes("PRIMAIRE") ||
    source.includes("PRIM") ||
    source.includes("ECOLE PRIMAIRE")
  ) return "PRIMAIRE";

  return "AUTRE";
}

const PROFILS: Record<TypeStructureAcademique, ProfilAcademique> = {
  PRIMAIRE: {
    type: "PRIMAIRE",
    apprenantSingulier: "Élève",
    apprenantPluriel: "Élèves",
    inscriptionSingulier: "Inscription",
    inscriptionPluriel: "Inscriptions",
    groupeSingulier: "Classe",
    groupePluriel: "Classes",
    sousStructureSingulier: null,
    sousStructurePluriel: null,
    enseignementSingulier: "Matière",
    enseignementPluriel: "Matières",
    periodeSingulier: "Période",
    periodePluriel: "Périodes",
    carteTitre: "CARTE D'ÉLÈVE",
    ficheInscriptionTitre: "FICHE D'INSCRIPTION ÉLÈVE",
    documentResultatsTitre: "BULLETIN SCOLAIRE",
    responsableSingulier: "Parent / Tuteur",
    responsablePluriel: "Parents / Tuteurs",
    libelleNiveau: "Année / Niveau",
  },
  SECONDAIRE: {
    type: "SECONDAIRE",
    apprenantSingulier: "Élève",
    apprenantPluriel: "Élèves",
    inscriptionSingulier: "Inscription",
    inscriptionPluriel: "Inscriptions",
    groupeSingulier: "Classe",
    groupePluriel: "Classes",
    sousStructureSingulier: null,
    sousStructurePluriel: null,
    enseignementSingulier: "Matière",
    enseignementPluriel: "Matières",
    periodeSingulier: "Période",
    periodePluriel: "Périodes",
    carteTitre: "CARTE D'ÉLÈVE",
    ficheInscriptionTitre: "FICHE D'INSCRIPTION ÉLÈVE",
    documentResultatsTitre: "BULLETIN SCOLAIRE",
    responsableSingulier: "Parent / Tuteur",
    responsablePluriel: "Parents / Tuteurs",
    libelleNiveau: "Année / Niveau",
  },
  HUMANITES: {
    type: "HUMANITES",
    apprenantSingulier: "Élève",
    apprenantPluriel: "Élèves",
    inscriptionSingulier: "Inscription",
    inscriptionPluriel: "Inscriptions",
    groupeSingulier: "Classe",
    groupePluriel: "Classes",
    sousStructureSingulier: "Option",
    sousStructurePluriel: "Options",
    enseignementSingulier: "Matière",
    enseignementPluriel: "Matières",
    periodeSingulier: "Période",
    periodePluriel: "Périodes",
    carteTitre: "CARTE D'ÉLÈVE",
    ficheInscriptionTitre: "FICHE D'INSCRIPTION ÉLÈVE",
    documentResultatsTitre: "BULLETIN SCOLAIRE",
    responsableSingulier: "Parent / Tuteur",
    responsablePluriel: "Parents / Tuteurs",
    libelleNiveau: "Année / Niveau",
  },
  UNIVERSITE: {
    type: "UNIVERSITE",
    apprenantSingulier: "Étudiant",
    apprenantPluriel: "Étudiants",
    inscriptionSingulier: "Inscription académique",
    inscriptionPluriel: "Inscriptions académiques",
    groupeSingulier: "Promotion",
    groupePluriel: "Promotions",
    sousStructureSingulier: "Faculté / Département",
    sousStructurePluriel: "Facultés / Départements",
    enseignementSingulier: "Cours / UE",
    enseignementPluriel: "Cours / UE",
    periodeSingulier: "Semestre",
    periodePluriel: "Semestres",
    carteTitre: "CARTE D'ÉTUDIANT",
    ficheInscriptionTitre: "FICHE D'INSCRIPTION ÉTUDIANT",
    documentResultatsTitre: "RELEVÉ DE NOTES",
    responsableSingulier: "Personne de contact",
    responsablePluriel: "Personnes de contact",
    libelleNiveau: "Promotion / Niveau",
  },
  INSTITUT_SUPERIEUR: {
    type: "INSTITUT_SUPERIEUR",
    apprenantSingulier: "Étudiant",
    apprenantPluriel: "Étudiants",
    inscriptionSingulier: "Inscription académique",
    inscriptionPluriel: "Inscriptions académiques",
    groupeSingulier: "Promotion",
    groupePluriel: "Promotions",
    sousStructureSingulier: "Section / Département",
    sousStructurePluriel: "Sections / Départements",
    enseignementSingulier: "Cours / UE",
    enseignementPluriel: "Cours / UE",
    periodeSingulier: "Semestre",
    periodePluriel: "Semestres",
    carteTitre: "CARTE D'ÉTUDIANT",
    ficheInscriptionTitre: "FICHE D'INSCRIPTION ÉTUDIANT",
    documentResultatsTitre: "RELEVÉ DE NOTES",
    responsableSingulier: "Personne de contact",
    responsablePluriel: "Personnes de contact",
    libelleNiveau: "Promotion / Niveau",
  },
  AUTRE: {
    type: "AUTRE",
    apprenantSingulier: "Apprenant",
    apprenantPluriel: "Apprenants",
    inscriptionSingulier: "Inscription",
    inscriptionPluriel: "Inscriptions",
    groupeSingulier: "Groupe académique",
    groupePluriel: "Groupes académiques",
    sousStructureSingulier: "Structure",
    sousStructurePluriel: "Structures",
    enseignementSingulier: "Cours / Matière",
    enseignementPluriel: "Cours / Matières",
    periodeSingulier: "Période académique",
    periodePluriel: "Périodes académiques",
    carteTitre: "CARTE D'APPRENANT",
    ficheInscriptionTitre: "FICHE D'INSCRIPTION",
    documentResultatsTitre: "RELEVÉ ACADÉMIQUE",
    responsableSingulier: "Responsable / Contact",
    responsablePluriel: "Responsables / Contacts",
    libelleNiveau: "Niveau",
  },
};

export function obtenirProfilAcademique(
  sectionNom?: string | null,
  sectionCode?: string | null,
): ProfilAcademique {
  return PROFILS[detecterTypeAcademique(sectionNom, sectionCode)];
}

export function estEnseignementSuperieur(
  sectionNom?: string | null,
  sectionCode?: string | null,
): boolean {
  const type = detecterTypeAcademique(sectionNom, sectionCode);
  return type === "UNIVERSITE" || type === "INSTITUT_SUPERIEUR";
}

export function libelleApprenant(
  sectionNom?: string | null,
  sectionCode?: string | null,
  pluriel = false,
): string {
  const profil = obtenirProfilAcademique(sectionNom, sectionCode);
  return pluriel ? profil.apprenantPluriel : profil.apprenantSingulier;
}

export function titreCarteApprenant(
  sectionNom?: string | null,
  sectionCode?: string | null,
): string {
  return obtenirProfilAcademique(sectionNom, sectionCode).carteTitre;
}

export function titreDocumentResultats(
  sectionNom?: string | null,
  sectionCode?: string | null,
): string {
  return obtenirProfilAcademique(sectionNom, sectionCode).documentResultatsTitre;
}
