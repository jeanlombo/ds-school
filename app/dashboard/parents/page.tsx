import Link from "next/link";
import { redirect } from "next/navigation";
import {
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import { basculerCompte } from "./actions";
import styles from "./parents.module.css";

export const dynamic = "force-dynamic";

type Parent = {
  id: number;
  nom: string;
  postnom: string | null;
  prenom: string;
  telephone_principal: string;
  whatsapp: string | null;
  email: string | null;
  profession: string | null;
  actif: number | boolean;
  identifiant: string | null;
  statut_compte: string | null;
  derniere_connexion: Date | null;
  nombre_enfants: number | bigint;
};

type Props = {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    lien?: string;
  }>;
};

export default async function PageParents({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const recherche = String(params.q ?? "").trim();
  const statut = String(params.statut ?? "").trim();
  const lien = String(params.lien ?? "").trim();

  const parents = await prisma.$queryRaw<Parent[]>`
    SELECT
      p.id,
      p.nom,
      p.postnom,
      p.prenom,
      p.telephone_principal,
      p.whatsapp,
      p.email,
      p.profession,
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
        ${recherche} = ''
        OR p.nom LIKE CONCAT('%', ${recherche}, '%')
        OR p.postnom LIKE CONCAT('%', ${recherche}, '%')
        OR p.prenom LIKE CONCAT('%', ${recherche}, '%')
        OR p.telephone_principal LIKE CONCAT('%', ${recherche}, '%')
        OR p.whatsapp LIKE CONCAT('%', ${recherche}, '%')
        OR p.email LIKE CONCAT('%', ${recherche}, '%')
        OR cp.identifiant LIKE CONCAT('%', ${recherche}, '%')
        OR EXISTS (
          SELECT 1
          FROM parents_eleves pe2
          INNER JOIN eleves e2 ON e2.id = pe2.eleve_id
          WHERE pe2.parent_id = p.id
            AND (
              e2.matricule LIKE CONCAT('%', ${recherche}, '%')
              OR e2.nom LIKE CONCAT('%', ${recherche}, '%')
              OR e2.prenom LIKE CONCAT('%', ${recherche}, '%')
            )
        )
      )
      AND (
        ${statut} = ''
        OR cp.statut = ${statut}
      )
      AND (
        ${lien} = ''
        OR EXISTS (
          SELECT 1
          FROM parents_eleves pe3
          WHERE pe3.parent_id = p.id
            AND pe3.lien_parente = ${lien}
        )
      )
    GROUP BY
      p.id, p.nom, p.postnom, p.prenom,
      p.telephone_principal, p.whatsapp,
      p.email, p.profession, p.actif,
      cp.identifiant, cp.statut, cp.derniere_connexion
    ORDER BY p.nom ASC, p.prenom ASC
    LIMIT 500
  `;

  const actifs = parents.filter(
    (parent) => parent.statut_compte === "ACTIF"
  ).length;
  const inactifs = parents.filter(
    (parent) => parent.statut_compte === "INACTIF"
  ).length;
  const avecEnfants = parents.filter(
    (parent) => Number(parent.nombre_enfants) > 0
  ).length;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Comptes Parents"
      description="Gérez les parents, leurs comptes d’accès et leurs relations avec les élèves."
      action={
        <Link href="/dashboard/parents/nouveau" className={styles.primaire}>
          <Plus size={18} />
          Nouveau parent
        </Link>
      }
    >
      <RetourDashboard />

      <section className={styles.stats}>
        <article>
          <UsersRound />
          <div><small>Total parents</small><strong>{parents.length}</strong></div>
        </article>
        <article>
          <UserRoundCheck />
          <div><small>Comptes actifs</small><strong>{actifs}</strong></div>
        </article>
        <article>
          <KeyRound />
          <div><small>Comptes inactifs</small><strong>{inactifs}</strong></div>
        </article>
        <article>
          <ShieldCheck />
          <div><small>Parents liés</small><strong>{avecEnfants}</strong></div>
        </article>
      </section>

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <div className={styles.recherche}>
            <Search size={18} />
            <input
              name="q"
              defaultValue={recherche}
              placeholder="Nom, téléphone, enfant, matricule..."
            />
          </div>

          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="INACTIF">Inactifs</option>
            <option value="BLOQUE">Bloqués</option>
          </select>

          <select name="lien" defaultValue={lien}>
            <option value="">Tous les liens</option>
            <option value="PERE">Père</option>
            <option value="MERE">Mère</option>
            <option value="TUTEUR">Tuteur</option>
            <option value="RESPONSABLE_LEGAL">Responsable légal</option>
            <option value="AUTRE">Autre</option>
          </select>

          <button type="submit">Filtrer</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Parent</th>
                <th>Contacts</th>
                <th>Profession</th>
                <th>Identifiant</th>
                <th>Enfants</th>
                <th>Dernière connexion</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => {
                const actif = parent.statut_compte === "ACTIF";

                return (
                  <tr key={parent.id}>
                    <td>
                      <Link
                        href={`/dashboard/parents/${parent.id}`}
                        className={styles.nomParent}
                      >
                        {parent.nom} {parent.postnom ?? ""} {parent.prenom}
                      </Link>
                    </td>
                    <td>
                      {parent.telephone_principal}
                      <small>{parent.email ?? parent.whatsapp ?? "—"}</small>
                    </td>
                    <td>{parent.profession ?? "—"}</td>
                    <td>{parent.identifiant ?? "Non créé"}</td>
                    <td>{Number(parent.nombre_enfants)}</td>
                    <td>
                      {parent.derniere_connexion
                        ? new Date(parent.derniere_connexion).toLocaleString("fr-FR")
                        : "Jamais"}
                    </td>
                    <td>
                      <span className={actif ? styles.vert : styles.rouge}>
                        {parent.statut_compte ?? "INACTIF"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsLigne}>
                        <Link
                          href={`/dashboard/parents/${parent.id}`}
                          className={styles.action}
                        >
                          Ouvrir
                        </Link>
                        <form action={basculerCompte.bind(null, parent.id, actif)}>
                          <button type="submit" className={styles.actionSecondaire}>
                            {actif ? "Désactiver" : "Activer"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!parents.length && (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.vide}>
                      <UsersRound size={44} />
                      <h2>Aucun parent enregistré</h2>
                      <p>Créez un compte parent et reliez-le à un ou plusieurs élèves.</p>
                      <Link href="/dashboard/parents/nouveau">Créer le premier parent</Link>
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
