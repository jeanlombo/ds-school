import { redirect } from "next/navigation";
import { Link2, UserRoundCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { lierCompteParent } from "./actions";
import styles from "../../parent/parent.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  await exigerPermission("PARENTS_COMPTES_PORTAIL_GERER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [parents, comptes, liaisons] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: number;
        nom_complet: string;
        telephone: string;
      }>
    >`
      SELECT
        id,
        CONCAT_WS(' ', nom, postnom, prenom) AS nom_complet,
        telephone_principal AS telephone
      FROM parents
      WHERE ecole_id = ${ecole.id}
        AND actif = 1
      ORDER BY nom ASC, prenom ASC
    `,
    prisma.$queryRaw<
      Array<{
        id: number;
        nom: string;
        email: string;
      }>
    >`
      SELECT id, nom, email
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecole.id}
        AND statut = 'ACTIF'
      ORDER BY nom ASC
    `,
    prisma.$queryRaw<
      Array<{
        parent_nom: string;
        compte_nom: string;
        compte_email: string;
        actif: number;
      }>
    >`
      SELECT
        CONCAT_WS(' ', p.nom, p.postnom, p.prenom)
          AS parent_nom,
        us.nom AS compte_nom,
        us.email AS compte_email,
        pup.actif
      FROM parents_utilisateurs_portail pup
      INNER JOIN parents p ON p.id = pup.parent_id
      INNER JOIN utilisateurs_securite us
        ON us.id = pup.utilisateur_securite_id
      WHERE pup.ecole_id = ${ecole.id}
      ORDER BY pup.actif DESC, parent_nom ASC
    `,
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Comptes Parents V2"
      description="Reliez un dossier parent à un compte de connexion DS School."
    >
      {params.succes && (
        <div className={styles.succes}>
          Compte parent lié avec succès.
        </div>
      )}

      {params.erreur && (
        <div className={styles.erreur}>
          Veuillez sélectionner le parent et le compte.
        </div>
      )}

      <section className={styles.panel}>
        <h2>
          <Link2 size={20} />
          Nouvelle liaison
        </h2>

        <form
          action={lierCompteParent}
          className={styles.formulaire}
        >
          <label>
            <span>Dossier parent *</span>
            <select
              name="parent_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner un parent
              </option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.nom_complet} — {parent.telephone}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Compte utilisateur *</span>
            <select
              name="utilisateur_securite_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner un compte
              </option>
              {comptes.map((compte) => (
                <option key={compte.id} value={compte.id}>
                  {compte.nom} — {compte.email}
                </option>
              ))}
            </select>
          </label>

          <button type="submit">
            <UserRoundCog size={18} />
            Lier le compte
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Liaisons existantes</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Parent</th>
                <th>Compte</th>
                <th>Email</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {liaisons.map((liaison, index) => (
                <tr key={`${liaison.compte_email}-${index}`}>
                  <td>{liaison.parent_nom}</td>
                  <td>{liaison.compte_nom}</td>
                  <td>{liaison.compte_email}</td>
                  <td>{liaison.actif ? "ACTIF" : "INACTIF"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
