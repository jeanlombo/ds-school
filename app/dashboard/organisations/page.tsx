import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { creerOrganisation, rattacherEtablissement, rattacherUtilisateurGroupe } from "./actions";
import styles from "./styles.module.css";

type Organisation={id:number;code:string;nom:string;type_client:string;statut:string;nb_ecoles:bigint};
export default async function OrganisationsPage(){
 const u=await obtenirUtilisateurConnecte(); if(!u) redirect("/connexion"); if(!u.superAdministrateur) redirect("/dashboard");
 const [orgs,ecoles,users]=await Promise.all([
  prisma.$queryRaw<Organisation[]>`SELECT o.id,o.code,o.nom,o.type_client,o.statut,COUNT(oe.id) nb_ecoles FROM organisations_clientes o LEFT JOIN organisation_etablissements oe ON oe.organisation_id=o.id GROUP BY o.id ORDER BY o.nom`,
  prisma.ecole.findMany({orderBy:{nom:"asc"},select:{id:true,nom:true,code:true}}),
  prisma.utilisateur.findMany({where:{statut:"actif"},orderBy:{nom:"asc"},select:{id:true,nom:true,email:true}})
 ]);
 return <AdminShell utilisateur={u} titre="Clients & groupes scolaires" description="Administration DIGIGROUPE des clients possédant un ou plusieurs établissements.">
  <div className={styles.grid}>
   <section className={styles.panel}><h2>Nouveau client / groupe</h2><form action={creerOrganisation}>
    <input name="nom" placeholder="Nom du client ou groupe" required/><input name="code" placeholder="Code (ex. GROUPE-EXCELLENCE)" required/>
    <select name="type_client"><option value="GROUPE_SCOLAIRE">Groupe scolaire</option><option value="INDIVIDU">Individu</option><option value="ENTREPRISE">Entreprise</option><option value="INSTITUTION">Institution</option><option value="ONG">ONG</option><option value="AUTRE">Autre</option></select>
    <input name="nom_contact" placeholder="Responsable"/><input name="telephone" placeholder="Téléphone"/><input name="email" type="email" placeholder="E-mail"/><textarea name="adresse" placeholder="Adresse"/>
    <button>Créer le client</button></form></section>
   <section className={styles.panel}><h2>Rattacher un établissement</h2><form action={rattacherEtablissement}>
    <select name="organisation_id" required><option value="">Client...</option>{orgs.map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select>
    <select name="ecole_id" required><option value="">Établissement...</option>{ecoles.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}</select>
    <label><input type="checkbox" name="principal" value="1"/> Établissement principal</label><button>Rattacher</button></form>
    <h2>Donner l'accès Groupe</h2><form action={rattacherUtilisateurGroupe}>
    <select name="organisation_id" required><option value="">Client...</option>{orgs.map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select>
    <select name="utilisateur_id" required><option value="">Utilisateur...</option>{users.map(x=><option key={x.id} value={x.id}>{x.nom} — {x.email}</option>)}</select>
    <select name="role_groupe"><option value="PROPRIETAIRE">Propriétaire</option><option value="ADMIN_GROUPE">Administrateur Groupe</option><option value="COMPTABLE_GROUPE">Comptable Groupe</option><option value="LECTEUR">Lecture</option></select><button>Autoriser</button></form>
   </section>
  </div>
  <section className={styles.panel}><h2>Clients enregistrés</h2><div className={styles.table}><table><thead><tr><th>Code</th><th>Client</th><th>Type</th><th>Établissements</th><th>Statut</th></tr></thead><tbody>{orgs.map(o=><tr key={o.id}><td>{o.code}</td><td><b>{o.nom}</b></td><td>{o.type_client}</td><td>{Number(o.nb_ecoles)}</td><td>{o.statut}</td></tr>)}</tbody></table></div></section>
 </AdminShell>
}
