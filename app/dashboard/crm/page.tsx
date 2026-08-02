import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CalendarClock, CircleDollarSign, ContactRound, Plus, Target, TrendingUp, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import { ProspectCRM, libelleStatut } from "./types";
import styles from "./crm.module.css";
export const dynamic="force-dynamic";
export default async function Page(){
 const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect("/connexion"); const ecole=await obtenirOuCreerEcole();
 const prospects=await prisma.$queryRaw<ProspectCRM[]>`SELECT * FROM crm_prospects WHERE ecole_id=${ecole.id} ORDER BY created_at DESC`;
 const total=prospects.length, inscrits=prospects.filter(p=>p.statut==="INSCRIPTION").length;
 const nouveaux=prospects.filter(p=>new Date(p.created_at).toDateString()===new Date().toDateString()).length;
 const relances=prospects.filter(p=>p.prochaine_relance && new Date(p.prochaine_relance)<=new Date() && !["INSCRIPTION","PERDU"].includes(p.statut)).length;
 const revenu=prospects.filter(p=>p.statut==="INSCRIPTION").reduce((s,p)=>s+Number(p.montant_estime),0);
 const conversion=total?Math.round(inscrits*100/total):0;
 return <AdminShell utilisateur={utilisateur} titre="CRM scolaire Enterprise" description="Pilotez les prospects, les relances et les inscriptions depuis un seul espace." action={<Link className={styles.primaire} href="/dashboard/crm/prospects/nouveau"><Plus size={18}/> Nouveau prospect</Link>}>
  <RetourDashboard/>
  <section className={styles.stats}>
   <article><ContactRound/><div><small>Prospects</small><strong>{total}</strong><span>{nouveaux} aujourd’hui</span></div></article>
   <article><Target/><div><small>Conversions</small><strong>{conversion}%</strong><span>{inscrits} inscriptions</span></div></article>
   <article><CalendarClock/><div><small>Relances dues</small><strong>{relances}</strong><span>À traiter maintenant</span></div></article>
   <article><CircleDollarSign/><div><small>Revenu converti</small><strong>{revenu.toLocaleString("fr-FR")}</strong><span>CDF estimés</span></div></article>
  </section>
  <section className={styles.raccourcis}>
   <Link href="/dashboard/crm/prospects"><UsersRound/><div><h2>Prospects</h2><p>Rechercher, filtrer et suivre tous les contacts.</p></div></Link>
   <Link href="/dashboard/crm/pipeline"><TrendingUp/><div><h2>Pipeline commercial</h2><p>Visualiser les dossiers par étape de conversion.</p></div></Link>
   <Link href="/dashboard/crm/prospects?relance=1"><CalendarClock/><div><h2>Relances prioritaires</h2><p>Traiter les rendez-vous et suivis arrivés à échéance.</p></div></Link>
  </section>
  <section className={styles.panneau}><div className={styles.titrePanneau}><div><BarChart3/><h2>Activité récente</h2></div><Link href="/dashboard/crm/prospects">Voir tout</Link></div>
   <div className={styles.tableWrap}><table><thead><tr><th>Prospect</th><th>Responsable</th><th>Étape</th><th>Score</th><th>Créé le</th></tr></thead><tbody>{prospects.slice(0,8).map(p=><tr key={p.id}><td><Link href={`/dashboard/crm/prospects/${p.id}`}><strong>{p.nom_eleve} {p.prenom_eleve||""}</strong><small>{p.code}</small></Link></td><td>{p.nom_responsable}<small>{p.telephone}</small></td><td><span className={styles.badge}>{libelleStatut(p.statut)}</span></td><td><b>{p.score}/100</b></td><td>{new Date(p.created_at).toLocaleDateString("fr-FR")}</td></tr>)}</tbody></table>{!prospects.length&&<div className={styles.vide}>Aucun prospect. Créez le premier contact commercial.</div>}</div>
  </section>
 </AdminShell>
}
