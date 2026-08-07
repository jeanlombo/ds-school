import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { creerEtablissement, modifierEtablissement, changerStatutEtablissement } from "./actions";
import styles from "./etablissements.module.css";

type Ligne={id:number;nom:string;code:string;adresse:string|null;ville:string|null;pays:string|null;telephone:string|null;email:string|null;directeur:string|null;devise:string;statut:string;organisation_nom:string|null};

export default async function Page(){
 const utilisateur=await obtenirUtilisateurConnecte();
 if(!utilisateur) redirect("/connexion");
 if(!utilisateur.superAdministrateur) redirect("/dashboard");

 const [ecoles,organisations]=await Promise.all([
  prisma.$queryRaw<Ligne[]>`SELECT e.id,e.nom,e.code,e.adresse,e.ville,e.pays,e.telephone,e.email,e.directeur,e.devise,e.statut,o.nom organisation_nom FROM ecoles e LEFT JOIN organisation_etablissements oe ON oe.ecole_id=e.id LEFT JOIN organisations_clientes o ON o.id=oe.organisation_id ORDER BY e.id DESC`,
  prisma.$queryRaw<{id:number;nom:string}[]>`SELECT id,nom FROM organisations_clientes WHERE statut='ACTIF' ORDER BY nom`
 ]);

 return <AdminShell utilisateur={utilisateur} titre="Établissements" description="Créer et administrer les établissements avant leur rattachement aux clients DIGIGROUPE.">
  <section className={styles.hero}><b>ADMINISTRATION DIGIGROUPE</b><h2>{ecoles.length} établissement(s)</h2><p>Chaque école possède son identité, ses données et sa licence.</p></section>
  <div className={styles.grid}>
   <section className={styles.card}><h2>Nouvel établissement</h2>
    <form action={creerEtablissement} className={styles.form}>
     <label>Nom de l’établissement<input name="nom" required placeholder="Excellence Kinshasa"/></label>
     <label>Code unique<input name="code" required placeholder="EX-KIN-001"/></label>
     <div className={styles.two}><label>Ville<input name="ville"/></label><label>Pays<input name="pays" defaultValue="République démocratique du Congo"/></label></div>
     <label>Adresse<input name="adresse"/></label>
     <div className={styles.two}><label>Téléphone<input name="telephone"/></label><label>E-mail<input name="email" type="email"/></label></div>
     <div className={styles.two}><label>Directeur / Responsable<input name="directeur"/></label><label>Devise<select name="devise" defaultValue="CDF"><option>CDF</option><option>USD</option><option>EUR</option></select></label></div>
     <label>Client à rattacher immédiatement (facultatif)<select name="organisation_id"><option value="">Aucun — rattacher plus tard</option>{organisations.map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select></label>
     <label>Slogan<input name="slogan"/></label>
     <div className={styles.two}><label>Site web<input name="site_web"/></label><label>Boîte postale<input name="boite_postale"/></label></div>
     <button className={styles.primary}>Créer l’établissement</button>
    </form>
   </section>
   <section className={styles.card}><h2>Workflow</h2><div className={styles.flow}>
    <b>1. Clients & groupes</b><p>Créez le client ou groupe scolaire.</p>
    <b>2. Établissements</b><p>Créez ici chacune de ses écoles.</p>
    <b>3. Rattachement</b><p>Choisissez le client ici ou rattachez plus tard.</p>
    <b>4. Licence</b><p>Attribuez les quotas de chaque école.</p>
    <b>5. Compte propriétaire</b><p>Créez ensuite le compte du propriétaire Groupe.</p>
   </div></section>
  </div>
  <section className={styles.card}><h2>Établissements enregistrés</h2><div className={styles.list}>
   {ecoles.map(e=><details className={styles.school} key={e.id}><summary><div><strong>{e.nom}</strong><small>{e.code} · {e.ville||"Ville non renseignée"}</small></div><div className={styles.badges}><span>{e.organisation_nom||"Non rattaché"}</span><em data-active={e.statut==="active"}>{e.statut==="active"?"ACTIF":"INACTIF"}</em></div></summary>
    <form action={modifierEtablissement} className={styles.form}><input type="hidden" name="id" value={e.id}/>
     <div className={styles.two}><label>Nom<input name="nom" defaultValue={e.nom} required/></label><label>Code<input name="code" defaultValue={e.code} required/></label></div>
     <div className={styles.two}><label>Ville<input name="ville" defaultValue={e.ville??""}/></label><label>Pays<input name="pays" defaultValue={e.pays??""}/></label></div>
     <label>Adresse<input name="adresse" defaultValue={e.adresse??""}/></label>
     <div className={styles.two}><label>Téléphone<input name="telephone" defaultValue={e.telephone??""}/></label><label>E-mail<input name="email" defaultValue={e.email??""}/></label></div>
     <div className={styles.two}><label>Directeur<input name="directeur" defaultValue={e.directeur??""}/></label><label>Devise<select name="devise" defaultValue={e.devise}><option>CDF</option><option>USD</option><option>EUR</option></select></label></div>
     <button className={styles.secondary}>Enregistrer les modifications</button>
    </form>
    <form action={changerStatutEtablissement} className={styles.status}><input type="hidden" name="id" value={e.id}/><input type="hidden" name="statut" value={e.statut==="active"?"inactive":"active"}/><button>{e.statut==="active"?"Désactiver l’établissement":"Réactiver l’établissement"}</button></form>
   </details>)}
  </div></section>
 </AdminShell>
}
