import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { creerCompteProprietaire } from "./actions";
import styles from "./styles.module.css";

export default async function Page(){
 const u=await obtenirUtilisateurConnecte(); if(!u) redirect("/connexion"); if(!u.superAdministrateur) redirect("/dashboard");
 const [orgs,comptes]=await Promise.all([
  prisma.$queryRaw<{id:number;nom:string}[]>`SELECT id,nom FROM organisations_clientes WHERE statut='ACTIF' ORDER BY nom`,
  prisma.$queryRaw<{id:number;nom:string;email:string;client:string;role_groupe:string;actif:number}[]>`
   SELECT u.id,u.nom,u.email,o.nom client,uo.role_groupe,uo.actif
   FROM utilisateurs_organisations uo JOIN utilisateurs u ON u.id=uo.utilisateur_id
   JOIN organisations_clientes o ON o.id=uo.organisation_id ORDER BY o.nom,u.nom`
 ]);
 return <AdminShell utilisateur={u} titre="Comptes clients" description="Création et rattachement sécurisé des propriétaires et administrateurs Groupe.">
  <div className={styles.grid}><section className={styles.panel}><h2>Nouveau compte client</h2>
   <form action={creerCompteProprietaire}>
    <select name="organisation_id" required><option value="">Client / groupe...</option>{orgs.map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select>
    <input name="nom" placeholder="Nom complet" required/><input name="email" type="email" placeholder="E-mail de connexion" required/>
    <select name="role_groupe"><option value="PROPRIETAIRE">Propriétaire</option><option value="ADMIN_GROUPE">Administrateur Groupe</option><option value="COMPTABLE_GROUPE">Comptable Groupe</option><option value="LECTEUR">Lecture</option></select>
    <input name="mot_de_passe" type="password" minLength={8} placeholder="Mot de passe temporaire (8 caractères min.)" required/>
    <button>Créer et rattacher le compte</button>
   </form></section>
   <section className={styles.panel}><h2>Principe d'accès</h2><p>Le compte Groupe accède uniquement aux établissements rattachés à son organisation. Chaque directeur ou collaborateur reste limité aux établissements qui lui sont explicitement attribués.</p><p>Les nouveaux utilisateurs créés depuis un établissement sont automatiquement liés à l'établissement actif et comptent dans son quota de licence.</p></section>
  </div>
  <section className={styles.panel}><h2>Comptes Groupe existants</h2><div className={styles.table}><table><thead><tr><th>Client</th><th>Utilisateur</th><th>E-mail</th><th>Rôle Groupe</th><th>Statut</th></tr></thead><tbody>{comptes.map(c=><tr key={`${c.id}-${c.client}`}><td>{c.client}</td><td><b>{c.nom}</b></td><td>{c.email}</td><td>{c.role_groupe}</td><td>{c.actif?"ACTIF":"INACTIF"}</td></tr>)}</tbody></table></div></section>
 </AdminShell>
}
