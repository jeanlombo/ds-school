import { redirect } from "next/navigation";
import { CalendarDays, CreditCard, KeyRound, Save, School, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { obtenirOuInitialiserLicence, obtenirUtilisationAbonnement } from "@/lib/licence";
import { enregistrerLicence, enregistrerPaiementLicence } from "./actions";
import styles from "./licences-admin.module.css";

export const dynamic="force-dynamic";
const dateInput=(d:Date|null)=>d?new Date(d).toISOString().slice(0,10):"";

export default async function LicencesPage({searchParams}:{searchParams?:Promise<{succes?:string;erreur?:string}>}){
  const u=await obtenirUtilisateurConnecte(); if(!u)redirect("/connexion"); if(u.superAdministrateur!==true)redirect("/acces-refuse?permission=SUPER_ADMIN_LICENCES");
  const q=searchParams?await searchParams:{};
  const ecoles=await prisma.ecole.findMany({orderBy:{id:"asc"},select:{id:true,nom:true,code:true}});
  const donnees=await Promise.all(ecoles.map(async e=>({ecole:e,licence:await obtenirOuInitialiserLicence(e.id),usage:await obtenirUtilisationAbonnement(e.id)})));
  const historiques=await prisma.$queryRaw<Array<{id:bigint|number;licence_id:bigint|number;action:string;ancienne_valeur:string|null;nouvelle_valeur:string|null;motif:string|null;created_at:Date}>>`
    SELECT id,licence_id,action,ancienne_valeur,nouvelle_valeur,motif,created_at FROM licence_historique ORDER BY id DESC LIMIT 30
  `;
  return <AdminShell utilisateur={u} titre="Gestion des licences" description="Administration DIGIGROUPE : quotas, échéances, paiements et renouvellements.">
    {q?.succes&&<div className={styles.succes}>{q.succes}</div>}{q?.erreur&&<div className={styles.erreur}>Une information est invalide : {q.erreur}</div>}
    <div className={styles.resume}><article><School/><div><small>Écoles</small><strong>{donnees.length}</strong></div></article><article><ShieldCheck/><div><small>Licences actives</small><strong>{donnees.filter(x=>x.licence.statut==="actif").length}</strong></div></article><article><KeyRound/><div><small>Quotas ≥ 90%</small><strong>{donnees.filter(x=>x.usage.eleves.avertissement||x.usage.enseignants.avertissement||x.usage.utilisateurs.avertissement).length}</strong></div></article></div>
    {donnees.map(({ecole,licence,usage})=><section className={styles.carte} key={ecole.id}>
      <div className={styles.entete}><div><span>{ecole.code}</span><h2>{ecole.nom}</h2><p>Licence : {licence.codeLicence}</p></div><b data-statut={licence.statut}>{licence.statut}</b></div>
      <div className={styles.usage}><span>Élèves <b>{usage.eleves.utilise}/{usage.eleves.illimite?"∞":usage.eleves.maximum}</b></span><span>Enseignants <b>{usage.enseignants.utilise}/{usage.enseignants.illimite?"∞":usage.enseignants.maximum}</b></span><span>Utilisateurs <b>{usage.utilisateurs.utilise}/{usage.utilisateurs.illimite?"∞":usage.utilisateurs.maximum}</b></span><span>Stockage <b>{usage.stockage.utiliseGo}/{usage.stockage.illimite?"∞":usage.stockage.maximumGo} Go</b></span></div>
      <form action={enregistrerLicence} className={styles.form}><input type="hidden" name="ecoleId" value={ecole.id}/>
        <label>Formule<input name="formule" defaultValue={licence.formule??"Standard"}/></label><label>Plan d'origine<input name="planStandard" defaultValue={licence.planStandard??"Standard"}/></label>
        <label>Statut<select name="statut" defaultValue={licence.statut}><option value="actif">Actif</option><option value="en_attente">En attente</option><option value="suspendu">Suspendu</option><option value="expire">Expiré</option></select></label>
        <label>Date de début<input type="date" name="dateDebut" defaultValue={dateInput(licence.dateDebut)}/></label><label>Date d'expiration<input type="date" name="dateExpiration" defaultValue={dateInput(licence.dateExpiration)}/></label>
        <label>Maximum élèves<input type="number" min="0" name="maxEleves" defaultValue={licence.maxEleves}/></label><label>Maximum enseignants<input type="number" min="0" name="maxEnseignants" defaultValue={licence.maxEnseignants}/></label><label>Maximum utilisateurs<input type="number" min="0" name="maxUtilisateurs" defaultValue={licence.maxUtilisateurs}/></label>
        <label>Maximum parents<input type="number" min="0" name="maxParents" defaultValue={licence.maxParents}/></label><label>Maximum classes<input type="number" min="0" name="maxClasses" defaultValue={licence.maxClasses}/></label><label>Maximum sections<input type="number" min="0" name="maxSections" defaultValue={licence.maxSections}/></label><label>Maximum salles<input type="number" min="0" name="maxSalles" defaultValue={licence.maxSalles}/></label><label>Stockage maximum (Go)<input type="number" min="0" name="stockageMaxGo" defaultValue={licence.stockageMaxGo}/></label>
        <label>SMS maximum<input type="number" min="0" name="smsMax" defaultValue={licence.smsMax}/></label><label>E-mails maximum<input type="number" min="0" name="emailsMax" defaultValue={licence.emailsMax}/></label>
        <div className={styles.checks}><label><input type="checkbox" name="quotaPersonnalise" defaultChecked={licence.quotaPersonnalise}/> Quotas personnalisés</label><label><input type="checkbox" name="elevesIllimite" defaultChecked={licence.elevesIllimite}/> Élèves illimités</label><label><input type="checkbox" name="enseignantsIllimite" defaultChecked={licence.enseignantsIllimite}/> Enseignants illimités</label><label><input type="checkbox" name="utilisateursIllimite" defaultChecked={licence.utilisateursIllimite}/> Utilisateurs illimités</label><label><input type="checkbox" name="stockageIllimite" defaultChecked={licence.stockageIllimite}/> Stockage illimité</label></div>
        <label className={styles.large}>Observations<textarea name="observations" defaultValue={licence.observations??""}/></label><label className={styles.large}>Motif de la modification<input name="motif" placeholder="Ex. Négociation commerciale : 300 → 500 élèves"/></label>
        <button className={styles.btn}><Save size={17}/> Enregistrer la licence</button>
      </form>
      <form action={enregistrerPaiementLicence} className={styles.paiement}><input type="hidden" name="ecoleId" value={ecole.id}/><h3><CreditCard size={18}/> Enregistrer un paiement / renouvellement</h3><input type="number" step="0.01" min="0" name="montant" placeholder="Montant" required/><select name="devise" defaultValue="USD"><option>USD</option><option>CDF</option><option>EUR</option></select><input name="modePaiement" placeholder="Mode de paiement"/><input name="reference" placeholder="Référence"/><input type="date" name="datePaiement"/><input type="date" name="nouvelleExpiration" title="Nouvelle date d'expiration"/><button><CalendarDays size={16}/> Enregistrer</button></form>
    </section>)}
    <section className={styles.historique}><h2>Historique récent</h2><div className={styles.table}><table><thead><tr><th>Date</th><th>Licence</th><th>Action</th><th>Avant</th><th>Après</th><th>Motif</th></tr></thead><tbody>{historiques.map(h=><tr key={String(h.id)}><td>{new Date(h.created_at).toLocaleString("fr-FR")}</td><td>#{String(h.licence_id)}</td><td>{h.action}</td><td>{h.ancienne_valeur||"—"}</td><td>{h.nouvelle_valeur||"—"}</td><td>{h.motif||"—"}</td></tr>)}</tbody></table></div></section>
  </AdminShell>;
}
