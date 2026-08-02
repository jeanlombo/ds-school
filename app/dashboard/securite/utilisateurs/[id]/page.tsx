import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../../RetourDashboard";
import {
  modifierUtilisateurEnterprise,
  reinitialiserMotDePasseUtilisateur,
} from "../actions";
import styles from "../../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ succes?: string; erreur?: string }>;
};

export default async function DetailUtilisateur({
  params,
  searchParams,
}: Props) {
  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  const { id } = await params;
  const query = await searchParams;
  const utilisateurId = Number(id);

  const ecole = await prisma.ecole.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!ecole) throw new Error("Aucune école configurée.");

  const [comptes, roles] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: number;
        nom: string;
        email: string;
        telephone: string | null;
        statut: string;
        role_id: number;
        role_nom: string;
        derniere_connexion: Date | null;
      }>
    >`
      SELECT
        us.id,
        us.nom,
        us.email,
        us.telephone,
        us.statut,
        ur.role_id,
        rs.nom AS role_nom,
        us.derniere_connexion
      FROM utilisateurs_securite us
      INNER JOIN utilisateurs_roles_securite ur
        ON ur.utilisateur_id = us.id
        AND ur.actif = 1
        AND ur.principal = 1
      INNER JOIN roles_securite rs ON rs.id = ur.role_id
      WHERE us.id = ${utilisateurId}
        AND us.ecole_id = ${ecole.id}
      LIMIT 1
    `,
    prisma.$queryRaw<Array<{ id: number; nom: string }>>`
      SELECT id, nom
      FROM roles_securite
      WHERE ecole_id = ${ecole.id}
        AND actif = 1
      ORDER BY systeme DESC, nom ASC
    `,
  ]);

  const compte = comptes[0];
  if (!compte) notFound();

  return (
    <AdminShell
      utilisateur={administrateur}
      titre={compte.nom}
      description="Modifiez le compte, le rôle principal, le statut et le mot de passe."
    >
      <RetourDashboard />

      <div className={styles.navigationInterne}>
        <Link href="/dashboard/securite/utilisateurs">
          ← Retour aux utilisateurs
        </Link>
      </div>

      {query.succes && (
        <div className={styles.succes}>
          {query.succes === "motdepasse"
            ? "Le mot de passe a été réinitialisé."
            : "Le compte a été modifié et synchronisé."}
        </div>
      )}

      {query.erreur && (
        <div className={styles.erreur}>
          Veuillez vérifier les informations saisies.
        </div>
      )}

      <section className={styles.stats}>
        <article>
          <ShieldCheck />
          <div>
            <small>Rôle principal</small>
            <strong>{compte.role_nom}</strong>
          </div>
        </article>
        <article>
          <KeyRound />
          <div>
            <small>Statut</small>
            <strong>{compte.statut}</strong>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <h2>Informations et rôle</h2>

        <form
          action={modifierUtilisateurEnterprise.bind(null, utilisateurId)}
          className={styles.formulaire}
        >
          <label>
            <span>Nom complet *</span>
            <input name="nom" required defaultValue={compte.nom} />
          </label>

          <label>
            <span>Email *</span>
            <input
              type="email"
              name="email"
              required
              defaultValue={compte.email}
            />
          </label>

          <label>
            <span>Téléphone</span>
            <input
              name="telephone"
              defaultValue={compte.telephone ?? ""}
            />
          </label>

          <label>
            <span>Rôle principal *</span>
            <select name="role_id" required defaultValue={compte.role_id}>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Statut</span>
            <select name="statut" defaultValue={compte.statut}>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
              <option value="BLOQUE">Bloqué</option>
            </select>
          </label>

          <button type="submit">
            <Save size={17} />
            Enregistrer et synchroniser
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Permissions de l’utilisateur</h2>
        <p>
          Le rôle donne les permissions de base. Les permissions personnelles
          peuvent ensuite ajouter ou refuser des droits précis.
        </p>

        <Link
          href={`/dashboard/securite/utilisateurs/${utilisateurId}/permissions`}
          className={styles.primaire}
        >
          <ShieldCheck size={17} />
          Configurer les permissions
        </Link>
      </section>

      <section className={styles.panel}>
        <h2>Réinitialiser le mot de passe</h2>

        <form
          action={reinitialiserMotDePasseUtilisateur.bind(
            null,
            utilisateurId
          )}
          className={styles.formulaire}
        >
          <label>
            <span>Nouveau mot de passe *</span>
            <input
              type="password"
              name="nouveau_mot_de_passe"
              minLength={8}
              required
            />
          </label>

          <button type="submit">
            <KeyRound size={17} />
            Réinitialiser
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
