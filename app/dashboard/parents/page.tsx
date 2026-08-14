import Link from "next/link";
import { redirect } from "next/navigation";
import {
  KeyRound,
  Search,
  ShieldCheck,
  UserPlus,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import { basculerCompte } from "./actions";
import styles from "./parents.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    succes?: string;
    erreur?: string;
  }>;
};

type ParentLigne = {
  id: number;
  nom_complet: string;
  telephone_principal: string;
  email: string | null;
  actif: number | boolean;
  identifiant: string | null;
  statut_compte: string | null;
  nombre_enfants: bigint | number;
  derniere_connexion: Date | null;
};

export default async function PageParents({ searchParams }: Props) {
  await exigerPermission("PARENTS_VOIR");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const q = String(params.q ?? "").trim();
  const statut = String(params.statut ?? "").trim().toUpperCase();

  const parents = await prisma.$queryRaw<ParentLigne[]>`
    SELECT
      p.id,
      CONCAT_WS(' ', p.nom, p.postnom, p.prenom) AS nom_complet,
      p.telephone_principal,
      p.email,
      p.actif,
      cp.identifiant,
      cp.statut AS statut_compte,
      cp.derniere_connexion,
      COUNT(DISTINCT pe.eleve_id) AS nombre_enfants
    FROM parents p
    LEFT JOIN comptes_parents cp
      ON cp.parent_id = p.id
      AND cp.ecole_id = p.ecole_id
    LEFT JOIN parents_eleves pe
      ON pe.parent_id = p.id
      AND pe.ecole_id = p.ecole_id
    WHERE p.ecole_id = ${ecole.id}
      AND (
        ${q} = ''
        OR p.nom LIKE CONCAT('%', ${q}, '%')
        OR p.postnom LIKE CONCAT('%', ${q}, '%')
        OR p.prenom LIKE CONCAT('%', ${q}, '%')
        OR p.telephone_principal LIKE CONCAT('%', ${q}, '%')
        OR p.email LIKE CONCAT('%', ${q}, '%')
        OR cp.identifiant LIKE CONCAT('%', ${q}, '%')
      )
      AND (
        ${statut} = ''
        OR (${statut} = 'ACTIF' AND p.actif = 1)
        OR (${statut} = 'INACTIF' AND p.actif = 0)
      )
    GROUP BY
      p.id,
      p.nom,
      p.postnom,
      p.prenom,
      p.telephone_principal,
      p.email,
      p.actif,
      cp.identifiant,
      cp.statut,
      cp.derniere_connexion
    ORDER BY p.nom ASC, p.prenom ASC
  `;

  const [totalParents, comptesActifs, enfantsLies, sansCompte] =
    await Promise.all([
      prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total
        FROM parents
        WHERE ecole_id = ${ecole.id}
      `,
      prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total
        FROM comptes_parents
        WHERE ecole_id = ${ecole.id}
          AND statut = 'ACTIF'
      `,
      prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(DISTINCT eleve_id) AS total
        FROM parents_eleves
        WHERE ecole_id = ${ecole.id}
      `,
      prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total
        FROM parents p
        LEFT JOIN comptes_parents cp
          ON cp.parent_id = p.id
          AND cp.ecole_id = p.ecole_id
        WHERE p.ecole_id = ${ecole.id}
          AND cp.id IS NULL
      `,
    ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Gestion des parents"
      description="Dossiers parents, comptes d'accès et liaisons avec les apprenants."
      action={
        <Link href="/dashboard/parents/nouveau" className={styles.primaire}>
          <UserPlus size={17} />
          Nouveau parent
        </Link>
      }
    >
      <RetourDashboard />

      {params.succes && (
        <div className={styles.succes}>
          L'opération a été effectuée avec succès.
        </div>
      )}

      {params.erreur && (
        <div className={styles.erreur}>
          Une erreur a empêché l'opération demandée.
        </div>
      )}

      <section className={styles.stats}>
        <article>
          <UsersRound />
          <div>
            <small>Parents enregistrés</small>
            <strong>{Number(totalParents[0]?.total ?? 0)}</strong>
          </div>
        </article>
        <article>
          <ShieldCheck />
          <div>
            <small>Comptes actifs</small>
            <strong>{Number(comptesActifs[0]?.total ?? 0)}</strong>
          </div>
        </article>
        <article>
          <UserRoundCog />
          <div>
            <small>Apprenants liés</small>
            <strong>{Number(enfantsLies[0]?.total ?? 0)}</strong>
          </div>
        </article>
        <article>
          <KeyRound />
          <div>
            <small>Sans compte portail</small>
            <strong>{Number(sansCompte[0]?.total ?? 0)}</strong>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <label className={styles.recherche}>
            <Search size={18} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nom, téléphone, email ou identifiant..."
            />
          </label>

          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="INACTIF">Inactifs</option>
          </select>

          <button type="submit">Rechercher</button>

          <Link
            href="/dashboard/parents/comptes-portail"
            className={styles.actionSecondaire}
          >
            <KeyRound size={16} />
            Comptes portail
          </Link>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Parent</th>
                <th>Contact</th>
                <th>Compte</th>
                <th>Enfants liés</th>
                <th>Statut</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => {
                const estActif = Boolean(parent.actif);
                const actionStatut = basculerCompte.bind(
                  null,
                  parent.id,
                  estActif
                );

                return (
                  <tr key={parent.id}>
                    <td>
                      <Link
                        href={`/dashboard/parents/${parent.id}`}
                        className={styles.nomParent}
                      >
                        {parent.nom_complet}
                      </Link>
                    </td>
                    <td>
                      {parent.telephone_principal}
                      <small>{parent.email ?? "Aucun email"}</small>
                    </td>
                    <td>
                      {parent.identifiant ?? "Non créé"}
                      <small>{parent.statut_compte ?? "SANS COMPTE"}</small>
                    </td>
                    <td>{Number(parent.nombre_enfants)}</td>
                    <td>
                      <span className={estActif ? styles.vert : styles.rouge}>
                        {estActif ? "ACTIF" : "INACTIF"}
                      </span>
                    </td>
                    <td>
                      {parent.derniere_connexion
                        ? new Date(parent.derniere_connexion).toLocaleString(
                            "fr-FR"
                          )
                        : "Jamais"}
                    </td>
                    <td>
                      <div className={styles.actionsLigne}>
                        <Link
                          href={`/dashboard/parents/${parent.id}`}
                          className={styles.actionSecondaire}
                        >
                          Ouvrir
                        </Link>
                        <form action={actionStatut}>
                          <button type="submit">
                            {estActif ? "Désactiver" : "Activer"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!parents.length && (
          <div className={styles.vide}>
            <UsersRound size={46} />
            <h2>Aucun parent trouvé</h2>
            <p>Modifiez les filtres ou créez un nouveau parent.</p>
            <Link href="/dashboard/parents/nouveau">Créer un parent</Link>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
