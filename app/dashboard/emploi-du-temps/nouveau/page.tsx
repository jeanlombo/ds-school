import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, Save, X } from "lucide-react";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { creerSeance } from "../actions";
import styles from "../emploi-du-temps.module.css";

const erreurs: Record<string, string> = {
  champs: "Tous les champs obligatoires doivent être remplis.", selection: "Une sélection est invalide ou inactive.", salle: "La salle sélectionnée est indisponible.", type: "Le type de cours est invalide.", jour: "Ce jour n’est pas activé dans les paramètres académiques.",
  "conflit-classe": "Cette classe possède déjà un cours à ce créneau.", "conflit-enseignant": "Cet enseignant est déjà occupé à ce créneau.", "conflit-salle": "Cette salle est déjà occupée à ce créneau.", "limite-classe": "La classe a atteint le maximum de cours autorisés pour ce jour.", "limite-enseignant": "L’enseignant a atteint son maximum de périodes pour ce jour.",
};

type Props = { searchParams: Promise<{ erreur?: string }> };
export default async function NouvelleSeance({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [annees, classes, matieres, enseignants, jours, creneaux, salles, typesCours] = await Promise.all([
    prisma.anneeScolaire.findMany({ where: { ecoleId: ecole.id }, orderBy: [{ active: "desc" }, { dateDebut: "desc" }] }),
    prisma.classe.findMany({ where: { ecoleId: ecole.id, statut: "active" }, orderBy: { nom: "asc" } }),
    prisma.matiere.findMany({ where: { statut: "ACTIF" }, orderBy: { nom: "asc" } }),
    prisma.enseignant.findMany({ where: { ecoleId: ecole.id, statut: "actif" }, orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.jourOuvrable.findMany({ where: { ecoleId: ecole.id, actif: true }, orderBy: { ordre: "asc" } }),
    prisma.creneauHoraire.findMany({ where: { ecoleId: ecole.id, actif: true }, orderBy: { ordre: "asc" } }),
    prisma.salle.findMany({ where: { ecoleId: ecole.id, statut: "ACTIVE" }, orderBy: { nom: "asc" } }),
    prisma.typeCours.findMany({ where: { ecoleId: ecole.id, actif: true }, orderBy: { nom: "asc" } }),
  ]);

  return <AdminShell utilisateur={utilisateur} titre="Nouvelle séance" description="Affectez une matière, un enseignant, une classe et un créneau sans créer de conflit.">
    <RetourDashboard />
    {params.erreur && <div className={styles.erreur}>{erreurs[params.erreur] || "La séance n’a pas pu être enregistrée."}</div>}
    <form action={creerSeance} className={styles.formulaire}>
      <div className={styles.formEntete}><CalendarPlus size={25}/><div><h2>Planification du cours</h2><p>Les contrôles de disponibilité sont exécutés lors de l’enregistrement.</p></div></div>
      <div className={styles.champs}>
        <label>Année scolaire *<select name="anneeScolaireId" required defaultValue={annees.find(a=>a.active)?.id || annees[0]?.id || ""}><option value="">Sélectionner</option>{annees.map(a=><option key={a.id} value={a.id}>{a.libelle}</option>)}</select></label>
        <label>Classe *<select name="classeId" required><option value="">Sélectionner</option>{classes.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
        <label>Matière *<select name="matiereId" required><option value="">Sélectionner</option>{matieres.map(m=><option key={m.id} value={m.id}>{m.nom}</option>)}</select></label>
        <label>Enseignant *<select name="enseignantId" required><option value="">Sélectionner</option>{enseignants.map(e=><option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}</select></label>
        <label>Jour *<select name="jour" required><option value="">Sélectionner</option>{jours.map(j=><option key={j.id} value={j.jour}>{j.jour.charAt(0)+j.jour.slice(1).toLowerCase()}</option>)}</select></label>
        <label>Créneau *<select name="creneauHoraireId" required><option value="">Sélectionner</option>{creneaux.map(c=><option key={c.id} value={c.id}>{c.nom} — {c.heureDebut} à {c.heureFin}</option>)}</select></label>
        <label>Salle<select name="salleId"><option value="">Aucune salle</option>{salles.map(s=><option key={s.id} value={s.id}>{s.nom} ({s.code})</option>)}</select></label>
        <label>Type de cours<select name="typeCoursId"><option value="">Non défini</option>{typesCours.map(t=><option key={t.id} value={t.id}>{t.nom}</option>)}</select></label>
        <label className={styles.large}>Observations<textarea name="observations" rows={3} placeholder="Consignes ou précision facultative…" /></label>
      </div>
      <div className={styles.actions}><Link href="/dashboard/emploi-du-temps"><X size={18}/> Annuler</Link><button type="submit"><Save size={18}/> Enregistrer la séance</button></div>
    </form>
  </AdminShell>;
}
