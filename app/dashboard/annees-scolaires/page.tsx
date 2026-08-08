import { redirect } from "next/navigation";
import { CalendarCheck, CalendarDays, CheckCircle2, LockKeyhole } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import styles from "@/components/admin/admin.module.css";
import { activerAnnee, basculerStatutAnnee, creerAnnee } from "./actions";

const dateFR = (date: Date) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);

export default async function Annees({ searchParams }: { searchParams: Promise<{ succes?: string; erreur?: string }> }) {
  const utilisateur = await obtenirUtilisateurConnecte(); if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const annees = await prisma.anneeScolaire.findMany({ where: { ecoleId: ecole.id }, orderBy: { dateDebut: "desc" } });
  const query = await searchParams;
  return <AdminShell utilisateur={utilisateur} titre={ecole.typeEtablissement === "UNIVERSITE" ? "Années académiques" : ecole.typeEtablissement === "MIXTE" ? "Années scolaires / académiques" : "Années scolaires"} description="Ouvrez, activez et clôturez les périodes académiques.">
    {query.succes && <div className={styles.message}>L’année scolaire a été créée avec succès.</div>}
    {query.erreur && <div className={styles.message}>Vérifiez les dates : la date de fin doit être postérieure à la date de début.</div>}
    <div className={styles.deuxColonnes}>
      <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>Historique des années</h2><p>{annees.length} période(s) enregistrée(s)</p></div><CalendarCheck size={22}/></div>
        {annees.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Année</th><th>Période</th><th>État</th><th>Actions</th></tr></thead><tbody>{annees.map(a=><tr key={a.id}><td><strong>{a.libelle}</strong></td><td>{dateFR(a.dateDebut)} — {dateFR(a.dateFin)}</td><td><span className={`${styles.badge} ${a.active ? styles.badgeActif : a.statut === "cloturee" ? styles.badgeInactif : ""}`}>{a.active ? "Année active" : a.statut === "cloturee" ? "Clôturée" : "Ouverte"}</span></td><td><div className={styles.actionsTable}>{!a.active && a.statut !== "cloturee" && <form action={activerAnnee}><input type="hidden" name="id" value={a.id}/><button title="Activer"><CheckCircle2 size={16}/></button></form>}<form action={basculerStatutAnnee}><input type="hidden" name="id" value={a.id}/><input type="hidden" name="statut" value={a.statut}/><button title={a.statut === "ouverte" ? "Clôturer" : "Rouvrir"}><LockKeyhole size={16}/></button></form></div></td></tr>)}</tbody></table></div> : <div className={styles.vide}><CalendarDays size={38}/><p>Aucune année scolaire créée.</p></div>}
      </section>
      <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>{ecole.typeEtablissement === "UNIVERSITE" ? "Nouvelle année académique" : "Nouvelle année scolaire"}</h2><p>Créez la prochaine période académique.</p></div><CalendarDays size={22}/></div><form action={creerAnnee} className={styles.panneauCorps}><div className={styles.formGrille}><div className={`${styles.champ} ${styles.champLarge}`}><label>Libellé *</label><input name="libelle" placeholder="Ex. 2026-2027" required/></div><div className={styles.champ}><label>Date de début *</label><input type="date" name="dateDebut" required/></div><div className={styles.champ}><label>Date de fin *</label><input type="date" name="dateFin" required/></div></div><div className={styles.actions}><BoutonSoumission texte="Créer l’année"/></div></form></section>
    </div>
  </AdminShell>;
}
