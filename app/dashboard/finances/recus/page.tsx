import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Eye,
  FileDown,
  FileText,
  Printer,
  Search,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import styles from "./module.module.css";

export const dynamic = "force-dynamic";

type Recu = {
  id: number;
  numero_recu: string;
  date_paiement: Date;
  montant_total: number;
  devise: string;
  mode_paiement: string;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  classe_nom: string | null;
  statut: string;
  nombre_impressions: number | bigint;
  derniere_impression: Date | null;
};

type Props = {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    devise?: string;
    date_debut?: string;
    date_fin?: string;
  }>;
};

export default async function PageRecus({
  searchParams,
}: Props) {
  await exigerPermission("FINANCES_RECUS_VOIR");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const recherche = String(params.q ?? "").trim();
  const statut = String(params.statut ?? "").trim();
  const devise = String(params.devise ?? "").trim();
  const dateDebut = String(params.date_debut ?? "").trim();
  const dateFin = String(params.date_fin ?? "").trim();

  const recus = await prisma.$queryRaw<Recu[]>`
    SELECT
      r.id,
      r.numero_recu,
      p.date_paiement,
      p.montant_total,
      p.devise,
      p.mode_paiement,
      e.matricule,
      e.nom,
      e.postnom,
      e.prenom,
      c.nom AS classe_nom,
      r.statut,
      (
        SELECT COUNT(*)
        FROM journal_impressions_recus ji
        WHERE ji.recu_id = r.id
      ) AS nombre_impressions,
      (
        SELECT MAX(ji.date_impression)
        FROM journal_impressions_recus ji
        WHERE ji.recu_id = r.id
      ) AS derniere_impression
    FROM recus_scolaires r
    INNER JOIN paiements_scolaires p
      ON p.id = r.paiement_id
    INNER JOIN inscriptions i
      ON i.id = p.inscription_id
    INNER JOIN eleves e
      ON e.id = i.eleve_id
    LEFT JOIN classes c
      ON c.id = i.classe_id
    WHERE r.ecole_id = ${ecole.id}
      AND (
        ${recherche} = ''
        OR r.numero_recu LIKE CONCAT('%', ${recherche}, '%')
        OR p.numero_paiement LIKE CONCAT('%', ${recherche}, '%')
        OR p.reference_transaction LIKE CONCAT('%', ${recherche}, '%')
        OR e.matricule LIKE CONCAT('%', ${recherche}, '%')
        OR e.nom LIKE CONCAT('%', ${recherche}, '%')
        OR e.postnom LIKE CONCAT('%', ${recherche}, '%')
        OR e.prenom LIKE CONCAT('%', ${recherche}, '%')
      )
      AND (${statut} = '' OR r.statut = ${statut})
      AND (${devise} = '' OR p.devise = ${devise})
      AND (${dateDebut} = '' OR DATE(p.date_paiement) >= ${dateDebut})
      AND (${dateFin} = '' OR DATE(p.date_paiement) <= ${dateFin})
    ORDER BY p.date_paiement DESC, r.id DESC
    LIMIT 500
  `;

  const valides = recus.filter((recu) => recu.statut === "VALIDE");
  const annules = recus.filter((recu) => recu.statut === "ANNULE");

  const totalCDF = valides
    .filter((recu) => recu.devise === "CDF")
    .reduce((somme, recu) => somme + Number(recu.montant_total), 0);

  const totalUSD = valides
    .filter((recu) => recu.devise === "USD")
    .reduce((somme, recu) => somme + Number(recu.montant_total), 0);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Historique des reçus"
      description="Consultez et réimprimez les reçus aux formats A4, A5 et POS."
    >
      <RetourDashboard />

      <section className={styles.stats}>
        <article>
          <FileText />
          <div>
            <small>Total reçus</small>
            <strong>{recus.length}</strong>
          </div>
        </article>

        <article>
          <ShieldCheck />
          <div>
            <small>Reçus valides</small>
            <strong>{valides.length}</strong>
          </div>
        </article>

        <article>
          <FileText />
          <div>
            <small>Reçus annulés</small>
            <strong>{annules.length}</strong>
          </div>
        </article>

        <article>
          <Printer />
          <div>
            <small>Réimpressions</small>
            <strong>
              {recus.reduce(
                (total, recu) =>
                  total + Number(recu.nombre_impressions),
                0
              )}
            </strong>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.resumeDevises}>
          <span>
            Total CDF : <strong>{totalCDF.toLocaleString("fr-FR")} CDF</strong>
          </span>
          <span>
            Total USD : <strong>{totalUSD.toLocaleString("fr-FR")} USD</strong>
          </span>
        </div>

        <form className={styles.filtres}>
          <div className={styles.recherche}>
            <Search size={18} />
            <input
              name="q"
              defaultValue={recherche}
              placeholder="Reçu, paiement, apprenant ou référence..."
            />
          </div>

          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            <option value="VALIDE">Valides</option>
            <option value="ANNULE">Annulés</option>
          </select>

          <select name="devise" defaultValue={devise}>
            <option value="">Toutes les devises</option>
            <option value="CDF">CDF</option>
            <option value="USD">USD</option>
          </select>

          <input
            type="date"
            name="date_debut"
            defaultValue={dateDebut}
          />

          <input
            type="date"
            name="date_fin"
            defaultValue={dateFin}
          />

          <button type="submit">Filtrer</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Reçu</th>
                <th>Date</th>
                <th>Apprenant</th>
                <th>Classe</th>
                <th>Montant</th>
                <th>Mode</th>
                <th>Impressions</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {recus.map((recu) => (
                <tr key={recu.id}>
                  <td>
                    <strong>{recu.numero_recu}</strong>
                  </td>

                  <td>
                    {new Date(recu.date_paiement).toLocaleString("fr-FR")}
                  </td>

                  <td>
                    {recu.nom} {recu.postnom ?? ""} {recu.prenom}
                    <small>{recu.matricule}</small>
                  </td>

                  <td>{recu.classe_nom ?? "—"}</td>

                  <td>
                    <strong>
                      {Number(recu.montant_total).toLocaleString("fr-FR")}{" "}
                      {recu.devise}
                    </strong>
                  </td>

                  <td>{recu.mode_paiement}</td>

                  <td>
                    <strong>{Number(recu.nombre_impressions)}</strong>
                    <small>
                      {recu.derniere_impression
                        ? new Date(recu.derniere_impression).toLocaleString(
                            "fr-FR"
                          )
                        : "Jamais réimprimé"}
                    </small>
                  </td>

                  <td>
                    <span
                      className={
                        recu.statut === "VALIDE"
                          ? styles.vert
                          : styles.rouge
                      }
                    >
                      {recu.statut}
                    </span>
                  </td>

                  <td>
                    <div className={styles.actionsRecu}>
                      <Link
                        href={`/dashboard/finances/recus/${recu.id}`}
                        title="Voir le reçu"
                      >
                        <Eye size={16} />
                        Voir
                      </Link>

                      <Link
                        href={`/dashboard/finances/recus/${recu.id}?format=a4`}
                        title="A4 ou enregistrement PDF"
                      >
                        <FileDown size={16} />
                        A4/PDF
                      </Link>

                      <Link
                        href={`/dashboard/finances/recus/${recu.id}?format=pos58`}
                        title="Format thermique 58 mm"
                      >
                        <Printer size={16} />
                        POS 58
                      </Link>

                      <Link
                        href={`/dashboard/finances/recus/${recu.id}?format=pos80`}
                        title="Format thermique 80 mm"
                      >
                        <Printer size={16} />
                        POS 80
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {!recus.length && (
                <tr>
                  <td colSpan={9}>
                    <div className={styles.vide}>
                      <FileText size={44} />
                      <h2>Aucun reçu enregistré</h2>
                      <p>
                        Les reçus apparaîtront ici après
                        l’enregistrement des paiements.
                      </p>
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
