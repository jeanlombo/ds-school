import Link from "next/link";
import { redirect } from "next/navigation";
import {
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import {
  creerUtilisateurEnterprise,
  synchroniserTousLesUtilisateurs,
} from "./actions";
import styles from "../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    succes?: string;
    erreur?: string;
    nombre?: string;
  }>;
};

export default async function PageUtilisateurs({ searchParams }: Props) {
  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  const params = await searchParams;
  const recherche = String(params.q ?? "").trim();
  const statut = String(params.statut ?? "").trim();

  const ecole = await prisma.ecole.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!ecole) {
    throw new Error("Aucune école configurée.");
  }

  const [roles, utilisateurs] = await Promise.all([
    prisma.$queryRaw<Array<{ id: number; nom: string; code: string }>>`
      SELECT id, nom, code
      FROM roles_securite
      WHERE ecole_id = ${ecole.id}
        AND actif = 1
      ORDER BY systeme DESC, nom ASC
    `,
    prisma.$queryRaw<
      Array<{
        id: number;
        nom: string;
        email: string;
        telephone: string | null;
        statut: string;
        role_nom: string;
        role_code: string;
        derniere_connexion: Date | null;
        nombre_permissions: number | bigint;
      }>
    >`
      SELECT
        us.id,
        us.nom,
        us.email,
        us.telephone,
        us.statut,
        rs.nom AS role_nom,
        rs.code AS role_code,
        us.derniere_connexion,
        COUNT(DISTINCT rp.permission_id) AS nombre_permissions
      FROM utilisateurs_securite us
      INNER JOIN utilisateurs_roles_securite ur
        ON ur.utilisateur_id = us.id
        AND ur.actif = 1
        AND ur.principal = 1
      INNER JOIN roles_securite rs ON rs.id = ur.role_id
      LEFT JOIN roles_permissions_securite rp ON rp.role_id = rs.id
      WHERE us.ecole_id = ${ecole.id}
        AND (
          ${recherche} = ''
          OR us.nom LIKE CONCAT('%', ${recherche}, '%')
          OR us.email LIKE CONCAT('%', ${recherche}, '%')
          OR us.telephone LIKE CONCAT('%', ${recherche}, '%')
          OR rs.nom LIKE CONCAT('%', ${recherche}, '%')
        )
        AND (${statut} = '' OR us.statut = ${statut})
      GROUP BY
        us.id,
        us.nom,
        us.email,
        us.telephone,
        us.statut,
        rs.nom,
        rs.code,
        us.derniere_connexion
      ORDER BY us.nom ASC
    `,
  ]);

  return (
    <AdminShell
      utilisateur={administrateur}
      titre="Gestion des Utilisateurs"
      description="Créez et synchronisez les comptes, rôles et permissions sans utiliser phpMyAdmin."
    >
      <RetourDashboard />

      {params.succes === "creation" && (
        <div className={styles.succes}>
          Le compte a été créé et synchronisé dans tous les systèmes.
        </div>
      )}

      {params.succes === "synchronisation" && (
        <div className={styles.succes}>
          {params.nombre ?? "Tous les"} compte(s) ont été synchronisés.
        </div>
      )}

      {params.erreur && (
        <div className={styles.erreur}>
          {params.erreur === "doublon"
            ? "Cette adresse e-mail est déjà utilisée."
            : params.erreur === "roles_absents"
              ? "Aucun rôle actif n’est disponible."
              : "Veuillez vérifier les informations saisies."}
        </div>
      )}

      <section className={styles.panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginBottom: 5 }}>Réparation automatique</h2>
            <p style={{ margin: 0, color: "#64748b" }}>
              Ce bouton répare tous les anciens comptes et leurs rôles en une fois.
            </p>
          </div>

          <form action={synchroniserTousLesUtilisateurs}>
            <button type="submit">
              <RefreshCw size={17} />
              Synchroniser tous les comptes
            </button>
          </form>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Créer un utilisateur</h2>

        <form action={creerUtilisateurEnterprise} className={styles.formulaire}>
          <label>
            <span>Nom complet *</span>
            <input name="nom" required />
          </label>

          <label>
            <span>Email *</span>
            <input type="email" name="email" required />
          </label>

          <label>
            <span>Téléphone</span>
            <input name="telephone" />
          </label>

          <label>
            <span>Rôle principal *</span>
            <select name="role_id" required defaultValue="">
              <option value="" disabled>
                Sélectionner
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Mot de passe temporaire *</span>
            <input
              type="password"
              name="mot_de_passe"
              minLength={8}
              required
            />
          </label>

          <label>
            <span>Statut</span>
            <select name="statut" defaultValue="ACTIF">
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
              <option value="BLOQUE">Bloqué</option>
            </select>
          </label>

          <button type="submit">
            <UserPlus size={17} />
            Créer et synchroniser
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <div className={styles.recherche}>
            <Search size={18} />
            <input
              name="q"
              defaultValue={recherche}
              placeholder="Nom, email, téléphone ou rôle..."
            />
          </div>

          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="INACTIF">Inactifs</option>
            <option value="BLOQUE">Bloqués</option>
          </select>

          <button type="submit">Filtrer</button>
        </form>

        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle principal</th>
                <th>Permissions du rôle</th>
                <th>Dernière connexion</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {utilisateurs.map((utilisateur) => (
                <tr key={utilisateur.id}>
                  <td>
                    <strong>{utilisateur.nom}</strong>
                    <small>{utilisateur.telephone ?? "—"}</small>
                  </td>
                  <td>{utilisateur.email}</td>
                  <td>
                    {utilisateur.role_nom}
                    <small>{utilisateur.role_code}</small>
                  </td>
                  <td>{Number(utilisateur.nombre_permissions)}</td>
                  <td>
                    {utilisateur.derniere_connexion
                      ? new Date(
                          utilisateur.derniere_connexion
                        ).toLocaleString("fr-FR")
                      : "Jamais"}
                  </td>
                  <td>
                    <span
                      className={
                        utilisateur.statut === "ACTIF"
                          ? styles.vert
                          : styles.rouge
                      }
                    >
                      {utilisateur.statut}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/securite/utilisateurs/${utilisateur.id}`}
                      className={styles.actionSecondaire}
                    >
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}

              {!utilisateurs.length && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.vide}>
                      <UsersRound size={44} />
                      <p>Aucun compte synchronisé.</p>
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
