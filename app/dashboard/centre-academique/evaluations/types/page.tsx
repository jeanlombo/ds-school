import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Power, Save, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import { changerStatutTypeEvaluation, creerTypeEvaluation } from "../actions";
import styles from "../evaluations.module.css";

export const dynamic = "force-dynamic";

type Props={searchParams:Promise<{succes?:string}>};
export default async function TypesEvaluationsPage({searchParams}:Props){
 const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect("/connexion");
 const ecole=await obtenirOuCreerEcole(); const params=await searchParams;
 const types=await prisma.typeEvaluation.findMany({where:{ecoleId:ecole.id},orderBy:[{actif:"desc"},{nom:"asc"}]});
 return <AdminShell utilisateur={utilisateur} titre="Types d’évaluations" description="Configurez les interrogations, devoirs, examens, projets et leurs coefficients par défaut.">
  <Link href="/dashboard/centre-academique/evaluations" className={styles.retourDashboard}><ArrowLeft size={17}/> Retour aux évaluations</Link>
  {params.succes&&<div className={styles.succes}>Le type d’évaluation a été créé.</div>}
  <div className={styles.deuxColonnes}>
   <form action={creerTypeEvaluation} className={styles.formulaire}><h2><Tags size={20}/> Nouveau type</h2><div className={styles.grilleForm}>
    <label><span>Nom *</span><input name="nom" required placeholder="Ex. Interrogation"/></label>
    <label><span>Code *</span><input name="code" required placeholder="INTERROGATION"/></label>
    <label><span>Coefficient par défaut *</span><input type="number" min="0.01" step="0.01" name="coefficient" defaultValue="1" required/></label>
    <label><span>Couleur</span><input type="color" name="couleur" defaultValue="#2563EB"/></label>
    <label className={styles.pleineLargeur}><span>Description</span><textarea name="description" rows={3}/></label>
   </div><div className={styles.actionsForm}><button type="submit"><Save size={18}/> Enregistrer</button></div></form>
   <section className={styles.listeTypes}><h2>Types configurés</h2>{types.length===0?<div className={styles.videCompact}>Aucun type configuré.</div>:types.map(t=><article key={t.id}><i style={{backgroundColor:t.couleur}}/><div><strong>{t.nom}</strong><small>{t.code} · coefficient {Number(t.coefficient).toFixed(2)}</small></div><span className={t.actif?styles.actif:styles.inactif}>{t.actif?"Actif":"Inactif"}</span><form action={changerStatutTypeEvaluation}><input type="hidden" name="id" value={t.id}/><input type="hidden" name="actif" value={String(!t.actif)}/><button title={t.actif?"Désactiver":"Activer"}><Power size={17}/></button></form></article>)}</section>
  </div>
 </AdminShell>;
}
