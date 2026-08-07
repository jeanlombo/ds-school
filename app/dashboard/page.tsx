import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck, CalendarDays, CheckCircle2, School, Settings, UsersRound } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { premiereDestinationAutorisee } from "@/lib/securite/rbac";
import { obtenirUtilisationAbonnement } from "@/lib/licence";
import AdminShell from "@/components/admin/AdminShell";
import UtilisationAbonnement from "@/components/licences/UtilisationAbonnement";
import styles from "@/components/admin/admin.module.css";

export const dynamic = "force-dynamic";
const possede=(p:Set<string>,c:string,s:boolean)=>s||p.has("*")||p.has(c);

export default async function Dashboard(){
  const u=await obtenirUtilisateurConnecte(); if(!u)redirect("/connexion");
  const p=new Set(u.permissions??[]); const s=u.superAdministrateur===true;
  if(!possede(p,"DASHBOARD_VOIR",s)){const d=premiereDestinationAutorisee(p,s);if(d&&d!=="/dashboard")redirect(d);redirect("/acces-refuse?permission=DASHBOARD_VOIR")}
  const e=await obtenirOuCreerEcole();
  const va=possede(p,"DASHBOARD_WIDGET_ANNEES",s),vs=possede(p,"DASHBOARD_WIDGET_SECTIONS",s),vc=possede(p,"DASHBOARD_WIDGET_CLASSES",s),ve=possede(p,"DASHBOARD_WIDGET_ELEVES",s),vactive=possede(p,"DASHBOARD_WIDGET_ANNEE_ACTIVE",s),vconfig=possede(p,"DASHBOARD_CONFIGURATION_RAPIDE",s);
  const[annees,sections,classes,eleves,active,abonnement]=await Promise.all([
    va?prisma.anneeScolaire.count({where:{ecoleId:e.id}}):null,
    vs?prisma.section.count({where:{ecoleId:e.id,statut:"active"}}):null,
    vc?prisma.classe.count({where:{ecoleId:e.id,statut:"active"}}):null,
    ve?prisma.eleve.count({where:{ecoleId:e.id,statut:"actif"}}):null,
    vactive?prisma.anneeScolaire.findFirst({where:{ecoleId:e.id,active:true}}):null,
    obtenirUtilisationAbonnement(e.id),
  ]);
  return <AdminShell utilisateur={u} titre={`Bienvenue à ${e.nom}`} description="Le tableau de bord affiche uniquement les widgets autorisés.">
    {vactive&&<div className={styles.infoBandeau}>{active?<><CheckCircle2 size={17}/>Année scolaire active : <strong>{active.libelle}</strong></>:<><CalendarDays size={17}/>Aucune année scolaire active.</>}</div>}
    <UtilisationAbonnement donnees={abonnement}/>
    <div className={styles.grilleStats}>{va&&<article className={styles.stat}><span><CalendarDays/></span><div><small>Années scolaires</small><strong>{annees}</strong></div></article>}{vs&&<article className={styles.stat}><span><BookOpenCheck/></span><div><small>Sections actives</small><strong>{sections}</strong></div></article>}{vc&&<article className={styles.stat}><span><School/></span><div><small>Classes actives</small><strong>{classes}</strong></div></article>}{ve&&<article className={styles.stat}><span><UsersRound/></span><div><small>Élèves inscrits</small><strong>{eleves}</strong></div></article>}</div>
    {vconfig&&<section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>Configuration rapide</h2><p>Seuls les raccourcis autorisés sont affichés.</p></div></div><div className={styles.panneauCorps}><div className={styles.cartesRapides}>{possede(p,"PARAMETRES_VOIR",s)&&<Link href="/dashboard/parametres" className={styles.carteRapide}><span><Settings/></span><h3>Identité de l’école</h3><p>Paramètres officiels.</p></Link>}{possede(p,"ANNEES_SCOLAIRES_VOIR",s)&&<Link href="/dashboard/annees-scolaires" className={styles.carteRapide}><span><CalendarDays/></span><h3>Année scolaire</h3><p>Consulter les périodes.</p></Link>}{possede(p,"SECTIONS_VOIR",s)&&<Link href="/dashboard/sections" className={styles.carteRapide}><span><BookOpenCheck/></span><h3>Sections</h3><p>Consulter les cycles.</p></Link>}{possede(p,"CLASSES_VOIR",s)&&<Link href="/dashboard/classes" className={styles.carteRapide}><span><School/></span><h3>Classes</h3><p>Consulter les classes.</p></Link>}</div></div></section>}
  </AdminShell>;
}
