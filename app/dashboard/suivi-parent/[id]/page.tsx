import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { changerStatutEvenement } from "../actions";
import styles from "../suivi-parent.module.css";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: Props) {
  await exigerPermission("SUIVI_PARENT_VOIR");

  const utilisateur =
    await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const query = await searchParams;
  const evenementId = Number(id);
  if (!Number.isInteger(evenementId)) notFound();

  const lignes = await prisma.$queryRaw<
    Array<{
      id: number;
      type_evenement: string;
      titre: string;
      description: string;
      niveau: string;
      montant: number | null;
      devise: string | null;
      date_evenement: Date;
      date_echeance: Date | null;
      lieu: string | null;
      statut: string;
      reponse_requise: number;
      cree_par: string | null;
      nom_complet: string;
      matricule: string;
      classe_nom: string | null;
    }>
  >`
    SELECT
      s.id,
      s.type_evenement,
      s.titre,
      s.description,
      s.niveau,
      s.montant,
      s.devise,
      s.date_evenement,
      s.date_echeance,
      s.lieu,
      s.statut,
      s.reponse_requise,
      s.cree_par,
      CONCAT_WS(' ', e.nom, e.postnom, e.prenom)
        AS nom_complet,
      e.matricule,
      c.nom AS classe_nom
    FROM suivi_parent_evenements s
    INNER JOIN eleves e ON e.id = s.eleve_id
    LEFT JOIN inscriptions i
      ON i.eleve_id = e.id
      AND i.statut IN
        ('inscrit','admis','promu','redouble')
    LEFT JOIN classes c ON c.id = i.classe_id
    WHERE s.id = ${evenementId}
      AND s.ecole_id = ${ecole.id}
    LIMIT 1
  `;

  const evenement = lignes[0];
  if (!evenement) notFound();

  const reponses = await prisma.$queryRaw<
    Array<{
      id: number;
      type_reponse: string;
      message: string;
      piece_jointe_url: string | null;
      statut: string;
      created_at: Date;
      parent_nom: string;
    }>
  >`
    SELECT
      r.id,
      r.type_reponse,
      r.message,
      r.piece_jointe_url,
      r.statut,
      r.created_at,
      p.nom AS parent_nom
    FROM suivi_parent_reponses r
    INNER JOIN parents_portail p
      ON p.id = r.parent_id
    WHERE r.evenement_id = ${evenementId}
    ORDER BY r.created_at DESC
  `;

  const actionStatut =
    changerStatutEvenement.bind(
      null,
      evenementId
    );

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre={evenement.titre}
      description={`${evenement.type_evenement} — ${evenement.nom_complet}`}
    >
      {query.succes && (
        <div
          className={`${styles.message} ${styles.succes}`}
        >
          Opération réalisée avec succès.
        </div>
      )}

      <section className={styles.panel}>
        <div className={styles.detailGrid}>
          <div><small>Apprenant</small><strong>{evenement.nom_complet}</strong></div>
          <div><small>Matricule</small><strong>{evenement.matricule}</strong></div>
          <div><small>Classe</small><strong>{evenement.classe_nom ?? "—"}</strong></div>
          <div><small>Type</small><strong>{evenement.type_evenement}</strong></div>
          <div><small>Niveau</small><strong>{evenement.niveau}</strong></div>
          <div><small>Statut</small><strong>{evenement.statut}</strong></div>
          <div><small>Date</small><strong>{new Date(evenement.date_evenement).toLocaleDateString("fr-FR")}</strong></div>
          <div><small>Échéance</small><strong>{evenement.date_echeance ? new Date(evenement.date_echeance).toLocaleDateString("fr-FR") : "—"}</strong></div>
          <div><small>Montant</small><strong>{evenement.montant !== null ? `${Number(evenement.montant).toLocaleString("fr-FR")} ${evenement.devise ?? ""}` : "—"}</strong></div>
        </div>

        <div className={styles.description}>
          {evenement.description}
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Mettre à jour le statut</h2>
        <form action={actionStatut} className={styles.actions}>
          <select name="statut" defaultValue={evenement.statut}>
            <option value="NOUVEAU">Nouveau</option>
            <option value="EN_ATTENTE_REPONSE">En attente de réponse</option>
            <option value="CONFIRME">Confirmé</option>
            <option value="JUSTIFIE">Justifié</option>
            <option value="REJETE">Rejeté</option>
            <option value="TRAITE">Traité</option>
            <option value="CLOTURE">Clôturé</option>
            <option value="ANNULE">Annulé</option>
          </select>
          <button type="submit">
            Enregistrer le statut
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Réponses du parent</h2>
        {reponses.map((reponse) => (
          <article
            className={styles.reponse}
            key={reponse.id}
          >
            <header>
              <strong>{reponse.parent_nom}</strong>
              <small>
                {new Date(
                  reponse.created_at
                ).toLocaleString("fr-FR")}
              </small>
            </header>
            <p>{reponse.message}</p>
            {reponse.piece_jointe_url && (
              <a
                href={reponse.piece_jointe_url}
                target="_blank"
                rel="noreferrer"
              >
                Voir le justificatif
              </a>
            )}
          </article>
        ))}
        {!reponses.length && (
          <div className={styles.vide}>
            Aucune réponse reçue.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
