export type TerminologieAcademique = {
  type: "scolaire" | "superieur";
  apprenant: string; apprenantPluriel: string;
  classe: string; classePluriel: string;
  annee: string; inscription: string; carte: string;
  dossier: string; responsables: string; frais: string;
};

const SCOLAIRE: TerminologieAcademique = {
  type:"scolaire", apprenant:"Élève", apprenantPluriel:"Élèves",
  classe:"Classe", classePluriel:"Classes", annee:"Année scolaire",
  inscription:"Inscription scolaire", carte:"Carte scolaire",
  dossier:"Dossier scolaire", responsables:"Parents / Responsables",
  frais:"Frais scolaires"
};

const SUPERIEUR: TerminologieAcademique = {
  type:"superieur", apprenant:"Étudiant", apprenantPluriel:"Étudiants",
  classe:"Promotion", classePluriel:"Promotions", annee:"Année académique",
  inscription:"Inscription académique", carte:"Carte d’étudiant",
  dossier:"Dossier académique", responsables:"Contacts / Responsables",
  frais:"Frais académiques"
};

function normaliser(v?: string|null) {
  return (v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
}

export function estSectionSuperieure(section?: {nom?:string|null;code?:string|null}|string|null) {
  const brut=typeof section==="string"?section:`${section?.nom||""} ${section?.code||""}`;
  const v=normaliser(brut);
  return ["universite","institut superieur","faculte","licence","master","doctorat","lmd"]
    .some(m=>v.includes(normaliser(m)));
}

export function terminologieSection(section?: {nom?:string|null;code?:string|null}|string|null) {
  return estSectionSuperieure(section)?SUPERIEUR:SCOLAIRE;
}

export function terminologieClasse(classe?: {section?:{nom?:string|null;code?:string|null}|null}|null) {
  return terminologieSection(classe?.section);
}

export const terminologieGlobale = {
  apprenant:"Apprenant", apprenantPluriel:"Apprenants",
  inscription:"Inscription", dossier:"Dossier apprenant",
  carte:"Carte d’identification", responsables:"Responsables / Contacts",
  frais:"Frais"
};
