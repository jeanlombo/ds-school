import { redirect } from "next/navigation";
import { School, UserRoundCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { creerAffectation } from "./actions";
import styles from "../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ succes?: string; erreur?: string }>;
};

export default async function PageAffectations({ searchParams }: Props) {
  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  const params = await searchParams;

  const [utilisateurs, annees, classes, matieres, affectations] =
    await Promise.all([
      prisma.$queryRaw<Array<{ id: number; nom: string; email: string }>>`
        SELECT id, nom, email
        FROM utilisateurs_securite
        WHERE statut = 'ACTIF'
        ORDER BY nom
      `,
      prisma.anneeScolaire.findMany({ orderBy: { dateDebut: "desc" } }),
      prisma.classe.findMany({ orderBy: { nom: "asc" } }),
      prisma.matiere.findMany({ orderBy: { nom: "asc" } }),
      prisma.$queryRaw<Array<{
        id: number;
        utilisateur_nom: string;
        annee_nom: string;
        classe_nom: string;
        matiere_nom: string | null;
        fonction: string;
        principal: number | boolean;
        date_debut: Date | null;
        date_fin: Date | null;
        statut: string;
      }>>`
        SELECT
          a.id,
          u.nom AS utilisateur_nom,
          an.libelle AS annee_nom,
          c.nom AS classe_nom,
          m.nom AS matiere_nom,
          a.fonction,
          a.principal,
          a.date_debut,
          a.date_fin,
          a.statut
        FROM affectations_utilisateurs_classes a
        INNER JOIN utilisateurs_securite u ON u.id = a.utilisateur_id
        INNER JOIN annees_scolaires an ON an.id = a.annee_scolaire_id
        INNER JOIN classes c ON c.id = a.classe_id
        LEFT JOIN matieres m ON m.id = a.matiere_id
        ORDER BY an.date_debut DESC, c.nom, a.fonction
      `,
    ]);

  return (
    <AdminShell
      utilisateur={administrateur}
      titre="Affectations et titulaires"
      description="Affectez les enseignants, titulaires et responsables à leurs classes et matières."
    >
      <RetourDashboard />

      {params.succes && <div className={styles.succes}>Affectation créée.</div>}
      {params.erreur && <div className={styles.erreur}>Veuillez compléter les champs obligatoires.</div>}

      <section className={styles.panel}>
        <h2>Nouvelle affectation</h2>

        <form action={creerAffectation} className={styles.formulaire}>
          <label>
            <span>Utilisateur *</span>
            <select name="utilisateur_id" required defaultValue="">
              <option value="" disabled>Sélectionner</option>
              {utilisateurs.map((utilisateur) => (
                <option key={utilisateur.id} value={utilisateur.id}>
                  {utilisateur.nom} — {utilisateur.email}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Année scolaire *</span>
            <select name="annee_scolaire_id" required defaultValue="">
              <option value="" disabled>Sélectionner</option>
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>{annee.libelle}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Classe *</span>
            <select name="classe_id" required defaultValue="">
              <option value="" disabled>Sélectionner</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.nom}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Matière</span>
            <select name="matiere_id" defaultValue="">
              <option value="">Toutes / aucune</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>{matiere.nom}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Fonction *</span>
            <select name="fonction" required defaultValue="ENSEIGNANT_MATIERE">
              <option value="TITULAIRE_PRINCIPAL">Titulaire principal</option>
              <option value="TITULAIRE_ADJOINT">Titulaire adjoint</option>
              <option value="ENSEIGNANT_MATIERE">Enseignant de matière</option>
              <option value="RESPONSABLE_NIVEAU">Responsable de niveau</option>
              <option value="RESPONSABLE_EXAMENS">Responsable des examens</option>
              <option value="RESPONSABLE_DISCIPLINE">Responsable discipline</option>
              <option value="CONSEILLER_PEDAGOGIQUE">Conseiller pédagogique</option>
            </select>
          </label>

          <label>
            <span>Date de début</span>
            <input type="date" name="date_debut" />
          </label>

          <label>
            <span>Date de fin</span>
            <input type="date" name="date_fin" />
          </label>

          <label className={styles.case}>
            <input type="checkbox" name="principal" />
            <span>Affectation principale</span>
          </label>

          <button type="submit">
            <UserRoundCog size={17} />
            Enregistrer
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Affectations actuelles</h2>

        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Année</th>
                <th>Classe</th>
                <th>Matière</th>
                <th>Fonction</th>
                <th>Principal</th>
                <th>Période</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {affectations.map((affectation) => (
                <tr key={affectation.id}>
                  <td><strong>{affectation.utilisateur_nom}</strong></td>
                  <td>{affectation.annee_nom}</td>
                  <td>{affectation.classe_nom}</td>
                  <td>{affectation.matiere_nom ?? "Toutes / aucune"}</td>
                  <td>{affectation.fonction}</td>
                  <td>{Boolean(affectation.principal) ? "Oui" : "Non"}</td>
                  <td>
                    {affectation.date_debut
                      ? new Date(affectation.date_debut).toLocaleDateString("fr-FR")
                      : "—"}
                    {" → "}
                    {affectation.date_fin
                      ? new Date(affectation.date_fin).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td>
                    <span className={styles.vert}>{affectation.statut}</span>
                  </td>
                </tr>
              ))}

              {!affectations.length && (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.vide}>
                      <School size={42} />
                      <p>Aucune affectation enregistrée.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
