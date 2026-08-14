export type TypeAcademique = "scolaire" | "superieur";

export type CycleAcademique =
  | "maternelle"
  | "primaire"
  | "secondaire"
  | "humanites"
  | "universite"
  | "institut_superieur"
  | "autre";

export type TerminologieAcademique = {
  type: TypeAcademique;
  cycle: CycleAcademique;

  personne: string;
  personneMaj: string;
  personnePluriel: string;
  personnePlurielMaj: string;
  masculin: string;
  feminin: string;

  dossier: string;
  carte: string;

  structure: string;
  structureMaj: string;
  structurePluriel: string;

  periode: string;
  periodeMaj: string;

  responsables: string;
  provenance: string;
  documentResultats: string;

  cours: string;
  coursMaj: string;

  etablissement: string;
  etablissementMaj: string;

  section: string;
  sectionMaj: string;
};

export function normaliserAcademique(valeur?: string | null) {
  return (valeur || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function contientUnMot(valeur: string, mots: string[]) {
  return mots.some((mot) => valeur.includes(mot));
}

export function detecterCycleAcademique(
  sectionNom?: string | null,
  typeEtablissement?: string | null
): CycleAcademique {
  const section = normaliserAcademique(sectionNom);
  const type = normaliserAcademique(typeEtablissement);
  const source = `${type} ${section}`.trim();

  if (
    contientUnMot(source, [
      "institut superieur",
      "institut supérieur",
      "isp",
      "isc",
      "ista",
      "ispt",
      "isam",
      "haute ecole",
      "haute école",
    ])
  ) {
    return "institut_superieur";
  }

  if (
    contientUnMot(source, [
      "universite",
      "université",
      "universitaire",
      "faculte",
      "faculté",
      "licence",
      "master",
      "doctorat",
      "lmd",
    ])
  ) {
    return "universite";
  }

  if (
    contientUnMot(source, [
      "humanite",
      "humanité",
      "humanites",
      "humanités",
      "scientifique",
      "commerciale",
      "litteraire",
      "littéraire",
      "pedagogie",
      "pédagogie",
      "technique",
    ])
  ) {
    return "humanites";
  }

  if (
    contientUnMot(source, [
      "secondaire",
      "cycle d'orientation",
      "cycle dorientation",
      "college",
      "collège",
    ])
  ) {
    return "secondaire";
  }

  if (contientUnMot(source, ["primaire", "elementaire", "élémentaire"])) {
    return "primaire";
  }

  if (contientUnMot(source, ["maternelle", "prescolaire", "préscolaire"])) {
    return "maternelle";
  }

  return "autre";
}

export function estEnseignementSuperieur(
  sectionNom?: string | null,
  typeEtablissement?: string | null
) {
  const cycle = detecterCycleAcademique(sectionNom, typeEtablissement);
  return cycle === "universite" || cycle === "institut_superieur";
}

function terminologieScolaire(cycle: CycleAcademique): TerminologieAcademique {
  return {
    type: "scolaire",
    cycle,

    personne: "élève",
    personneMaj: "Élève",
    personnePluriel: "élèves",
    personnePlurielMaj: "Élèves",
    masculin: "Élève",
    feminin: "Élève",

    dossier: "dossier élève",
    carte: "Carte d’élève",

    structure: "classe",
    structureMaj: "Classe",
    structurePluriel: "classes",

    periode: "année scolaire",
    periodeMaj: "Année scolaire",

    responsables: "Parents et tuteur",
    provenance: "École de provenance",
    documentResultats: "Bulletin",

    cours: "matière",
    coursMaj: "Matière",

    etablissement: "établissement scolaire",
    etablissementMaj: "Établissement scolaire",

    section: "section",
    sectionMaj: "Section",
  };
}

function terminologieSuperieure(cycle: CycleAcademique): TerminologieAcademique {
  const institut = cycle === "institut_superieur";

  return {
    type: "superieur",
    cycle,

    personne: "étudiant",
    personneMaj: "Étudiant",
    personnePluriel: "étudiants",
    personnePlurielMaj: "Étudiants",
    masculin: "Étudiant",
    feminin: "Étudiante",

    dossier: "dossier étudiant",
    carte: "Carte d’étudiant",

    structure: "promotion",
    structureMaj: "Promotion",
    structurePluriel: "promotions",

    periode: "année académique",
    periodeMaj: "Année académique",

    responsables: "Contacts / personnes de référence",
    provenance: "Établissement de provenance",
    documentResultats: "Relevé de notes",

    cours: "unité d’enseignement",
    coursMaj: "Unité d’enseignement",

    etablissement: institut ? "institut supérieur" : "université",
    etablissementMaj: institut ? "Institut supérieur" : "Université",

    section: institut ? "filière / département" : "faculté / département",
    sectionMaj: institut ? "Filière / Département" : "Faculté / Département",
  };
}

export function terminologieSection(
  sectionNom?: string | null,
  typeEtablissement?: string | null
): TerminologieAcademique {
  const cycle = detecterCycleAcademique(sectionNom, typeEtablissement);

  if (cycle === "universite" || cycle === "institut_superieur") {
    return terminologieSuperieure(cycle);
  }

  return terminologieScolaire(cycle);
}

/**
 * Terminologie neutre à utiliser dans les pages qui mélangent plusieurs cycles
 * (Primaire + Secondaire + Université, par exemple).
 */
export function terminologieNeutre() {
  return {
    personne: "apprenant",
    personneMaj: "Apprenant",
    personnePluriel: "apprenants",
    personnePlurielMaj: "Apprenants",

    structure: "classe / promotion",
    structureMaj: "Classe / Promotion",

    periode: "année scolaire / académique",
    periodeMaj: "Année scolaire / académique",

    provenance: "établissement de provenance",
    documentResultats: "bulletin / relevé de notes",

    etablissement: "établissement",
    etablissementMaj: "Établissement",

    section: "section / faculté / filière",
    sectionMaj: "Section / Faculté / Filière",
  };
}

/**
 * Petit helper pratique pour les tableaux, cartes et documents.
 * Exemple :
 *   const t = terminologiePourNomSection(classe.section.nom)
 *   t.personneMaj => "Élève" ou "Étudiant"
 */
export const terminologiePourNomSection = terminologieSection;
