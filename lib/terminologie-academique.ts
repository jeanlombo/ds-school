export type TerminologieAcademique = {
  type: "scolaire" | "superieur";
  personne: string;
  personneMaj: string;
  masculin: string;
  feminin: string;
  dossier: string;
  carte: string;
  structure: string;
  structureMaj: string;
  periode: string;
  periodeMaj: string;
  responsables: string;
  provenance: string;
};

function normaliser(valeur?: string | null) {
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
  const texte = `${normaliser(sectionNom)} ${normaliser(typeEtablissement)}`;

  return [
    "universite",
    "universitaire",
    "institut superieur",
    "enseignement superieur",
    "superieur",
    "faculte",
    "haute ecole",
  ].some((mot) => texte.includes(mot));
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
      masculin: "Étudiant",
      feminin: "Étudiante",
      dossier: "dossier étudiant",
      carte: "Carte d’étudiant",
      structure: "promotion",
      structureMaj: "Promotion",
      periode: "année académique",
      periodeMaj: "Année académique",
      responsables: "Contacts / personnes de référence",
      provenance: "Établissement de provenance",
    };
  }

  return {
    type: "scolaire",
    personne: "élève",
    personneMaj: "Élève",
    masculin: "Élève",
    feminin: "Élève",
    dossier: "dossier élève",
    carte: "Carte d’élève",
    structure: "classe",
    structureMaj: "Classe",
    periode: "année scolaire",
    periodeMaj: "Année scolaire",
    responsables: "Parents et tuteur",
    provenance: "École de provenance",
  };
}

export function terminologieNeutre() {
  return {
    personne: "apprenant",
    personneMaj: "Apprenant",
    structure: "classe / promotion",
    periode: "année scolaire / académique",
    provenance: "établissement de provenance",
  };
}
