import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { KeyRound, Save, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../../../RetourDashboard";
import {
  enregistrerPermissionUtilisateur,
  supprimerPermissionUtilisateur,
} from "./actions";
import styles from "../../../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PermissionsUtilisateur({ params }: Props) {
  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  const { id } = await params;
  const utilisateurId = Number(id);

  const utilisateurs = await prisma.$queryRaw<Array<{
    id: number;
    nom: string;
    email: string;
    role_nom: string;
  }>>`
    SELECT us.id, us.nom, us.email, rs.nom AS role_nom
    FROM utilisateurs_securite us
    INNER JOIN roles_securite rs ON rs.id = us.role_id
    WHERE us.id = ${utilisateurId}
    LIMIT 1
  `;

  const utilisateur = utilisateurs[0];
  if (!utilisateur) notFound();

  const [
    permissions,
    personnelles,
    annees,
    sections,
    classes,
    matieres,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: number;
      module: string;
      code: string;
      nom: string;
      action: string;
    }>>`
      SELECT id, module, code, nom, action
      FROM permissions_securite
      WHERE actif = 1
      ORDER BY module, nom
    `,
    prisma.$queryRaw<Array<{
      id: number;
      permission_nom: string;
      permission_code: string;
      decision: string;
      date_debut: Date | null;
      date_fin: Date | null;
      classe_nom: string | null;
      matiere_nom: string | null;
      annee_nom: string | null;
      devise: string | null;
    }>>`
      SELECT
        up.id,
        p.nom AS permission_nom,
        p.code AS permission_code,
        up.decision,
        up.date_debut,
        up.date_fin,
        c.nom AS classe_nom,
        m.nom AS matiere_nom,
        a.libelle AS annee_nom,
        up.devise
      FROM utilisateurs_permissions_securite up
      INNER JOIN permissions_securite p ON p.id = up.permission_id
      LEFT JOIN classes c ON c.id = up.classe_id
      LEFT JOIN matieres m ON m.id = up.matiere_id
      LEFT JOIN annees_scolaires a ON a.id = up.annee_scolaire_id
      WHERE up.utilisateur_id = ${utilisateurId}
      ORDER BY p.module, p.nom
    `,
    prisma.anneeScolaire.findMany({ orderBy: { dateDebut: "desc" } }),
    prisma.section.findMany({ orderBy: { nom: "asc" } }),
    prisma.classe.findMany({ orderBy: { nom: "asc" } }),
    prisma.matiere.findMany({ orderBy: { nom: "asc" } }),
  ]);

  const modules = [...new Set(permissions.map((p) => p.module))];

  return (
    <AdminShell
      utilisateur={administrateur}
      titre={`Permissions — ${utilisateur.nom}`}
      description={`Rôle principal : ${utilisateur.role_nom}. Les permissions personnelles ont priorité sur le rôle.`}
    >
      <RetourDashboard />

      <div className={styles.navigationInterne}>
        <Link href="/dashboard/securite/utilisateurs">← Retour aux utilisateurs</Link>
      </div>

      <section className={styles.panel}>
        <h2>Attribuer une permission personnelle</h2>

        <form
          action={enregistrerPermissionUtilisateur.bind(null, utilisateurId)}
          className={styles.formulaire}
        >
          <label>
            <span>Permission *</span>
            <select name="permission_id" required defaultValue="">
              <option value="" disabled>Sélectionner</option>
              {modules.map((module) => (
                <optgroup key={module} label={module}>
                  {permissions
                    .filter((permission) => permission.module === module)
                    .map((permission) => (
                      <option key={permission.id} value={permission.id}>
                        {permission.nom} — {permission.action}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label>
            <span>Décision *</span>
            <select name="decision" defaultValue="AUTORISER">
              <option value="AUTORISER">Autoriser</option>
              <option value="REFUSER">Refuser explicitement</option>
            </select>
          </label>

          <label>
            <span>Année scolaire</span>
            <select name="annee_scolaire_id" defaultValue="">
              <option value="">Toutes</option>
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>{annee.libelle}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Section</span>
            <select name="section_id" defaultValue="">
              <option value="">Toutes</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.nom}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Classe</span>
            <select name="classe_id" defaultValue="">
              <option value="">Toutes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.nom}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Matière</span>
            <select name="matiere_id" defaultValue="">
              <option value="">Toutes</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>{matiere.nom}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Devise</span>
            <select name="devise" defaultValue="">
              <option value="">Toutes</option>
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label>
            <span>Date de début</span>
            <input type="datetime-local" name="date_debut" />
          </label>

          <label>
            <span>Date de fin</span>
            <input type="datetime-local" name="date_fin" />
          </label>

          <button type="submit">
            <Save size={17} />
            Enregistrer
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Permissions personnelles actuelles</h2>

        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Décision</th>
                <th>Année</th>
                <th>Classe</th>
                <th>Matière</th>
                <th>Devise</th>
                <th>Période</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {personnelles.map((permission) => (
                <tr key={permission.id}>
                  <td>
                    <strong>{permission.permission_nom}</strong>
                    <small>{permission.permission_code}</small>
                  </td>
                  <td>
                    <span
                      className={
                        permission.decision === "AUTORISER"
                          ? styles.vert
                          : styles.rouge
                      }
                    >
                      {permission.decision}
                    </span>
                  </td>
                  <td>{permission.annee_nom ?? "Toutes"}</td>
                  <td>{permission.classe_nom ?? "Toutes"}</td>
                  <td>{permission.matiere_nom ?? "Toutes"}</td>
                  <td>{permission.devise ?? "Toutes"}</td>
                  <td>
                    {permission.date_debut
                      ? new Date(permission.date_debut).toLocaleDateString("fr-FR")
                      : "Sans début"}
                    {" → "}
                    {permission.date_fin
                      ? new Date(permission.date_fin).toLocaleDateString("fr-FR")
                      : "Sans fin"}
                  </td>
                  <td>
                    <form
                      action={supprimerPermissionUtilisateur.bind(
                        null,
                        utilisateurId,
                        permission.id
                      )}
                    >
                      <button type="submit" className={styles.actionSecondaire}>
                        <Trash2 size={15} />
                        Retirer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {!personnelles.length && (
                <tr>
                  <td colSpan={8}>
                    Aucune permission personnelle. Les droits viennent uniquement des rôles.
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
