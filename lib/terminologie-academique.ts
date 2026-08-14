export type TypeAcademique = "scolaire" | "superieur";

export type TerminologieAcademique = {
  type: TypeAcademique;
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
};

export function normaliserAcademique(valeur?: string | null) {
  return (valeur || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function estEnseignementSuperieur(
  sectionNom?: string | null,
  typeEtablissement?: string | null
) {
  const section = normaliserAcademique(sectionNom);
  const type = normaliserAcademique(typeEtablissement);

  // En établissement MIXTE, c'est la section/structure choisie qui décide.
  if (type === "mixte" && section) {
    return [
      "universite",
      "universitaire",
      "institut superieur",
      "enseignement superieur",
      "faculte",
      "haute ecole",
    ].some((mot) => section.includes(mot));
  }

  // Pour une université/IS autonome, tout le dossier est supérieur.
  if (
    ["universite", "universitaire", "institut superieur", "enseignement superieur"]
      .some((mot) => type.includes(mot))
  ) {
    return true;
  }

  return [
    "universite",
    "universitaire",
    "institut superieur",
    "enseignement superieur",
    "faculte",
    "haute ecole",
  ].some((mot) => section.includes(mot));
}

export function terminologieSection(
  sectionNom?: string | null,
  typeEtablissement?: string | null
): TerminologieAcademique {
  if (estEnseignementSuperieur(sectionNom, typeEtablissement)) {
    return {
      type: "superieur",
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
      cours: "cours",
      coursMaj: "Cours",
    };
  }

  return {
    type: "scolaire",
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
  };
}

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
  };
}
