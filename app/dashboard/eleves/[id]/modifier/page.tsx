import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, UserRound, HeartPulse } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import PhotoEleveUpload from "@/components/eleves/PhotoEleveUpload";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import { modifierEleve } from "../../actions";

type Props={params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function ModifierEleve({params,searchParams}:Props){
 const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect("/connexion");
 const ecole=await obtenirOuCreerEcole(); const {id}=await params; const q=await searchParams;
 const eleve=await prisma.eleve.findFirst({where:{id:Number(id),ecoleId:ecole.id}}); if(!eleve) notFound();
 const erreur=typeof q.erreur==="string"?q.erreur:"";
 return <AdminShell utilisateur={utilisateur} titre="Modifier l’élève" description="Mettez à jour le dossier sans perdre l’historique." action={<Link href={`/dashboard/eleves/${eleve.id}`} className={styles.boutonSecondaire}><ArrowLeft size={18}/> Retour au dossier</Link>}>
 {erreur&&<div className={elevesStyles.erreur}>{erreur}</div>}
 <form action={modifierEleve} className={elevesStyles.formulaireLong} encType="multipart/form-data"><input type="hidden" name="id" value={eleve.id}/>
 <section className={styles.panneau}><div className={styles.panneauEntete}><div className={elevesStyles.titreSection}><span><UserRound/></span><div><h2>Identité</h2><p>Informations personnelles et photo de la carte scolaire.</p></div></div></div><div className={styles.panneauCorps}>
 <PhotoEleveUpload photoActuelle={eleve.photo} nomEleve={`${eleve.prenom} ${eleve.nom}`} />
 <div className={styles.formGrille}>
 <div className={styles.champ}><label>Matricule</label><input value={eleve.matricule} disabled/></div><div className={styles.champ}><label>Numéro permanent</label><input name="numeroPermanent" defaultValue={eleve.numeroPermanent||""}/></div>
 <div className={styles.champ}><label>Nom *</label><input name="nom" required defaultValue={eleve.nom}/></div><div className={styles.champ}><label>Postnom</label><input name="postnom" defaultValue={eleve.postnom||""}/></div>
 <div className={styles.champ}><label>Prénom *</label><input name="prenom" required defaultValue={eleve.prenom}/></div><div className={styles.champ}><label>Sexe *</label><select name="sexe" required defaultValue={eleve.sexe}><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
 <div className={styles.champ}><label>Date de naissance *</label><input type="date" name="dateNaissance" required defaultValue={eleve.dateNaissance.toISOString().slice(0,10)}/></div><div className={styles.champ}><label>Lieu de naissance</label><input name="lieuNaissance" defaultValue={eleve.lieuNaissance||""}/></div>
 <div className={styles.champ}><label>Nationalité</label><input name="nationalite" defaultValue={eleve.nationalite||""}/></div>
 <div className={`${styles.champ} ${styles.champLarge}`}><label>Adresse</label><textarea name="adresse" defaultValue={eleve.adresse||""}/></div>
 </div></div></section>
 <section className={styles.panneau}><div className={styles.panneauEntete}><div className={elevesStyles.titreSection}><span><HeartPulse/></span><div><h2>Santé et urgence</h2><p>Informations confidentielles utiles.</p></div></div></div><div className={styles.panneauCorps}><div className={styles.formGrille}>
 <div className={styles.champ}><label>Groupe sanguin</label><select name="groupeSanguin" defaultValue={eleve.groupeSanguin||""}><option value="">Non renseigné</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g=><option key={g}>{g}</option>)}</select></div>
 <div className={styles.champ}><label>Contact d’urgence</label><input name="contactUrgence" defaultValue={eleve.contactUrgence||""}/></div><div className={styles.champ}><label>Téléphone d’urgence</label><input name="telephoneUrgence" defaultValue={eleve.telephoneUrgence||""}/></div>
 <div className={styles.champ}><label>Allergies</label><textarea name="allergies" defaultValue={eleve.allergies||""}/></div><div className={`${styles.champ} ${styles.champLarge}`}><label>Handicap ou besoin particulier</label><textarea name="handicap" defaultValue={eleve.handicap||""}/></div>
 </div></div></section><div className={elevesStyles.barreValidation}><span>Chaque modification est enregistrée dans l’historique.</span><BoutonSoumission texte="Enregistrer les modifications" /></div></form>
 </AdminShell>;
}
