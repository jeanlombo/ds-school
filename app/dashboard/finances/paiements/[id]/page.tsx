import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Ban, FileText, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { annulerPaiement } from "../actions";
import styles from "../paiements.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ succes?: string; erreur?: string }>;
};

type Paiement = {
  id: number;
  numero_paiement: string;
  date_paiement: Date;
  montant_total: number;
  devise: string;
  mode_paiement: string;
  reference_transaction: string | null;
  observation: string | null;
  statut: string;
  motif_annulation: string | null;
  cree_par: string | null;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  classe_nom: string | null;
  annee_libelle: string;
  numero_recu: string | null;
  recu_id: number | null;
};

type Detail = {
  libelle: string;
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

export default async function DetailPaiement({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const query = await searchParams;
  const paiementId = Number(id);

  const paiements = await prisma.$queryRaw<Paiement[]>`
    SELECT
      p.*,
      e.matricule,
      e.nom,
      e.postnom,
      e.prenom,
      c.nom AS classe_nom,
      a.libelle AS annee_libelle,
      r.numero_recu,
      r.id AS recu_id
    FROM paiements_scolaires p
    INNER JOIN inscriptions i ON i.id = p.inscription_id
    INNER JOIN eleves e ON e.id = i.eleve_id
    LEFT JOIN classes c ON c.id = i.classe_id
    INNER JOIN annees_scolaires a ON a.id = p.annee_scolaire_id
    LEFT JOIN recus_scolaires r ON r.paiement_id = p.id
    WHERE p.id = ${paiementId}
      AND p.ecole_id = ${ecole.id}
    LIMIT 1
  `;

  const paiement = paiements[0];
  if (!paiement) notFound();

  const [details, modes] = await Promise.all([
    prisma.$queryRaw<Detail[]>`
      SELECT fs.libelle, dp.montant, dp.devise
      FROM details_paiements_scolaires dp
      INNER JOIN frais_scolaires fs ON fs.id = dp.frais_id
      WHERE dp.paiement_id = ${paiementId}
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
      WHERE paiement_id = ${paiementId}
      ORDER BY id ASC
    `,
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre={`Paiement ${paiement.numero_paiement}`}
      description="Détail complet, modes de paiement, reçu et annulation sécurisée."
      action={
        paiement.recu_id ? (
          <Link href={`/dashboard/finances/recus/${paiement.recu_id}`} className={styles.primaire}>
            <Printer size={18} />
            Ouvrir le reçu
          </Link>
        ) : null
      }
    >
      <RetourDashboard />

      {query.succes && <div className={styles.succes}>L’opération a été exécutée avec succès.</div>}
      {query.erreur && <div className={styles.erreur}>L’opération n’a pas pu être exécutée.</div>}

      <section className={styles.ficheEleve}>
        <div>
          <small>Apprenant</small>
          <strong>{paiement.nom} {paiement.postnom ?? ""} {paiement.prenom}</strong>
        </div>
        <div><small>Matricule</small><strong>{paiement.matricule}</strong></div>
        <div><small>Classe</small><strong>{paiement.classe_nom ?? "—"}</strong></div>
        <div><small>Année</small><strong>{paiement.annee_libelle}</strong></div>
      </section>

      <section className={styles.stats}>
        <article><FileText /><div><small>Numéro</small><strong>{paiement.numero_paiement}</strong></div></article>
        <article><FileText /><div><small>Montant</small><strong>{Number(paiement.montant_total).toLocaleString("fr-FR")} {paiement.devise}</strong></div></article>
        <article><FileText /><div><small>Mode</small><strong>{paiement.mode_paiement}</strong></div></article>
        <article><FileText /><div><small>Statut</small><strong>{paiement.statut}</strong></div></article>
      </section>

      <section className={styles.grilleDetail}>
        <article className={styles.panel}>
          <h2>Frais réglés</h2>
          <div className={styles.tableau}>
            <table>
              <thead><tr><th>Frais</th><th>Montant</th></tr></thead>
              <tbody>
                {details.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.libelle}</td>
                    <td><strong>{Number(detail.montant).toLocaleString("fr-FR")} {detail.devise}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.panel}>
          <h2>Modes de paiement</h2>
          <div className={styles.tableau}>
            <table>
              <thead><tr><th>Mode</th><th>Montant</th><th>Référence</th></tr></thead>
              <tbody>
                {modes.map((mode, index) => (
                  <tr key={index}>
                    <td>{mode.mode_paiement}</td>
                    <td><strong>{Number(mode.montant).toLocaleString("fr-FR")} {mode.devise}</strong></td>
                    <td>{mode.reference_transaction ?? mode.telephone ?? mode.banque ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <h2>Informations de contrôle</h2>
        <div className={styles.infosControle}>
          <div><small>Date</small><strong>{new Date(paiement.date_paiement).toLocaleString("fr-FR")}</strong></div>
          <div><small>Caissier</small><strong>{paiement.cree_par ?? "—"}</strong></div>
          <div><small>Reçu</small><strong>{paiement.numero_recu ?? "—"}</strong></div>
          <div><small>Observation</small><strong>{paiement.observation ?? "—"}</strong></div>
        </div>
      </section>

      {paiement.statut === "VALIDE" ? (
        <section className={styles.annulation}>
          <div>
            <Ban size={27} />
            <div>
              <h2>Annulation sécurisée</h2>
              <p>Le motif est obligatoire. L’annulation génère une sortie de caisse et annule le reçu.</p>
            </div>
          </div>

          <form action={annulerPaiement}>
            <input type="hidden" name="paiement_id" value={paiement.id} />
            <textarea name="motif_annulation" required rows={3} placeholder="Motif obligatoire..." />
            <button type="submit">Annuler le paiement</button>
          </form>
        </section>
      ) : (
        <section className={styles.erreur}>
          Paiement annulé : {paiement.motif_annulation ?? "motif non renseigné"}.
        </section>
      )}
    </AdminShell>
  );
}
