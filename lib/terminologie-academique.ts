export type TypeEtablissement =
  | "PRIMAIRE"
  | "SECONDAIRE"
  | "UNIVERSITE"
  | "INSTITUT_SUPERIEUR"
  | "MIXTE"
  | string;

export type TerminologieAcademique = {
  masculin: string;
  feminin: string;
  personne: string;
  personnePluriel: string;
  structure: string;
  structurePluriel: string;
  periode: string;
  carte: string;
  documentResultats: string;
};

function normaliser(valeur?: string | null): string {
  return (valeur ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function typeAcademiqueSection(
  sectionNom?: string | null,
  typeEtablissement?: TypeEtablissement | null
): "SCOLAIRE" | "SUPERIEUR" {
  const section = normaliser(sectionNom);
  const type = normaliser(typeEtablissement);

  const superieur =
    section.includes("UNIVERS") ||
    section.includes("INSTITUT SUPER") ||
    section.includes("SUPERIEUR") ||
    section.includes("FACULTE") ||
    type === "UNIVERSITE" ||
    type === "INSTITUT_SUPERIEUR";

  // Dans une structure MIXTE, la section de l'inscription reste prioritaire.
  if (type === "MIXTE" && section) {
    return superieur ? "SUPERIEUR" : "SCOLAIRE";
  }

  return superieur ? "SUPERIEUR" : "SCOLAIRE";
}

export function terminologieSection(
  sectionNom?: string | null,
  typeEtablissement?: TypeEtablissement | null
): TerminologieAcademique {
  if (typeAcademiqueSection(sectionNom, typeEtablissement) === "SUPERIEUR") {
    return {
      masculin: "Étudiant",
      feminin: "Étudiante",
      personne: "Étudiant",
      personnePluriel: "étudiants",
      structure: "Promotion",
      structurePluriel: "Promotions",
      periode: "Année académique",
      carte: "Carte d’étudiant",
      documentResultats: "Relevé de notes",
    };
  }

  return {
    masculin: "Élève",
    feminin: "Élève",
    personne: "Élève",
    personnePluriel: "élèves",
    structure: "Classe",
    structurePluriel: "Classes",
    periode: "Année scolaire",
    carte: "Carte d’élève",
    documentResultats: "Bulletin",
  };
}

export function libelleApprenantGlobal(typeEtablissement?: TypeEtablissement | null) {
  const type = normaliser(typeEtablissement);
  if (type === "UNIVERSITE" || type === "INSTITUT_SUPERIEUR") {
    return { singulier: "Étudiant", pluriel: "Étudiants" };
  }
  if (type === "PRIMAIRE" || type === "SECONDAIRE") {
    return { singulier: "Élève", pluriel: "Élèves" };
  }
  return { singulier: "Apprenant", pluriel: "Apprenants" };
}
