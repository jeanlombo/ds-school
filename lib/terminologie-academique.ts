export type TerminologieAcademique = {
  universite: boolean;
  personne: string;
  personneMaj: string;
  personnePluriel: string;
  personnePlurielMaj: string;
  masculin: string;
  feminin: string;
  structure: string;
  structureMaj: string;
  periode: string;
  periodeMaj: string;
  dossier: string;
  carte: string;
  etablissement: string;
  responsables: string;
};

function normaliser(valeur?: string | null) {
  return (valeur || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function sectionEstSuperieure(sectionNom?: string | null): boolean {
  const s = normaliser(sectionNom);
  return [
    "universite",
    "universitaire",
    "institut superieur",
    "institut supérieur",
    "enseignement superieur",
    "enseignement supérieur",
    "faculte",
    "faculté",
    "licence",
    "master",
    "doctorat",
    "graduat",
  ].some((mot) => s.includes(normaliser(mot)));
}

export function terminologieSection(
  sectionNom?: string | null,
  typeEtablissement?: string | null
): TerminologieAcademique {
  const superieur =
    sectionEstSuperieure(sectionNom) ||
    (!sectionNom && sectionEstSuperieure(typeEtablissement));

  if (superieur) {
    return {
      universite: true,
      personne: "étudiant",
      personneMaj: "Étudiant",
      personnePluriel: "étudiants",
      personnePlurielMaj: "Étudiants",
      masculin: "Étudiant",
      feminin: "Étudiante",
      structure: "promotion",
      structureMaj: "Promotion",
      periode: "année académique",
      periodeMaj: "Année académique",
      dossier: "dossier étudiant",
      carte: "Carte d’étudiant",
      etablissement: "établissement d’enseignement supérieur",
      responsables: "Personne de contact / responsable",
    };
  }

  return {
    universite: false,
    personne: "élève",
    personneMaj: "Élève",
    personnePluriel: "élèves",
    personnePlurielMaj: "Élèves",
    masculin: "Garçon",
    feminin: "Fille",
    structure: "classe",
    structureMaj: "Classe",
    periode: "année scolaire",
    periodeMaj: "Année scolaire",
    dossier: "dossier scolaire",
    carte: "Carte scolaire",
    etablissement: "école",
    responsables: "Parents et tuteur",
  };
}

export function terminologieEtablissement(typeEtablissement?: string | null) {
  return terminologieSection(null, typeEtablissement);
}
