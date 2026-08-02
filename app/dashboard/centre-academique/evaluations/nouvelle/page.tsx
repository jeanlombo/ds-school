import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import { creerEvaluation } from "../actions";
import styles from "../evaluations.module.css";

export const dynamic = "force-dynamic";

export default async function NouvelleEvaluationPage() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();

  const [annees, periodes, classes, matieres, enseignants, types, salles] = await Promise.all([
    prisma.anneeScolaire.findMany({ where: { ecoleId: ecole.id }, orderBy: [{ active: "desc" }, { dateDebut: "desc" }] }),
    prisma.periodeAcademique.findMany({ where: { anneeScolaire: { ecoleId: ecole.id }, statut: "ACTIVE" }, include: { anneeScolaire: true }, orderBy: [{ anneeScolaireId: "desc" }, { ordre: "asc" }] }),
    prisma.classe.findMany({ where: { ecoleId: ecole.id, statut: "active" }, orderBy: { nom: "asc" } }),
    prisma.matiere.findMany({ where: { statut: "ACTIF" }, orderBy: { nom: "asc" } }),
    prisma.enseignant.findMany({ where: { ecoleId: ecole.id, statut: "actif" }, orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.typeEvaluation.findMany({ where: { ecoleId: ecole.id, actif: true }, orderBy: { nom: "asc" } }),
    prisma.salle.findMany({ where: { ecoleId: ecole.id, statut: "ACTIVE" }, orderBy: { nom: "asc" } }),
  ]);

  return <AdminShell utilisateur={utilisateur} titre="Nouvelle évaluation" description="Définissez le contexte académique, le barème et la programmation de l’évaluation.">
    <Link href="/dashboard/centre-academique/evaluations" className={styles.retourDashboard}><ArrowLeft size={17}/> Retour aux évaluations</Link>
    <form action={creerEvaluation} className={styles.formulaire}>
      <div className={styles.grilleForm}>
        <label><span>Titre *</span><input name="titre" required placeholder="Ex. Interrogation de mathématiques"/></label>
        <label><span>Type *</span><select name="typeEvaluationId" required><option value="">Choisir</option>{types.map(t=><option key={t.id} value={t.id}>{t.nom}</option>)}</select></label>
        <label><span>Année scolaire *</span><select name="anneeScolaireId" required><option value="">Choisir</option>{annees.map(a=><option key={a.id} value={a.id}>{a.libelle}{a.active ? " — active" : ""}</option>)}</select></label>
        <label><span>Période *</span><select name="periodeAcademiqueId" required><option value="">Choisir</option>{periodes.map(p=><option key={p.id} value={p.id}>{p.nom} — {p.anneeScolaire.libelle}</option>)}</select></label>
        <label><span>Classe *</span><select name="classeId" required><option value="">Choisir</option>{classes.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
        <label><span>Matière *</span><select name="matiereId" required><option value="">Choisir</option>{matieres.map(m=><option key={m.id} value={m.id}>{m.nom}</option>)}</select></label>
        <label><span>Enseignant *</span><select name="enseignantId" required><option value="">Choisir</option>{enseignants.map(e=><option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}</select></label>
        <label><span>Salle</span><select name="salleId"><option value="0">Non définie</option>{salles.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}</select></label>
        <label><span>Date *</span><input type="date" name="dateEvaluation" required/></label>
        <label><span>Heure</span><input type="time" name="heureDebut"/></label>
        <label><span>Durée (minutes)</span><input type="number" min="1" name="dureeMinutes" defaultValue="60"/></label>
        <label><span>Barème *</span><input type="number" min="1" step="0.01" name="bareme" defaultValue="20" required/></label>
        <label><span>Coefficient *</span><input type="number" min="0.01" step="0.01" name="coefficient" defaultValue="1" required/></label>
        <label><span>Statut</span><select name="statut" defaultValue="BROUILLON"><option value="BROUILLON">Brouillon</option><option value="PROGRAMMEE">Programmée</option><option value="PUBLIEE">Publiée</option></select></label>
        <label className={styles.pleineLargeur}><span>Description / consignes</span><textarea name="description" rows={4}/></label>
      </div>
      {types.length === 0 && <div className={styles.alerte}>Aucun type d’évaluation actif. <Link href="/dashboard/centre-academique/evaluations/types">Créer un type</Link>.</div>}
      <div className={styles.actionsForm}><Link href="/dashboard/centre-academique/evaluations">Annuler</Link><button type="submit" disabled={types.length===0}><Save size={18}/> Créer et saisir les notes</button></div>
    </form>
  </AdminShell>;
}
