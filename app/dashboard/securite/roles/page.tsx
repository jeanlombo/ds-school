import Link from "next/link";
import { redirect } from "next/navigation";
import {
  KeyRound,
  ShieldCheck,
  ShieldPlus,
  UserCog,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { creerRole } from "../actions";
import styles from "../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
    roleId?: string;
  }>;
};

type Role = {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  systeme: number | boolean;
  actif: number | boolean;
  nombre_permissions: bigint | number;
  nombre_utilisateurs: bigint | number;
};

function messageErreur(erreur?: string): string {
  switch (erreur) {
    case "code_existant":
      return "Un rôle utilisant déjà ce code existe dans cette école.";

    case "nom_existant":
      return "Un rôle utilisant déjà ce nom existe dans cette école.";

    case "super_admin_protege":
      return "Le rôle Super Administrateur est un rôle système protégé.";

    case "champs":
      return "Veuillez compléter le code et le nom du rôle.";

    case "role_protege":
      return "Ce code de rôle est réservé au système DS SCHOOL.";

    default:
      return "Une erreur empêche la création du rôle.";
  }
}


async function estProprietaireGroupe(email: string): Promise<boolean> {
  const lignes = await prisma.$queryRaw<Array<{ ok: number }>>`
    SELECT 1 AS ok
    FROM utilisateurs u
    INNER JOIN utilisateurs_organisations uo ON uo.utilisateur_id = u.id
    WHERE LOWER(u.email) = LOWER(${email})
      AND UPPER(uo.role_groupe) = 'PROPRIETAIRE'
      AND uo.actif = 1
    LIMIT 1
  `;
  return lignes.length > 0;
}

export default async function PageRoles({
  searchParams,
}: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const proprietaire = !utilisateur.superAdministrateur &&
    await estProprietaireGroupe(utilisateur.email);

  const autorise =
    utilisateur.superAdministrateur === true ||
    utilisateur.permissions?.includes("*") ||
    utilisateur.permissions?.includes("SECURITE_ROLES") ||
    proprietaire;

  if (!autorise) {
    redirect("/acces-refuse?permission=SECURITE_ROLES");
  }

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const roles = await prisma.$queryRaw<Role[]>`
    SELECT
      r.id,
      r.code,
      r.nom,
      r.description,
      r.systeme,
      r.actif,

      COUNT(
        DISTINCT rp.permission_id
      ) AS nombre_permissions,

      COUNT(
        DISTINCT CASE
          WHEN ur.actif = 1 THEN ur.utilisateur_id
          ELSE NULL
        END
      ) AS nombre_utilisateurs

    FROM roles_securite r

    LEFT JOIN roles_permissions_securite rp
      ON rp.role_id = r.id

    LEFT JOIN utilisateurs_roles_securite ur
      ON ur.role_id = r.id

    WHERE r.ecole_id = ${ecole.id}
      AND (${utilisateur.superAdministrateur ? 1 : 0} = 1 OR r.systeme = 0)
      AND (${utilisateur.superAdministrateur ? 1 : 0} = 1 OR r.code NOT IN ('SUPER_ADMIN', 'PROPRIETAIRE_GROUPE'))

    GROUP BY
      r.id,
      r.code,
      r.nom,
      r.description,
      r.systeme,
      r.actif

    ORDER BY
      r.systeme DESC,
      r.nom ASC
  `;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Rôles"
      description="Créez les rôles puis attribuez exactement les permissions nécessaires."
    >
      <RetourDashboard />

      {params.succes === "creation" && (
        <div className={styles.succes}>
          Le rôle a été créé avec succès. Il possède actuellement
          zéro permission jusqu’à sa configuration.
        </div>
      )}

      {params.erreur && (
        <div className={styles.erreur}>
          {messageErreur(params.erreur)}

          {params.roleId && (
            <div style={{ marginTop: 10 }}>
              <Link
                href={`/dashboard/securite/permissions?roleId=${params.roleId}`}
                style={{
                  color: "inherit",
                  fontWeight: 850,
                }}
              >
                Configurer le rôle existant
              </Link>
            </div>
          )}
        </div>
      )}

      <section className={styles.panel}>
        <h2>Nouveau rôle</h2>

        <p
          style={{
            marginTop: -8,
            marginBottom: 18,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Un rôle nouvellement créé ne reçoit aucune permission
          automatiquement. Les droits seront cochés ensuite dans la
          matrice des permissions.
        </p>

        <form
          action={creerRole}
          className={styles.formulaire}
        >
          <label>
            <span>Code *</span>

            <input
              name="code"
              required
              placeholder="DIRECTEUR_ETUDES"
              autoComplete="off"
            />
          </label>

          <label>
            <span>Nom *</span>

            <input
              name="nom"
              required
              placeholder="Directeur des Études"
              autoComplete="off"
            />
          </label>

          <label className={styles.large}>
            <span>Description</span>

            <textarea
              name="description"
              rows={3}
              placeholder="Décrivez les responsabilités de ce rôle."
            />
          </label>

          <button type="submit">
            <ShieldPlus size={17} />
            Créer le rôle
          </button>
        </form>
      </section>

      <section className={styles.cartesRoles}>
        {roles.map((role) => {
          const estSuperAdmin =
            role.code === "SUPER_ADMIN";

          const estActif =
            Boolean(role.actif);

          return (
            <article key={role.id}>
              {estSuperAdmin ? (
                <ShieldCheck size={30} />
              ) : (
                <UserCog size={30} />
              )}

              <div style={{ width: "100%" }}>
                <small>{role.code}</small>

                <h3>{role.nom}</h3>

                <p>
                  {role.description ??
                    "Aucune description enregistrée."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    flexWrap: "wrap",
                    marginBottom: 14,
                  }}
                >
                  <span>
                    <KeyRound size={13} />
                    {estSuperAdmin
                      ? "Accès global"
                      : `${Number(
                          role.nombre_permissions
                        )} permission(s)`}
                  </span>

                  <span>
                    <UsersRound size={13} />
                    {Number(
                      role.nombre_utilisateurs
                    )} utilisateur(s)
                  </span>

                  <span>
                    {estActif
                      ? "ACTIF"
                      : "INACTIF"}
                  </span>

                  {Boolean(role.systeme) && (
                    <span>RÔLE SYSTÈME</span>
                  )}
                </div>

                {estSuperAdmin ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      color: "#065f46",
                      background: "#d1fae5",
                      fontSize: ".78rem",
                      fontWeight: 800,
                    }}
                  >
                    Ce rôle possède automatiquement tous les accès.
                  </div>
                ) : (
                  <Link
                    href={`/dashboard/securite/permissions?roleId=${role.id}`}
                    className={styles.actionSecondaire}
                  >
                    <KeyRound size={15} />
                    Configurer les permissions
                  </Link>
                )}
              </div>
            </article>
          );
        })}

        {!roles.length && (
          <div className={styles.vide}>
            <UserCog size={46} />
            <h2>Aucun rôle</h2>
            <p>
              Créez le premier rôle de cette école.
            </p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}