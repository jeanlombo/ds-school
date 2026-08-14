import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import BarreImpression from "./BarreImpression";
import styles from "../module.module.css";

export const dynamic = "force-dynamic";

type FormatRecu = "A4" | "A5" | "POS58" | "POS80";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    format?: string;
    duplicata?: string;
  }>;
};

type Ligne = {
  id: number;
  numero_recu: string;
  date_paiement: Date;
  montant_total: number;
  devise: string;
  mode_paiement: string;
  reference_transaction: string | null;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  classe_nom: string | null;
  annee_libelle: string | null;
  statut: string;
  utilisateur_nom: string | null;
  nombre_impressions: number | bigint;
  derniere_impression: Date | null;
};

type Detail = {
  libelle_frais: string;
  montant: number;
  devise: string;
};

type Mode = {
  mode_paiement: string;
  montant: number;
  devise: string;
  reference_transaction: string | null;
  telephone: string | null;
  banque: string | null;
};

function normaliserFormat(valeur?: string): FormatRecu {
  switch (String(valeur ?? "").toLowerCase()) {
    case "a5":
      return "A5";
    case "pos58":
      return "POS58";
    case "pos80":
      return "POS80";
    default:
      return "A4";
  }
}

export default async function DetailRecu({
  params,
  searchParams,
}: Props) {
  await exigerPermission("FINANCES_RECUS_VOIR");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const query = await searchParams;
  const recuId = Number(id);

  if (!Number.isInteger(recuId) || recuId <= 0) {
    notFound();
  }

  const format = normaliserFormat(query.format);
  const duplicata = query.duplicata === "1";

  const lignes = await prisma.$queryRaw<Ligne[]>`
    SELECT
      r.id,
      r.numero_recu,
      r.statut,
      p.date_paiement,
      p.montant_total,
      p.devise,
      p.mode_paiement,
      p.reference_transaction,
      e.matricule,
      e.nom,
      e.postnom,
      e.prenom,
      c.nom AS classe_nom,
      a.libelle AS annee_libelle,
      p.cree_par AS utilisateur_nom,
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
    LEFT JOIN annees_scolaires a
      ON a.id = p.annee_scolaire_id
    WHERE r.id = ${recuId}
      AND r.ecole_id = ${ecole.id}
    LIMIT 1
  `;

  const recu = lignes[0];
  if (!recu) notFound();

  const [details, modes] = await Promise.all([
    prisma.$queryRaw<Detail[]>`
      SELECT
        fs.libelle AS libelle_frais,
        dp.montant,
        dp.devise
      FROM details_paiements_scolaires dp
      INNER JOIN frais_scolaires fs
        ON fs.id = dp.frais_id
      WHERE dp.paiement_id = (
        SELECT paiement_id
        FROM recus_scolaires
        WHERE id = ${recu.id}
        LIMIT 1
      )
      ORDER BY fs.libelle ASC
    `,
    prisma.$queryRaw<Mode[]>`
      SELECT
        mode_paiement,
        montant,
        devise,
        reference_transaction,
        telephone,
        banque
      FROM modes_paiements_scolaires
      WHERE paiement_id = (
        SELECT paiement_id
        FROM recus_scolaires
        WHERE id = ${recu.id}
        LIMIT 1
      )
      ORDER BY id ASC
    `,
  ]);

  const classeFormat = {
    A4: styles.formatA4,
    A5: styles.formatA5,
    POS58: styles.formatPOS58,
    POS80: styles.formatPOS80,
  }[format];

  return (
    <main className={styles.recuPage}>
      <BarreImpression
        recuId={recu.id}
        formatActuel={format}
        duplicata={duplicata}
      />

      <article
        className={`${styles.recu} ${classeFormat}`}
        data-format={format}
      >
        {duplicata && (
          <div className={styles.duplicata}>
            DUPLICATA
          </div>
        )}

        <header>
          <div>
            <small>DS SCHOOL ENTERPRISE</small>
            <h1>{ecole.nom}</h1>
            <p>
              {[ecole.adresse, ecole.ville]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {ecole.telephone && <p>{ecole.telephone}</p>}
          </div>

          <div>
            <span>REÇU DE PAIEMENT</span>
            <strong>{recu.numero_recu}</strong>
            <small>{format}</small>
          </div>
        </header>

        <section className={styles.identiteRecu}>
          <div>
            <small>Apprenant</small>
            <strong>
              {recu.nom} {recu.postnom ?? ""} {recu.prenom}
            </strong>
          </div>

          <div>
            <small>Matricule</small>
            <strong>{recu.matricule}</strong>
          </div>

          <div>
            <small>Classe</small>
            <strong>{recu.classe_nom ?? "—"}</strong>
          </div>

          <div>
            <small>Année</small>
            <strong>{recu.annee_libelle ?? "—"}</strong>
          </div>

          <div>
            <small>Date</small>
            <strong>
              {new Date(recu.date_paiement).toLocaleString("fr-FR")}
            </strong>
          </div>
        </section>

        <table className={styles.tableRecu}>
          <thead>
            <tr>
              <th>Frais payé</th>
              <th>Montant</th>
            </tr>
          </thead>

          <tbody>
            {details.map((detail, index) => (
              <tr key={`${detail.libelle_frais}-${index}`}>
                <td>{detail.libelle_frais}</td>
                <td>
                  {Number(detail.montant).toLocaleString("fr-FR")}{" "}
                  {detail.devise}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th>Total payé</th>
              <th>
                {Number(recu.montant_total).toLocaleString("fr-FR")}{" "}
                {recu.devise}
              </th>
            </tr>
          </tfoot>
        </table>

        <section className={styles.modesRecu}>
          <h2>Règlement</h2>
          {modes.length ? (
            modes.map((mode, index) => (
              <div key={`${mode.mode_paiement}-${index}`}>
                <span>{mode.mode_paiement}</span>
                <strong>
                  {Number(mode.montant).toLocaleString("fr-FR")}{" "}
                  {mode.devise}
                </strong>
                <small>
                  {mode.reference_transaction ??
                    mode.telephone ??
                    mode.banque ??
                    ""}
                </small>
              </div>
            ))
          ) : (
            <div>
              <span>{recu.mode_paiement}</span>
              <strong>
                {Number(recu.montant_total).toLocaleString("fr-FR")}{" "}
                {recu.devise}
              </strong>
            </div>
          )}
        </section>

        <section className={styles.metaRecu}>
          <div>
            <small>Caissier</small>
            <strong>
              {recu.utilisateur_nom ?? utilisateur.nom}
            </strong>
          </div>

          <div>
            <small>Référence</small>
            <strong>{recu.reference_transaction ?? "—"}</strong>
          </div>

          <div>
            <small>Statut</small>
            <strong>{recu.statut}</strong>
          </div>

          <div>
            <small>Réimpressions</small>
            <strong>{Number(recu.nombre_impressions)}</strong>
          </div>
        </section>

        {recu.statut === "ANNULE" && (
          <div className={styles.recuAnnule}>
            REÇU ANNULÉ
          </div>
        )}

        <footer>
          <div>Signature du caissier</div>
          <div>Cachet de l’établissement</div>
        </footer>

        <p className={styles.messageMerci}>
          Merci pour votre paiement.
        </p>
      </article>
    </main>
  );
}
