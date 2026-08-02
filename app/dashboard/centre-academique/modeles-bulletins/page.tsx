import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, Eye, FilePlus2, Pencil, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { dupliquerModeleBulletin, supprimerModeleBulletin } from "../actions";
import styles from "../centre-academique.module.css";
export const dynamic="force-dynamic";
export default async function Page(){
 const u=await obtenirUtilisateurConnecte(); if(!u) redirect("/connexion"); const e=await obtenirOuCreerEcole();
 const modeles=await prisma.modeleBulletin.findMany({where:{ecoleId:e.id},include:{_count:{select:{versions:true}}},orderBy:[{parDefaut:"desc"},{updatedAt:"desc"}]});
 return <AdminShell utilisateur={u} titre="Modèles de bulletins" description="Adaptez le bulletin à chaque établissement sans modifier le moteur académique." action={<Link className={styles.btn} href="/dashboard/centre-academique/modeles-bulletins/nouveau"><FilePlus2 size={18}/> Nouveau modèle</Link>}>
 <div className={styles.page}><RetourDashboard/><section className={styles.panel}>
 <div className={styles.cards}>{modeles.map(m=><article className={styles.card} key={m.id} style={{borderTop:`5px solid ${m.couleurPrincipale}`}}><div className={styles.cardTop}><span className={styles.badge}>{m.parDefaut?"PAR DÉFAUT":m.actif?"ACTIF":"INACTIF"}</span><small>Version {m.version}</small></div><h3>{m.nom}</h3><p>{m.niveau||"Tous niveaux"} · {m.formatPapier} {m.orientation.toLowerCase()}</p><small>{m._count.versions} version(s) enregistrée(s)</small><div className={styles.actions}><Link href={`/dashboard/centre-academique/modeles-bulletins/${m.id}/apercu`} title="Aperçu"><Eye size={17}/></Link><Link href={`/dashboard/centre-academique/modeles-bulletins/${m.id}`} title="Modifier"><Pencil size={17}/></Link><form action={dupliquerModeleBulletin}><input type="hidden" name="id" value={m.id}/><button title="Dupliquer"><Copy size={17}/></button></form><form action={supprimerModeleBulletin}><input type="hidden" name="id" value={m.id}/><button disabled={m.parDefaut} title="Supprimer"><Trash2 size={17}/></button></form></div></article>)}</div>
 {!modeles.length&&<div className={styles.empty}><h3>Aucun modèle</h3><p>Créez le premier bulletin personnalisable de l’établissement.</p></div>}
 </section></div></AdminShell>}
