export type TypeAcademique="PRIMAIRE"|"SECONDAIRE"|"HUMANITES"|"UNIVERSITE"|"INSTITUT_SUPERIEUR"|"AUTRE";
const n=(v?:string|null)=>(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase();
export function detecterTypeAcademique(nom?:string|null,code?:string|null):TypeAcademique{
 const v=`${n(nom)} ${n(code)}`;
 if(v.includes("UNIVERSIT")||/\bUNI(V)?\b/.test(v))return "UNIVERSITE";
 if(v.includes("INSTITUT SUPERIEUR")||/\b(ISP|ISC|IST)\b/.test(v))return "INSTITUT_SUPERIEUR";
 if(v.includes("HUMANIT")||/\bHUM\b/.test(v))return "HUMANITES";
 if(v.includes("SECONDAIRE")||/\bSEC\b/.test(v))return "SECONDAIRE";
 if(v.includes("PRIMAIRE")||/\bPRIM\b/.test(v))return "PRIMAIRE";
 return "AUTRE";
}
export function terminologiePourSection(nom?:string|null,code?:string|null){
 const type=detecterTypeAcademique(nom,code);
 const sup=type==="UNIVERSITE"||type==="INSTITUT_SUPERIEUR";
 return {
  type,
  apprenant:sup?"Étudiant":"Élève", apprenants:sup?"Étudiants":"Élèves",
  apprenantMin:sup?"étudiant":"élève", apprenantsMin:sup?"étudiants":"élèves",
  structure:sup?"Promotion":"Classe", structures:sup?"Promotions":"Classes",
  annee:sup?"Année académique":"Année scolaire",
  carte:sup?"Carte étudiant":"Carte scolaire",
  documentResultats:sup?"Relevé de notes":"Bulletin",
  responsable:sup?"Personne de référence":"Parent / tuteur"
 };
}
