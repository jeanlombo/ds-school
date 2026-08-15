export type TypeSectionAcademique =
  | "PRIMAIRE"
  | "SECONDAIRE"
  | "HUMANITES"
  | "UNIVERSITE"
  | "INSTITUT_SUPERIEUR"
  | "AUTRE";

export type ModeAcademique = "scolaire" | "superieur";

export type TerminologieAcademique = {
  type: TypeSectionAcademique;
  mode: ModeAcademique;
  personne: string;
  personnes: string;
  personneMin: string;
  personnesMin: string;
  personneMaj: string;
  personnePluriel: string;
  personnePlurielMaj: string;
  apprenantMin: string;
  inscription: string;
  structurePrincipale: string;
  structurePrincipalePluriel: string;
  structureMaj: string;
  structurePluriel: string;
  structureNiveau2: string | null;
  structureNiveau3: string | null;
  sectionMaj: string;
  annee: string;
  anneeScolaire: string;
  periodeMaj: string;
  documentResultat: string;
  documentResultatPluriel: string;
  documentResultats: string;
  carte: string;
  dossier: string;
  responsable: string;
  responsables: string;
  enseignant: string;
  enseignants: string;
  cours: string;
  coursMaj: string;
  masculin: string;
  feminin: string;
};

function normaliser(v?: string | null) {
  return (v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[-/]+/g, "_")
    .replace(/\s+/g, "_");
}

export function detecterTypeSection(
  nom?: string | null,
  code?: string | null,
): TypeSectionAcademique {
  const v = `${normaliser(nom)} ${normaliser(code)}`;
  if (v.includes("UNIVERSITE") || v.includes("UNIV") || v.includes("FACULTE")) return "UNIVERSITE";
  if (v.includes("INSTITUT_SUPERIEUR") || v.includes("SUPERIEUR") || v.includes("IST") || v.includes("ISP") || v.includes("ISC") || v.includes("ISIG")) return "INSTITUT_SUPERIEUR";
  if (v.includes("HUMANITE") || v.includes("HUM")) return "HUMANITES";
  if (v.includes("SECONDAIRE") || v.includes("SECOND") || v.includes("SEC")) return "SECONDAIRE";
  if (v.includes("PRIMAIRE") || v.includes("PRIM")) return "PRIMAIRE";
  return "AUTRE";
}

function creerTerminologie(type: TypeSectionAcademique): TerminologieAcademique {
  const superieur = type === "UNIVERSITE" || type === "INSTITUT_SUPERIEUR";
  const humanites = type === "HUMANITES" || type === "SECONDAIRE";

  if (superieur) {
    const universite = type === "UNIVERSITE";
    return {
      type,
      mode: "superieur",
      personne: "Étudiant",
      personnes: "Étudiants",
      personneMin: "étudiant",
      personnesMin: "étudiants",
      personneMaj: "Étudiant",
      personnePluriel: "étudiants",
      personnePlurielMaj: "Étudiants",
      apprenantMin: "étudiant",
      inscription: "Inscription académique",
      structurePrincipale: "Promotion",
      structurePrincipalePluriel: "Promotions",
      structureMaj: "Promotion",
      structurePluriel: "Promotions",
      structureNiveau2: universite ? "Département" : "Département",
      structureNiveau3: "Promotion",
      sectionMaj: universite ? "Faculté / Département" : "Section / Département",
      annee: "Année académique",
      anneeScolaire: "Année académique",
      periodeMaj: "Année académique",
      documentResultat: "Relevé de notes",
      documentResultatPluriel: "Relevés de notes",
      documentResultats: "Relevé de notes",
      carte: "Carte d’étudiant",
      dossier: "dossier étudiant",
      responsable: "Personne de contact",
      responsables: "Personnes de contact",
      enseignant: "Enseignant / Professeur",
      enseignants: "Enseignants / Professeurs",
      cours: "cours / UE",
      coursMaj: "Cours / UE",
      masculin: "Étudiant",
      feminin: "Étudiante",
    };
  }

  return {
    type,
    mode: "scolaire",
    personne: "Élève",
    personnes: "Élèves",
    personneMin: "élève",
    personnesMin: "élèves",
    personneMaj: "Élève",
    personnePluriel: "élèves",
    personnePlurielMaj: "Élèves",
    apprenantMin: "élève",
    inscription: "Inscription scolaire",
    structurePrincipale: "Classe",
    structurePrincipalePluriel: "Classes",
    structureMaj: "Classe",
    structurePluriel: "Classes",
    structureNiveau2: humanites ? "Option" : null,
    structureNiveau3: null,
    sectionMaj: humanites ? "Section / Option" : "Section",
    annee: "Année scolaire",
    anneeScolaire: "Année scolaire",
    periodeMaj: "Année scolaire",
    documentResultat: "Bulletin",
    documentResultatPluriel: "Bulletins",
    documentResultats: "Bulletin",
    carte: "Carte d’élève",
    dossier: "dossier élève",
    responsable: "Parent / Tuteur",
    responsables: "Parents / Tuteurs",
    enseignant: "Enseignant",
    enseignants: "Enseignants",
    cours: "matière",
    coursMaj: "Matière",
    masculin: "Élève",
    feminin: "Élève",
  };
}

export function terminologieSection(nom?: string | null, code?: string | null) {
  return creerTerminologie(detecterTypeSection(nom, code));
}

export function estSuperieur(nom?: string | null, code?: string | null) {
  return terminologieSection(nom, code).mode === "superieur";
}

export function terminologieNeutre() {
  return {
    personne: "Apprenant",
    personnes: "Apprenants",
    personneMin: "apprenant",
    personnesMin: "apprenants",
    personneMaj: "Apprenant",
    personnePluriel: "apprenants",
    personnePlurielMaj: "Apprenants",
    structureMaj: "Classe / Promotion",
    structurePluriel: "Classes / Promotions",
    annee: "Année scolaire / académique",
    periodeMaj: "Année scolaire / académique",
    inscription: "Inscription",
    documentResultat: "Bulletin / Relevé de notes",
    documentResultats: "Bulletin / Relevé de notes",
    carte: "Carte d’identification",
    coursMaj: "Matière / Cours",
    responsables: "Parents / Contacts",
  };
}

export const TERMINOLOGIE_MIXTE = terminologieNeutre();
