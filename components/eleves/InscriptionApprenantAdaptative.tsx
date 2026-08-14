"use client";
import {useMemo,useState} from "react";
import {School} from "lucide-react";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import {terminologiePourSection} from "@/lib/academique/terminologie";
type C={id:number;nom:string;section:{nom:string;code:string}};
type A={id:number;libelle:string;active:boolean};
export default function InscriptionApprenantAdaptative({annees,classes,aujourdHui}:{annees:A[];classes:C[];aujourdHui:string}){
 const [classeId,setClasseId]=useState("");
 const classe=useMemo(()=>classes.find(c=>String(c.id)===classeId),[classeId,classes]);
 const t=terminologiePourSection(classe?.section.nom,classe?.section.code);
 return <section className={styles.panneau}>
  <div className={styles.panneauEntete}><div className={elevesStyles.titreSection}><span><School/></span><div>
   <h2>{t.type==="UNIVERSITE"||t.type==="INSTITUT_SUPERIEUR"?"Informations académiques":"Informations scolaires"}</h2>
   <p>Affectation de l’{t.apprenantMin} à la {t.structure.toLowerCase()} et à l’{t.annee.toLowerCase()}.</p>
  </div></div></div>
  <div className={styles.panneauCorps}><div className={styles.formGrille}>
   <div className={styles.champ}><label>{t.annee} *</label><select name="anneeScolaireId" required defaultValue={annees.find(a=>a.active)?.id||annees[0]?.id}>{annees.map(a=><option key={a.id} value={a.id}>{a.libelle}{a.active?" — active":""}</option>)}</select></div>
   <div className={styles.champ}><label>{t.structure} *</label><select name="classeId" required value={classeId} onChange={e=>setClasseId(e.target.value)}><option value="">Sélectionner</option>{classes.map(c=><option key={c.id} value={c.id}>{c.section.nom} — {c.nom}</option>)}</select></div>
   <div className={styles.champ}><label>Date d’inscription</label><input type="date" name="dateInscription" defaultValue={aujourdHui}/></div>
   <div className={styles.champ}><label>Type d’admission</label><select name="typeAdmission" defaultValue="nouveau"><option value="nouveau">Nouveau / débutant</option><option value="ancien">Ancien {t.apprenantMin}</option><option value="transfert">Transfert</option></select></div>
   <div className={`${styles.champ} ${styles.champLarge}`}><label>{t.type==="UNIVERSITE"||t.type==="INSTITUT_SUPERIEUR"?"Établissement / université de provenance":"École de provenance"}</label><input name="ancienneEcole"/></div>
  </div></div>
 </section>;
}
