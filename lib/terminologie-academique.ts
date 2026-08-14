export type TypeSectionAcademique="PRIMAIRE"|"SECONDAIRE"|"HUMANITES"|"UNIVERSITE"|"INSTITUT_SUPERIEUR"|"AUTRE";
export type ModeAcademique="scolaire"|"superieur";

function normaliser(v?:string|null){
 return (v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase().replace(/[-/]+/g,"_").replace(/\s+/g,"_");
}
export function detecterTypeSection(nom?:string|null,code?:string|null):TypeSectionAcademique{
 const v=`${normaliser(nom)} ${normaliser(code)}`;
 if(v.includes("UNIVERSITE")||v.includes("UNIV")||v.includes("FACULTE")) return "UNIVERSITE";
 if(v.includes("INSTITUT_SUPERIEUR")||v.includes("SUPERIEUR")||v.includes("IST")||v.includes("ISP")||v.includes("ISC")||v.includes("ISIG")) return "INSTITUT_SUPERIEUR";
 if(v.includes("HUMANITE")||v.includes("HUM")) return "HUMANITES";
 if(v.includes("SECONDAIRE")||v.includes("SECOND")||v.includes("SEC")) return "SECONDAIRE";
 if(v.includes("PRIMAIRE")||v.includes("PRIM")) return "PRIMAIRE";
 return "AUTRE";
}
const scolaire={
 mode:"scolaire" as const,personne:"Élève",personnes:"Élèves",personneMin:"élève",personnesMin:"élèves",
 inscription:"Inscription scolaire",structurePrincipale:"Classe",structurePrincipalePluriel:"Classes",
 structureNiveau2:null as string|null,structureNiveau3:null as string|null,annee:"Année scolaire",
 documentResultat:"Bulletin",documentResultatPluriel:"Bulletins",carte:"Carte scolaire",
 responsable:"Parent / Tuteur",responsables:"Parents / Tuteurs",enseignant:"Enseignant",enseignants:"Enseignants"
};
export function terminologieSection(nom?:string|null,code?:string|null){
 const type=detecterTypeSection(nom,code);
 if(type==="UNIVERSITE") return {type,mode:"superieur" as const,personne:"Étudiant",personnes:"Étudiants",personneMin:"étudiant",personnesMin:"étudiants",inscription:"Inscription académique",structurePrincipale:"Faculté",structurePrincipalePluriel:"Facultés",structureNiveau2:"Département",structureNiveau3:"Promotion",annee:"Année académique",documentResultat:"Relevé de notes",documentResultatPluriel:"Relevés de notes",carte:"Carte d’étudiant",responsable:"Personne de contact",responsables:"Personnes de contact",enseignant:"Enseignant / Professeur",enseignants:"Enseignants / Professeurs"};
 if(type==="INSTITUT_SUPERIEUR") return {type,mode:"superieur" as const,personne:"Étudiant",personnes:"Étudiants",personneMin:"étudiant",personnesMin:"étudiants",inscription:"Inscription académique",structurePrincipale:"Section",structurePrincipalePluriel:"Sections",structureNiveau2:"Département",structureNiveau3:"Promotion",annee:"Année académique",documentResultat:"Relevé de notes",documentResultatPluriel:"Relevés de notes",carte:"Carte d’étudiant",responsable:"Personne de contact",responsables:"Personnes de contact",enseignant:"Enseignant / Professeur",enseignants:"Enseignants / Professeurs"};
 if(type==="HUMANITES"||type==="SECONDAIRE") return {...scolaire,type,structureNiveau2:"Option"};
 return {...scolaire,type};
}
export function estSuperieur(nom?:string|null,code?:string|null){return terminologieSection(nom,code).mode==="superieur";}
export const TERMINOLOGIE_MIXTE={personne:"Apprenant",personnes:"Apprenants",personneMin:"apprenant",personnesMin:"apprenants",annee:"Année scolaire / académique",structure:"Classe / Promotion",inscription:"Inscription",documentResultat:"Bulletin / Relevé de notes",carte:"Carte scolaire / Carte d’étudiant"};
