import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Link2,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
  UserX,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { lierCompteParent } from "./actions";
import styles from "../parents.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

type ParentDisponible = {
  id: number;
  nom_complet: string;
  telephone: string | null;
};

type CompteDisponible = {
  id: number;
  nom: string;
  email: string;
};

type LiaisonPortail = {
  parent_id: number;
  parent_nom: string;
  parent_telephone: string | null;
  compte_nom: string;
  compte_email: string;
  actif: number | boolean;
  created_at: Date;
};

export default async function Page({ searchParams }: Props) {
  await exigerPermission("PARENTS_COMPTES_PORTAIL_GERER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [parents, comptes, liaisons] = await Promise.all([
    prisma.$queryRaw<ParentDisponible[]>`
      SELECT
        id,
        CONCAT_WS(' ', nom, postnom, prenom) AS nom_complet,
        telephone_principal AS telephone
      FROM parents
      WHERE ecole_id = ${ecole.id}
        AND actif = 1
      ORDER BY nom ASC, postnom ASC, prenom ASC
    `,

    prisma.$queryRaw<CompteDisponible[]>`
      SELECT id, nom, email
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecole.id}
        AND statut = 'ACTIF'
      ORDER BY nom ASC
    `,

    prisma.$queryRaw<LiaisonPortail[]>`
      SELECT
        p.id AS parent_id,
        CONCAT_WS(' ', p.nom, p.postnom, p.prenom) AS parent_nom,
        p.telephone_principal AS parent_telephone,
        us.nom AS compte_nom,
        us.email AS compte_email,
        pup.actif,
        pup.created_at
      FROM parents_utilisateurs_portail pup
      INNER JOIN parents p
        ON p.id = pup.parent_id
      INNER JOIN utilisateurs_securite us
        ON us.id = pup.utilisateur_securite_id
      WHERE pup.ecole_id = ${ecole.id}
      ORDER BY pup.actif DESC, parent_nom ASC
    `,
  ]);

  const liaisonsActives = liaisons.filter((liaison) => Boolean(liaison.actif));
  const parentsLies = new Set(liaisonsActives.map((liaison) => liaison.parent_id));
  const nombreSansCompte = Math.max(parents.length - parentsLies.size, 0);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Comptes Parents V2"
      description="Reliez les dossiers parents aux comptes de connexion DS School."
    >
      <section className={styles.heroComptesParents}>
        <div>
          <span>PORTAIL FAMILLE SÉCURISÉ</span>
          <h2>Gérez les accès des parents en toute simplicité</h2>
          <p>
            Associez chaque dossier parent à un compte utilisateur afin de lui
            permettre de consulter ses enfants, paiements, bulletins, présences,
            alertes et convocations.
          </p>
        </div>
        <ShieldCheck size={76} />
      </section>

      <section className={styles.statsComptesParents}>
        <article>
          <span><UsersRound size={23} /></span>
          <div>
            <small>Parents actifs</small>
            <strong>{parents.length}</strong>
          </div>
        </article>

        <article>
          <span><UserRoundCog size={23} /></span>
          <div>
            <small>Comptes disponibles</small>
            <strong>{comptes.length}</strong>
          </div>
        </article>

        <article>
          <span><CheckCircle2 size={23} /></span>
          <div>
            <small>Liaisons actives</small>
            <strong>{liaisonsActives.length}</strong>
          </div>
        </article>

        <article>
          <span><UserX size={23} /></span>
          <div>
            <small>Parents sans compte</small>
            <strong>{nombreSansCompte}</strong>
          </div>
        </article>
      </section>

      {params.succes === "liaison" && (
        <div className={styles.succes}>
          Le compte parent a été lié avec succès.
        </div>
      )}

      {params.erreur && (
        <div className={styles.erreur}>
          Veuillez sélectionner un dossier parent et un compte utilisateur valides.
        </div>
      )}

      <section className={`${styles.panel} ${styles.panelLiaisonParent}`}>
        <div className={styles.entetePanelParent}>
          <div className={styles.iconeTitreParent}>
            <Link2 size={22} />
          </div>
          <div>
            <span>NOUVEL ACCÈS</span>
            <h2>Créer une liaison Parent–Compte</h2>
            <p>
              Sélectionnez le dossier du parent puis le compte qui lui servira à se connecter.
            </p>
          </div>
        </div>

        <form action={lierCompteParent} className={styles.formulaireLiaisonParent}>
          <label>
            <span>Dossier parent *</span>
            <select name="parent_id" required defaultValue="">
              <option value="" disabled>
                Sélectionner un parent
              </option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.nom_complet}
                  {parent.telephone ? ` — ${parent.telephone}` : ""}
                </option>
              ))}
            </select>
            <small>{parents.length} dossier(s) parent disponible(s)</small>
          </label>

          <label>
            <span>Compte utilisateur *</span>
            <select name="utilisateur_securite_id" required defaultValue="">
              <option value="" disabled>
                Sélectionner un compte de connexion
              </option>
              {comptes.map((compte) => (
                <option key={compte.id} value={compte.id}>
                  {compte.nom} — {compte.email}
                </option>
              ))}
            </select>
            <small>{comptes.length} compte(s) actif(s) disponible(s)</small>
          </label>

          <button type="submit" className={styles.boutonLiaisonParent}>
            <UserRoundCog size={18} />
            Lier le compte
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.enteteListeParents}>
          <div>
            <span>ACCÈS EXISTANTS</span>
            <h2>Liaisons des comptes parents</h2>
            <p>
              Consultez les parents déjà associés à un compte de connexion DS School.
            </p>
          </div>
          <strong>{liaisons.length} liaison(s)</strong>
        </div>

        <div className={styles.tableauComptesParents}>
          <table>
            <thead>
              <tr>
                <th>Parent</th>
                <th>Téléphone</th>
                <th>Compte utilisateur</th>
                <th>Email</th>
                <th>Création</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {liaisons.map((liaison, index) => (
                <tr key={`${liaison.parent_id}-${liaison.compte_email}-${index}`}>
                  <td>
                    <div className={styles.identiteParentLiaison}>
                      <span>
                        {(liaison.parent_nom.trim().slice(0, 1) || "P").toUpperCase()}
                      </span>
                      <strong>{liaison.parent_nom}</strong>
                    </div>
                  </td>
                  <td>{liaison.parent_telephone || "Non renseigné"}</td>
                  <td><strong>{liaison.compte_nom}</strong></td>
                  <td>{liaison.compte_email}</td>
                  <td>
                    {new Date(liaison.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td>
                    <span
                      className={
                        liaison.actif
                          ? styles.statutCompteActif
                          : styles.statutCompteInactif
                      }
                    >
                      {liaison.actif ? "ACTIF" : "INACTIF"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!liaisons.length && (
          <div className={styles.videCompteParent}>
            <UserRoundCog size={46} />
            <h3>Aucune liaison enregistrée</h3>
            <p>Utilisez le formulaire ci-dessus pour créer le premier accès parent.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
