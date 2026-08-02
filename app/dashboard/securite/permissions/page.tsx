import { redirect } from "next/navigation";
import { KeyRound, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { enregistrerPermissionsRole } from "../actions";
import styles from "../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ roleId?: string; succes?: string }>;
};

type Role = {
  id: number;
  nom: string;
};

type Permission = {
  id: number;
  module: string;
  code: string;
  nom: string;
  action: string;
};

export default async function PagePermissions({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const roles = await prisma.$queryRaw<Role[]>`
    SELECT id, nom
    FROM roles_securite
    WHERE ecole_id = ${ecole.id}
      AND actif = 1
    ORDER BY nom ASC
  `;

  const roleId = Number(params.roleId ?? roles[0]?.id ?? 0);

  const [permissions, selectionnees] = await Promise.all([
    prisma.$queryRaw<Permission[]>`
      SELECT id, module, code, nom, action
      FROM permissions_securite
      WHERE actif = 1
      ORDER BY module ASC, action ASC
    `,
    roleId
      ? prisma.$queryRaw<Array<{ permission_id: number }>>`
          SELECT permission_id
          FROM roles_permissions_securite
          WHERE role_id = ${roleId}
        `
      : Promise.resolve([]),
  ]);

  const setSelection = new Set(selectionnees.map((x) => Number(x.permission_id)));
  const modules = [...new Set(permissions.map((p) => p.module))];

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Permissions"
      description="Attribuez des droits granulaires par module et par action."
    >
      <RetourDashboard />

      {params.succes && <div className={styles.succes}>Permissions enregistrées.</div>}

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <label>
            <span>Rôle à configurer</span>
            <select name="roleId" defaultValue={roleId}>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.nom}</option>
              ))}
            </select>
          </label>
          <button type="submit">Afficher</button>
        </form>
      </section>

      {roleId ? (
        <form action={enregistrerPermissionsRole.bind(null, roleId)}>
          <section className={styles.matricePermissions}>
            {modules.map((module) => (
              <article key={module}>
                <header>
                  <KeyRound size={20}/>
                  <h3>{module}</h3>
                </header>

                <div>
                  {permissions
                    .filter((permission) => permission.module === module)
                    .map((permission) => (
                      <label key={permission.id}>
                        <input
                          type="checkbox"
                          name="permissions"
                          value={permission.id}
                          defaultChecked={setSelection.has(permission.id)}
                        />
                        <span>{permission.nom}</span>
                        <small>{permission.action}</small>
                      </label>
                    ))}
                </div>
              </article>
            ))}
          </section>

          <div className={styles.actionsFinales}>
            <button type="submit" className={styles.primaire}>
              <Save size={17}/>
              Enregistrer les permissions
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.erreur}>Créez d’abord un rôle.</div>
      )}
    </AdminShell>
  );
}
