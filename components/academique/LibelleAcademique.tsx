"use client";
import {TERMINOLOGIE_MIXTE,terminologieSection} from "@/lib/terminologie-academique";
type Cle="personne"|"personnes"|"personneMin"|"personnesMin"|"annee"|"inscription"|"documentResultat"|"carte";
export default function LibelleAcademique({cle,sectionNom,sectionCode,mixte=false}:{cle:Cle;sectionNom?:string|null;sectionCode?:string|null;mixte?:boolean}){
 if(mixte){const v=TERMINOLOGIE_MIXTE[cle as keyof typeof TERMINOLOGIE_MIXTE];return <>{v||cle}</>;}
 const t=terminologieSection(sectionNom,sectionCode);return <>{String(t[cle])}</>;
}
