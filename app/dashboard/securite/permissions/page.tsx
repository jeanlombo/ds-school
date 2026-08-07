import { redirect } from "next/navigation";
import {
  KeyRound,
  Save,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";

import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { enregistrerPermissionsRole } from "../actions";

import styles from "../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    roleId?: string;
    succes?: string;
    erreur?: string;
  }>;
};

type Role = {
  id: number;
  code: string;
  nom: string;
};

type Permission = {
  id: number;
  module: string;
  code: string;
  nom: string;
  action: string;
};


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

export default async function PagePermissions({
  searchParams,
}: Props) {
  const utilisateur =
    await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const proprietaire = !utilisateur.superAdministrateur &&
    await estProprietaireGroupe(utilisateur.email);

  const autorise =
    utilisateur.superAdministrateur === true ||
    utilisateur.permissions?.includes("*") ||
    utilisateur.permissions?.includes("SECURITE_PERMISSIONS") ||
    proprietaire;

  if (!autorise) {
    redirect("/acces-refuse?permission=SECURITE_PERMISSIONS");
  }

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const roles = await prisma.$queryRaw<Role[]>`
    SELECT
      id,
      code,
      nom
    FROM roles_securite
    WHERE ecole_id = ${ecole.id}
      AND actif = 1
      AND (${utilisateur.superAdministrateur ? 1 : 0} = 1 OR systeme = 0)
      AND (${utilisateur.superAdministrateur ? 1 : 0} = 1 OR code NOT IN ('SUPER_ADMIN', 'PROPRIETAIRE_GROUPE'))
    ORDER BY
      CASE
        WHEN code = 'SUPER_ADMIN' THEN 0
        ELSE 1
      END,
      nom ASC
  `;

  const premierRoleId =
    roles[0]?.id ?? 0;

  const roleIdBrut = Number(
    params.roleId ?? premierRoleId
  );

  const roleId =
    Number.isInteger(roleIdBrut) &&
    roleIdBrut > 0
      ? roleIdBrut
      : premierRoleId;

  const roleSelectionne =
    roles.find((role) => role.id === roleId) ??
    null;

  const estSuperAdministrateur =
    roleSelectionne?.code === "SUPER_ADMIN";

  const [permissions, selectionnees] =
    await Promise.all([
      prisma.$queryRaw<Permission[]>`
        SELECT
          id,
          module,
          code,
          nom,
          action
        FROM permissions_securite
        WHERE actif = 1
          AND (
            ${proprietaire ? 1 : 0} = 0
            OR (
              code <> '*'
              AND code NOT LIKE 'SECURITE\_%' ESCAPE '\\'
              AND code NOT LIKE 'SUPER_ADMIN\_%' ESCAPE '\\'
              AND code NOT LIKE 'SAAS\_%' ESCAPE '\\'
              AND code NOT LIKE 'LICENCE\_%' ESCAPE '\\'
              AND code NOT LIKE 'ABONNEMENT\_%' ESCAPE '\\'
              AND code NOT LIKE 'ORGANISATION\_%' ESCAPE '\\'
            )
          )
        ORDER BY
          module ASC,
          action ASC,
          nom ASC
      `,

      roleId && !estSuperAdministrateur
        ? prisma.$queryRaw<
            Array<{
              permission_id: number;
            }>
          >`
            SELECT permission_id
            FROM roles_permissions_securite
            WHERE role_id = ${roleId}
          `
        : Promise.resolve([]),
    ]);

  const setSelection = new Set(
    selectionnees.map((selection) =>
      Number(selection.permission_id)
    )
  );

  const modules = [
    ...new Set(
      permissions.map(
        (permission) => permission.module
      )
    ),
  ];

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Permissions"
      description="Attribuez des droits granulaires par module et par action."
    >
      <RetourDashboard />

      {params.succes === "enregistrement" && (
        <div className={styles.succes}>
          Permissions enregistrées avec succès.
        </div>
      )}

      {params.erreur ===
        "role_introuvable" && (
        <div className={styles.erreur}>
          Le rôle sélectionné est introuvable.
        </div>
      )}

      {params.erreur === "role_systeme_protege" && (
        <div className={styles.erreur}>
          Ce rôle système est protégé et ne peut pas être modifié par un propriétaire.
        </div>
      )}

      {params.erreur ===
        "enregistrement" && (
        <div className={styles.erreur}>
          Une erreur a empêché
          l’enregistrement des permissions.
          Consultez le terminal pour voir le
          détail.
        </div>
      )}

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <label>
            <span>Rôle à configurer</span>

            <select
              name="roleId"
              defaultValue={roleId}
            >
              {roles.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.nom}
                </option>
              ))}
            </select>
          </label>

          <button type="submit">
            Afficher
          </button>
        </form>
      </section>

      {!roleId || !roleSelectionne ? (
        <div className={styles.erreur}>
          Créez d’abord un rôle.
        </div>
      ) : estSuperAdministrateur ? (
        <>
          <div className={styles.succes}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ShieldCheck size={22} />

              <div>
                <strong>
                  Accès intégral automatique
                </strong>

                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  Le rôle Super Administrateur
                  possède automatiquement toutes
                  les permissions. Ses droits sont
                  protégés et ne doivent pas être
                  enregistrés manuellement.
                </div>
              </div>
            </div>
          </div>

          <section
            className={
              styles.matricePermissions
            }
          >
            {modules.map((module) => {
              const permissionsModule =
                permissions.filter(
                  (permission) =>
                    permission.module === module
                );

              return (
                <article key={module}>
                  <header>
                    <KeyRound size={20} />
                    <h3>{module}</h3>
                  </header>

                  <div>
                    {permissionsModule.map(
                      (permission) => (
                        <label
                          key={permission.id}
                          style={{
                            cursor: "default",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked
                            disabled
                            readOnly
                          />

                          <span>
                            {permission.nom}
                          </span>

                          <small>
                            {permission.action}
                          </small>
                        </label>
                      )
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <div className={styles.succes}>
            Toutes les {permissions.length}{" "}
            permissions actives sont accordées
            automatiquement au Super
            Administrateur.
          </div>
        </>
      ) : (
        <form
          action={enregistrerPermissionsRole}
        >
          <input
            type="hidden"
            name="role_id"
            value={roleId}
          />

          <section
            className={
              styles.matricePermissions
            }
          >
            {modules.map((module) => {
              const permissionsModule =
                permissions.filter(
                  (permission) =>
                    permission.module === module
                );

              return (
                <article key={module}>
                  <header>
                    <KeyRound size={20} />

                    <h3>{module}</h3>
                  </header>

                  <div>
                    {permissionsModule.map(
                      (permission) => (
                        <label
                          key={permission.id}
                        >
                          <input
                            type="checkbox"
                            name="permissions"
                            value={permission.id}
                            defaultChecked={setSelection.has(
                              permission.id
                            )}
                          />

                          <span>
                            {permission.nom}
                          </span>

                          <small>
                            {permission.action}
                          </small>
                        </label>
                      )
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <div
            className={
              styles.actionsFinales
            }
          >
            <button
              type="submit"
              className={styles.primaire}
            >
              <Save size={17} />
              Enregistrer les permissions
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}