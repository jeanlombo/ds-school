import { notFound } from "next/navigation";
import {
  CalendarClock,
  CircleDollarSign,
  MessageSquareText,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigerEnfantDuParent } from "@/lib/parent-portail";
import AdminShell from "@/components/admin/AdminShell";
import {
  marquerAlerteCommeLue,
  repondreAlerteParent,
} from "../actions";
import styles from "../../../parent.module.css";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    eleveId?: string;
    succes?: string;
    erreur?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const query = await searchParams;
  const evenementId = Number(id);
  const eleveId = Number(query.eleveId ?? 0);

  if (
    !Number.isInteger(evenementId) ||
    eleveId <= 0
  ) {
    notFound();
  }

  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_communication"
  );

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
      nom_complet: string;
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
      CONCAT_WS(' ', e.nom, e.postnom, e.prenom)
        AS nom_complet
    FROM suivi_parent_evenements s
    INNER JOIN eleves e ON e.id = s.eleve_id
    WHERE s.id = ${evenementId}
      AND s.ecole_id = ${contexte.ecoleId}
      AND s.eleve_id = ${eleveId}
      AND s.visible_parent = 1
    LIMIT 1
  `;

  const evenement = lignes[0];
  if (!evenement) notFound();

  await marquerAlerteCommeLue(
    evenementId,
    eleveId
  );

  const reponses = await prisma.$queryRaw<
    Array<{
      id: number;
      type_reponse: string;
      message: string;
      piece_jointe_url: string | null;
      created_at: Date;
    }>
  >`
    SELECT
      id,
      type_reponse,
      message,
      piece_jointe_url,
      created_at
    FROM suivi_parent_reponses
    WHERE evenement_id = ${evenementId}
      AND parent_id = ${contexte.parentId}
    ORDER BY created_at DESC
  `;

  const actionReponse =
    repondreAlerteParent.bind(
      null,
      evenementId,
      eleveId
    );

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={evenement.titre}
      description={`${evenement.type_evenement} — ${evenement.nom_complet}`}
    >
      {query.succes && (
        <div className={styles.message}>
          Votre réponse a été envoyée à l’école.
        </div>
      )}

      <section className={styles.panel}>
        <div className={styles.stats}>
          <article>
            <CalendarClock />
            <div>
              <small>Date</small>
              <strong>
                {new Date(
                  evenement.date_evenement
                ).toLocaleDateString("fr-FR")}
              </strong>
            </div>
          </article>
          <article>
            <MessageSquareText />
            <div>
              <small>Statut</small>
              <strong>{evenement.statut}</strong>
            </div>
          </article>
          <article>
            <CircleDollarSign />
            <div>
              <small>Montant</small>
              <strong>
                {evenement.montant !== null
                  ? `${Number(
                      evenement.montant
                    ).toLocaleString("fr-FR")} ${
                      evenement.devise ?? ""
                    }`
                  : "Non applicable"}
              </strong>
            </div>
          </article>
        </div>

        <h2>{evenement.titre}</h2>
        <p>{evenement.description}</p>

        {evenement.lieu && (
          <p><strong>Lieu :</strong> {evenement.lieu}</p>
        )}

        {evenement.date_echeance && (
          <p>
            <strong>Date limite ou rendez-vous :</strong>{" "}
            {new Date(
              evenement.date_echeance
            ).toLocaleDateString("fr-FR")}
          </p>
        )}
      </section>

      {Boolean(evenement.reponse_requise) && (
        <section className={styles.panel}>
          <h2>Répondre à l’école</h2>
          {query.erreur === "message" && (
            <div className={styles.rouge}>
              Le message est obligatoire.
            </div>
          )}
          <form
            action={actionReponse}
            className={styles.grilleFormulaire}
          >
            <label>
              Type de réponse
              <select
                name="type_reponse"
                defaultValue={
                  evenement.type_evenement ===
                  "ABSENCE"
                    ? "JUSTIFICATION"
                    : evenement.type_evenement ===
                        "CONVOCATION" ||
                      evenement.type_evenement ===
                        "INVITATION"
                      ? "CONFIRMATION"
                      : "MESSAGE"
                }
              >
                <option value="MESSAGE">Message</option>
                <option value="JUSTIFICATION">Justification</option>
                <option value="CONFIRMATION">Confirmation de présence</option>
                <option value="INDISPONIBLE">Indisponible</option>
                <option value="REPORT">Demande de report</option>
              </select>
            </label>

            <label>
              Lien du justificatif
              <input
                type="url"
                name="piece_jointe_url"
                placeholder="https://..."
              />
            </label>

            <label className={styles.champLarge}>
              Votre message
              <textarea
                name="message"
                rows={5}
                required
                placeholder="Écrivez votre justification ou votre réponse."
              />
            </label>

            <button type="submit">
              Envoyer la réponse
            </button>
          </form>
        </section>
      )}

      <section className={styles.panel}>
        <h2>Historique de vos réponses</h2>
        {reponses.map((reponse) => (
          <article
            className={styles.liaison}
            key={reponse.id}
          >
            <strong>{reponse.type_reponse}</strong>
            <small>
              {new Date(
                reponse.created_at
              ).toLocaleString("fr-FR")}
            </small>
            <p>{reponse.message}</p>
          </article>
        ))}
        {!reponses.length && (
          <div className={styles.vide}>
            Aucune réponse envoyée.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
