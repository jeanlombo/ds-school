import { redirect } from "next/navigation";
import { Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { creerAlerteParent } from "../actions";
import styles from "../suivi-parent.module.css";

export const dynamic = "force-dynamic";
type Props = {
  searchParams: Promise<{ erreur?: string }>;
};

export default async function Page({
  searchParams,
}: Props) {
  await exigerPermission("SUIVI_PARENT_CREER");

  const utilisateur =
    await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const eleves = await prisma.$queryRaw<
    Array<{
      id: number;
      matricule: string;
      nom_complet: string;
      classe_nom: string | null;
    }>
  >`
    SELECT
      e.id,
      e.matricule,
      CONCAT_WS(' ', e.nom, e.postnom, e.prenom)
        AS nom_complet,
      c.nom AS classe_nom
    FROM eleves e
    LEFT JOIN inscriptions i
      ON i.eleve_id = e.id
      AND i.statut IN
        ('inscrit','admis','promu','redouble')
    LEFT JOIN classes c ON c.id = i.classe_id
    WHERE e.ecole_id = ${ecole.id}
      AND e.statut = 'actif'
    ORDER BY e.nom, e.prenom
  `;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouvelle information Parent"
      description="Enregistrez une dette, absence, sanction, invitation ou convocation."
    >
      {params.erreur && (
        <div
          className={`${styles.message} ${styles.erreur}`}
        >
          L’élève, le type, le titre et la description sont obligatoires.
        </div>
      )}

      <section className={styles.panel}>
        <form
          action={creerAlerteParent}
          className={styles.formulaire}
        >
          <label className={styles.large}>
            <span>Élève *</span>
            <select
              name="eleve_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner un élève
              </option>
              {eleves.map((eleve) => (
                <option
                  key={eleve.id}
                  value={eleve.id}
                >
                  {eleve.matricule} — {eleve.nom_complet}
                  {eleve.classe_nom
                    ? ` — ${eleve.classe_nom}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Type *</span>
            <select
              name="type_evenement"
              required
              defaultValue=""
            >
              <option value="" disabled>Sélectionner</option>
              <option value="DETTE">Dette / impayé</option>
              <option value="ABSENCE">Absence</option>
              <option value="RETARD">Retard</option>
              <option value="DISCIPLINE">Incident disciplinaire</option>
              <option value="PUNITION">Punition</option>
              <option value="EXCLUSION">Exclusion / suspension</option>
              <option value="CONVOCATION">Convocation</option>
              <option value="INVITATION">Invitation</option>
              <option value="MESSAGE">Message de l’école</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>

          <label>
            <span>Niveau</span>
            <select
              name="niveau"
              defaultValue="IMPORTANT"
            >
              <option value="INFORMATION">Information</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>

          <label className={styles.large}>
            <span>Objet *</span>
            <input
              name="titre"
              required
              placeholder="Exemple : Absence non justifiée du 5 août"
            />
          </label>

          <label>
            <span>Date de l’événement</span>
            <input
              type="date"
              name="date_evenement"
              defaultValue={new Date()
                .toISOString()
                .slice(0, 10)}
            />
          </label>

          <label>
            <span>Date limite / rendez-vous</span>
            <input
              type="date"
              name="date_echeance"
            />
          </label>

          <label>
            <span>Montant</span>
            <input
              type="number"
              name="montant"
              min="0"
              step="0.01"
              placeholder="Uniquement pour une dette"
            />
          </label>

          <label>
            <span>Devise</span>
            <select name="devise" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </label>

          <label className={styles.large}>
            <span>Lieu</span>
            <input
              name="lieu"
              placeholder="Bureau pédagogique, salle de réunion..."
            />
          </label>

          <label className={styles.large}>
            <span>Description *</span>
            <textarea
              name="description"
              required
              placeholder="Décrivez les faits de manière claire et professionnelle."
            />
          </label>

          <label className={styles.large}>
            <span>Réponse du parent</span>
            <select
              name="reponse_requise"
              defaultValue="1"
            >
              <option value="1">Réponse requise</option>
              <option value="0">Information uniquement</option>
            </select>
          </label>

          <button type="submit">
            <Send size={18} />
            Envoyer dans l’Espace Parent
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
