import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { creerAbonnement,enregistrerPaiement,renouvelerAbonnement } from "./actions";
import styles from "./styles.module.css";

type Kpi={clients:bigint;ecoles:bigint;licences_actives:bigint;expirent_30j:bigint};
type Org={id:number;nom:string};
type Abo={id:number;code_abonnement:string;organisation_id:number;client:string;formule:string|null;date_expiration:Date|null;statut:string;montant:any;devise:string};
export default async function SaasPage(){
 const u=await obtenirUtilisateurConnecte(); if(!u) redirect("/connexion"); if(!u.superAdministrateur) redirect("/dashboard");
 const [kpis,orgs,abos,paiements,alertes]=await Promise.all([
  prisma.$queryRaw<Kpi[]>`SELECT
   (SELECT COUNT(*) FROM organisations_clientes WHERE statut='ACTIF') clients,
   (SELECT COUNT(*) FROM ecoles) ecoles,
   (SELECT COUNT(*) FROM licences WHERE statut='actif') licences_actives,
   (SELECT COUNT(*) FROM licences WHERE statut='actif' AND date_expiration BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)) expirent_30j`,
  prisma.$queryRaw<Org[]>`SELECT id,nom FROM organisations_clientes WHERE statut='ACTIF' ORDER BY nom`,
  prisma.$queryRaw<Abo[]>`SELECT a.id,a.code_abonnement,a.organisation_id,o.nom client,a.formule,a.date_expiration,a.statut,a.montant,a.devise FROM abonnements_clients a JOIN organisations_clientes o ON o.id=a.organisation_id ORDER BY a.id DESC LIMIT 100`,
  prisma.$queryRaw<{total:any}[]>`SELECT COALESCE(SUM(montant),0) total FROM paiements_abonnements_clients WHERE statut='VALIDE' AND YEAR(date_paiement)=YEAR(CURDATE())`,
  prisma.$queryRaw<{total:bigint}[]>`SELECT COUNT(*) total FROM alertes_saas WHERE statut='OUVERTE'`
 ]);
 const k = kpis[0] || {
  clients: BigInt(0),
  ecoles: BigInt(0),
  licences_actives: BigInt(0),
  expirent_30j: BigInt(0),
};
 return <AdminShell utilisateur={u} titre="Centre SaaS DIGIGROUPE" description="Pilotage commercial central de DS SCHOOL ENTERPRISE.">
  <div className={styles.kpis}>
   <div><span>Clients actifs</span><b>{Number(k.clients)}</b></div><div><span>Établissements</span><b>{Number(k.ecoles)}</b></div>
   <div><span>Licences actives</span><b>{Number(k.licences_actives)}</b></div><div><span>Expiration ≤ 30 j</span><b>{Number(k.expirent_30j)}</b></div>
   <div><span>Paiements année</span><b>{Number(paiements[0]?.total||0).toLocaleString("fr-FR")} USD</b></div><div><span>Alertes ouvertes</span><b>{Number(alertes[0]?.total||0)}</b></div>
  </div>
  <div className={styles.grid}>
   <section className={styles.panel}><h2>Créer un abonnement</h2><form action={creerAbonnement}>
    <select name="organisation_id" required><option value="">Client...</option>{orgs.map(o=><option value={o.id} key={o.id}>{o.nom}</option>)}</select>
    <input name="code_abonnement" placeholder="Code abonnement" required/><input name="formule" placeholder="Formule" defaultValue="Standard"/>
    <div className={styles.duo}><input name="date_debut" type="date" required/><input name="date_expiration" type="date" required/></div>
    <div className={styles.duo}><input name="montant" type="number" step="0.01" placeholder="Montant"/><select name="devise"><option>USD</option><option>CDF</option></select></div>
    <select name="periodicite"><option value="ANNUEL">Annuel</option><option value="SEMESTRIEL">Semestriel</option><option value="TRIMESTRIEL">Trimestriel</option><option value="MENSUEL">Mensuel</option><option value="PERSONNALISE">Personnalisé</option></select>
    <textarea name="observations" placeholder="Observations"/><button>Créer l'abonnement</button>
   </form></section>
   <section className={styles.panel}><h2>Enregistrer un paiement</h2><form action={enregistrerPaiement}>
    <select name="abonnement_id" required><option value="">Abonnement...</option>{abos.map(a=><option value={a.id} key={a.id}>{a.client} — {a.code_abonnement}</option>)}</select>
    <div className={styles.duo}><input name="montant" type="number" step="0.01" required placeholder="Montant"/><select name="devise"><option>USD</option><option>CDF</option></select></div>
    <input name="date_paiement" type="date" required/><input name="mode_paiement" placeholder="Mode de paiement"/><input name="reference_paiement" placeholder="Référence"/><textarea name="observations" placeholder="Observations"/><button>Enregistrer le paiement</button>
   </form></section>
  </div>
  <section className={styles.panel}><h2>Abonnements & renouvellements</h2><div className={styles.table}><table><thead><tr><th>Client</th><th>Code</th><th>Formule</th><th>Expiration</th><th>Statut</th><th>Renouveler</th></tr></thead><tbody>{abos.map(a=><tr key={a.id}><td><b>{a.client}</b></td><td>{a.code_abonnement}</td><td>{a.formule}</td><td>{a.date_expiration?new Date(a.date_expiration).toLocaleDateString("fr-FR"):"-"}</td><td>{a.statut}</td><td><form className={styles.inline} action={renouvelerAbonnement}><input type="hidden" name="abonnement_id" value={a.id}/><input name="nouvelle_expiration" type="date" required/><input name="montant" type="number" step="0.01" placeholder="Montant"/><input type="hidden" name="devise" value={a.devise}/><button>Renouveler</button></form></td></tr>)}</tbody></table></div></section>
 </AdminShell>
}
