export type TypeEtablissement =
  | "PRIMAIRE"
  | "SECONDAIRE"
  | "UNIVERSITE"
  | "MIXTE"
  | string;

export type TerminologieAcademique = {
  personne: string;
  personnePluriel: string;
  personneMaj: string;
  personnePlurielMaj: string;
  masculin: string;
  feminin: string;
  structure: string;
  structureMaj: string;
  periode: string;
  periodeMaj: string;
  carte: string;
  frais: string;
  dossier: string;
};

const scolaire: TerminologieAcademique = {
  personne: "élève",
  personnePluriel: "élèves",
  personneMaj: "Élève",
  personnePlurielMaj: "Élèves",
  masculin: "Garçon",
  feminin: "Fille",
  structure: "classe",
  structureMaj: "Classe",
  periode: "année scolaire",
  periodeMaj: "Année scolaire",
  carte: "carte scolaire",
  frais: "frais scolaires",
  dossier: "dossier scolaire",
};

const universitaire: TerminologieAcademique = {
  personne: "étudiant",
  personnePluriel: "étudiants",
  personneMaj: "Étudiant",
  personnePlurielMaj: "Étudiants",
  masculin: "Étudiant",
  feminin: "Étudiante",
  structure: "promotion",
  structureMaj: "Promotion",
  periode: "année académique",
  periodeMaj: "Année académique",
  carte: "carte d’étudiant",
  frais: "frais académiques",
  dossier: "dossier académique",
};

const mixte: TerminologieAcademique = {
  personne: "apprenant",
  personnePluriel: "apprenants",
  personneMaj: "Apprenant",
  personnePlurielMaj: "Apprenants",
  masculin: "Masculin",
  feminin: "Féminin",
  structure: "classe / promotion",
  structureMaj: "Classe / promotion",
  periode: "année scolaire / académique",
  periodeMaj: "Année scolaire / académique",
  carte: "carte d’apprenant",
  frais: "frais scolaires / académiques",
  dossier: "dossier académique",
};

export function terminologieEtablissement(
  typeEtablissement?: TypeEtablissement | null,
): TerminologieAcademique {
  const type = String(typeEtablissement || "SECONDAIRE").toUpperCase();

  if (type === "UNIVERSITE") return universitaire;
  if (type === "MIXTE") return mixte;
  return scolaire;
}

export function sectionEstUniversitaire(section?: string | null): boolean {
  const valeur = String(section || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  return [
    "UNIVERSITE",
    "UNIVERSITAIRE",
    "INSTITUT SUPERIEUR",
    "SUPERIEUR",
    "FACULTE",
    "LMD",
  ].some((mot) => valeur.includes(mot));
}

export function terminologieSection(
  section?: string | null,
  typeEtablissement?: TypeEtablissement | null,
): TerminologieAcademique {
  if (sectionEstUniversitaire(section)) return universitaire;

  const type = String(typeEtablissement || "").toUpperCase();
  if (type === "UNIVERSITE") return universitaire;

  return scolaire;
}
