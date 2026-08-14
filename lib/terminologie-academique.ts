export type TypeEtablissement = "PRIMAIRE" | "SECONDAIRE" | "UNIVERSITE" | "MIXTE" | string;

export type TerminologieAcademique = {
  type: "scolaire" | "superieur";
  personne: string;
  personneMaj: string;
  personnes: string;
  personnePluriel: string;
  masculin: string;
  feminin: string;
  structure: string;
  structureMaj: string;
  structures: string;
  periode: string;
  periodeMaj: string;
  annee: string;
  inscription: string;
  carte: string;
  dossier: string;
  responsables: string;
  frais: string;
  provenance: string;
};

const SCOLAIRE: TerminologieAcademique = {
  type: "scolaire",
  personne: "élève",
  personneMaj: "Élève",
  personnes: "élèves",
  personnePluriel: "élèves",
  masculin: "Élève",
  feminin: "Élève",
  structure: "classe",
  structureMaj: "Classe",
  structures: "classes",
  periode: "année scolaire",
  periodeMaj: "Année scolaire",
  annee: "Année scolaire",
  inscription: "Inscription scolaire",
  carte: "Carte d’élève",
  dossier: "dossier scolaire",
  responsables: "Parents / Responsables",
  frais: "Frais scolaires",
  provenance: "école / établissement de provenance",
};

const SUPERIEUR: TerminologieAcademique = {
  type: "superieur",
  personne: "étudiant",
  personneMaj: "Étudiant",
  personnes: "étudiants",
  personnePluriel: "étudiants",
  masculin: "Étudiant",
  feminin: "Étudiante",
  structure: "promotion",
  structureMaj: "Promotion",
  structures: "promotions",
  periode: "année académique",
  periodeMaj: "Année académique",
  annee: "Année académique",
  inscription: "Inscription académique",
  carte: "Carte d’étudiant",
  dossier: "dossier académique",
  responsables: "Contacts / Responsables",
  frais: "Frais académiques",
  provenance: "établissement / université de provenance",
};

function normaliser(v?: string | null) {
  return (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function estSectionSuperieure(
  section?: { nom?: string | null; code?: string | null } | string | null,
  typeEtablissement?: TypeEtablissement | null,
) {
  const brut = typeof section === "string"
    ? section
    : `${section?.nom || ""} ${section?.code || ""}`;
  const v = normaliser(brut);
  const type = normaliser(typeEtablissement);

  if (type === "universite") return true;

  return [
    "universite",
    "universitaire",
    "institut superieur",
    "enseignement superieur",
    "faculte",
    "licence",
    "master",
    "doctorat",
    "graduat",
    "lmd",
  ].some((mot) => v.includes(normaliser(mot)));
}

export function terminologieSection(
  section?: { nom?: string | null; code?: string | null } | string | null,
  typeEtablissement?: TypeEtablissement | null,
): TerminologieAcademique {
  return estSectionSuperieure(section, typeEtablissement) ? SUPERIEUR : SCOLAIRE;
}

export function terminologieClasse(
  classe?: { section?: { nom?: string | null; code?: string | null } | null } | null,
  typeEtablissement?: TypeEtablissement | null,
) {
  return terminologieSection(classe?.section, typeEtablissement);
}

export const terminologieGlobale = {
  personne: "apprenant",
  personneMaj: "Apprenant",
  personnes: "apprenants",
  personnePluriel: "apprenants",
  structure: "classe / promotion",
  structureMaj: "Classe / Promotion",
  structures: "classes / promotions",
  periode: "année scolaire / académique",
  periodeMaj: "Année scolaire / académique",
  inscription: "Inscription",
  dossier: "dossier apprenant",
  carte: "Carte d’identification",
  responsables: "Responsables / Contacts",
  frais: "Frais",
};
