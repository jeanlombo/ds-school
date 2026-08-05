export type TypeRessourceBibliotheque =
  | "LIVRE_PHYSIQUE"
  | "LIVRE_NUMERIQUE"
  | "COURS"
  | "EXERCICE"
  | "EXAMEN"
  | "CORRIGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT_OFFICIEL";

export type StatutRessourceBibliotheque =
  | "BROUILLON"
  | "PUBLIE"
  | "ARCHIVE";

export const TYPES_RESSOURCES: Array<{
  valeur: TypeRessourceBibliotheque;
  libelle: string;
}> = [
  { valeur: "LIVRE_PHYSIQUE", libelle: "Livre physique" },
  { valeur: "LIVRE_NUMERIQUE", libelle: "Livre numérique" },
  { valeur: "COURS", libelle: "Cours" },
  { valeur: "EXERCICE", libelle: "Exercice" },
  { valeur: "EXAMEN", libelle: "Examen / Épreuve" },
  { valeur: "CORRIGE", libelle: "Corrigé" },
  { valeur: "VIDEO", libelle: "Vidéo pédagogique" },
  { valeur: "AUDIO", libelle: "Audio pédagogique" },
  { valeur: "DOCUMENT_OFFICIEL", libelle: "Document officiel" },
];
