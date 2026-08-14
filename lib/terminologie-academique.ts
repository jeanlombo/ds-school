/**
 * Terminologie académique dynamique de DS School.
 *
 * Important :
 * - les noms techniques Prisma/routes restent "eleve", "classe", etc. pour ne pas casser la base ;
 * - l'interface adapte uniquement les libellés visibles selon la section.
 */

export type TerminologieAcademique = {
  personne: string;
  personneMaj: string;
  masculin: string;
  feminin: string;
  personnes: string;
  personnesMaj: string;
  structure: string;
  structureMaj: string;
  periode: string;
  periodeMaj: string;
  carte: string;
  dossier: string;
  responsables: string;
  inscription: string;
};

function normaliser(valeur?: string | null) {
  return (valeur || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function terminologieSection(
  section?: string | null,
  typeEtablissement?: string | null
): TerminologieAcademique {
  const contexte = `${normaliser(section)} ${normaliser(typeEtablissement)}`;

  const superieur =
    contexte.includes("universit") ||
    contexte.includes("superieur") ||
    contexte.includes("institut") ||
    contexte.includes("faculte") ||
    contexte.includes("haute ecole");

  if (superieur) {
    return {
      personne: "étudiant",
      personneMaj: "Étudiant",
      masculin: "Étudiant",
      feminin: "Étudiante",
      personnes: "étudiants",
      personnesMaj: "Étudiants",
      structure: "promotion",
      structureMaj: "Promotion",
      periode: "année académique",
      periodeMaj: "Année académique",
      carte: "Carte d’étudiant",
      dossier: "dossier étudiant",
      responsables: "Personnes de contact",
      inscription: "Inscription académique",
    };
  }

  const secondaire =
    contexte.includes("secondaire") ||
    contexte.includes("humanit") ||
    contexte.includes("college") ||
    contexte.includes("lycee");

  if (secondaire) {
    return {
      personne: "élève",
      personneMaj: "Élève",
      masculin: "Élève",
      feminin: "Élève",
      personnes: "élèves",
      personnesMaj: "Élèves",
      structure: "classe",
      structureMaj: "Classe",
      periode: "année scolaire",
      periodeMaj: "Année scolaire",
      carte: "Carte d’élève",
      dossier: "dossier élève",
      responsables: "Parents / responsables",
      inscription: "Inscription scolaire",
    };
  }

  // Primaire et autres structures scolaires.
  return {
    personne: "élève",
    personneMaj: "Élève",
    masculin: "Élève",
    feminin: "Élève",
    personnes: "élèves",
    personnesMaj: "Élèves",
    structure: "classe",
    structureMaj: "Classe",
    periode: "année scolaire",
    periodeMaj: "Année scolaire",
    carte: "Carte d’élève",
    dossier: "dossier élève",
    responsables: "Parents / responsables",
    inscription: "Inscription scolaire",
  };
}
