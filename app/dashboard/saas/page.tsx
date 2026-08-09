import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import {
  creerAbonnement,
  enregistrerPaiement,
  renouvelerAbonnement,
  validerPaiementAbonnement,
  rejeterPaiementAbonnement,
} from "./actions";
import styles from "./styles.module.css";

export const dynamic = "force-dynamic";

type Kpi = {
  clients: bigint;
  ecoles: bigint;
  licences_actives: bigint;
  expirent_30j: bigint;
};

type Org = {
  id: number;
  nom: string;
};

type Abo = {
  id: number;
  code_abonnement: string;
  organisation_id: number;
  client: string;
  formule: string | null;
  date_expiration: Date | null;
  statut: string;
  montant: unknown;
  devise: string;
};

type Paiement = {
  id: number;
  abonnement_id: number;
  organisation_id: number;
  client: string;
  code_abonnement: string;
  formule: string | null;
  montant: unknown;
  devise: string;
  mode_paiement: string | null;
  reference_paiement: string | null;
  date_paiement: Date | null;
  statut: string;
  observations: string | null;
  nb_ecoles: bigint;
  ecoles: string | null;
};

function montant(v: unknown, devise = "USD") {
  return `${Number(v ?? 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${devise}`;
}

function dateFR(v: Date | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("fr-FR");
}

export default async function SaasPage() {
  const u = await obtenirUtilisateurConnecte();

  if (!u) redirect("/connexion");
  if (!u.superAdministrateur) redirect("/dashboard");

  const [kpis, orgs, abos, paiementsAnnee, alertes, paiementsRecus] =
    await Promise.all([
      prisma.$queryRaw<Kpi[]>`
        SELECT
          (SELECT COUNT(*) FROM organisations_clientes WHERE statut='ACTIF') clients,
          (SELECT COUNT(*) FROM ecoles) ecoles,
          (SELECT COUNT(*) FROM licences WHERE statut='actif') licences_actives,
          (
            SELECT COUNT(*)
            FROM licences
            WHERE statut='actif'
              AND date_expiration BETWEEN CURDATE()
              AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)
          ) expirent_30j
      `,
      prisma.$queryRaw<Org[]>`
        SELECT id, nom
        FROM organisations_clientes
        WHERE statut='ACTIF'
        ORDER BY nom
      `,
      prisma.$queryRaw<Abo[]>`
        SELECT
          a.id,
          a.code_abonnement,
          a.organisation_id,
          o.nom client,
          a.formule,
          a.date_expiration,
          a.statut,
          a.montant,
          a.devise
        FROM abonnements_clients a
        JOIN organisations_clientes o
          ON o.id = a.organisation_id
        ORDER BY a.id DESC
        LIMIT 100
      `,
      prisma.$queryRaw<Array<{ total: unknown }>>`
        SELECT COALESCE(SUM(montant),0) total
        FROM paiements_abonnements_clients
        WHERE statut='VALIDE'
          AND YEAR(date_paiement)=YEAR(CURDATE())
      `,
      prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COUNT(*) total
        FROM alertes_saas
        WHERE statut='OUVERTE'
      `,
      prisma.$queryRaw<Paiement[]>`
        SELECT
          p.id,
          p.abonnement_id,
          p.organisation_id,
          o.nom client,
          a.code_abonnement,
          a.formule,
          p.montant,
          p.devise,
          p.mode_paiement,
          p.reference_paiement,
          p.date_paiement,
          p.statut,
          p.observations,
          COUNT(DISTINCT oe.ecole_id) AS nb_ecoles,
          GROUP_CONCAT(
            DISTINCT e.nom
            ORDER BY oe.principal DESC, e.nom
            SEPARATOR ', '
          ) AS ecoles
        FROM paiements_abonnements_clients p
        INNER JOIN abonnements_clients a
          ON a.id = p.abonnement_id
        INNER JOIN organisations_clientes o
          ON o.id = p.organisation_id
        LEFT JOIN organisation_etablissements oe
          ON oe.organisation_id = p.organisation_id
        LEFT JOIN ecoles e
          ON e.id = oe.ecole_id
        GROUP BY
          p.id,
          p.abonnement_id,
          p.organisation_id,
          o.nom,
          a.code_abonnement,
          a.formule,
          p.montant,
          p.devise,
          p.mode_paiement,
          p.reference_paiement,
          p.date_paiement,
          p.statut,
          p.observations
        ORDER BY
          CASE UPPER(p.statut)
            WHEN 'EN_ATTENTE' THEN 0
            WHEN 'VALIDE' THEN 1
            WHEN 'REJETE' THEN 2
            ELSE 3
          END,
          p.id DESC
        LIMIT 150
      `,
    ]);

  const k = kpis[0] || {
    clients: BigInt(0),
    ecoles: BigInt(0),
    licences_actives: BigInt(0),
    expirent_30j: BigInt(0),
  };

  const enAttente = paiementsRecus.filter(
    (p) => String(p.statut).toUpperCase() === "EN_ATTENTE"
  ).length;

  return (
    <AdminShell
      utilisateur={u}
      titre="Centre SaaS DIGIGROUPE"
      description="Pilotage commercial, validation des paiements, activation des abonnements et licences DS SCHOOL ENTERPRISE."
    >
      <div className={styles.kpis}>
        <div>
          <span>Clients actifs</span>
          <b>{Number(k.clients)}</b>
        </div>
        <div>
          <span>Établissements</span>
          <b>{Number(k.ecoles)}</b>
        </div>
        <div>
          <span>Licences actives</span>
          <b>{Number(k.licences_actives)}</b>
        </div>
        <div>
          <span>Expiration ≤ 30 j</span>
          <b>{Number(k.expirent_30j)}</b>
        </div>
        <div>
          <span>Paiements année</span>
          <b>
            {Number(paiementsAnnee[0]?.total || 0).toLocaleString("fr-FR")} USD
          </b>
        </div>
        <div>
          <span>Paiements à vérifier</span>
          <b>{enAttente}</b>
        </div>
        <div>
          <span>Alertes ouvertes</span>
          <b>{Number(alertes[0]?.total || 0)}</b>
        </div>
      </div>

      <section className={`${styles.panel} ${styles.workflow}`}>
        <div>
          <small>PROCESSUS D'ACTIVATION</small>
          <h2>Paiement → Validation → Abonnement → Licence → Quota</h2>
          <p>
            Aucun client n'est activé simplement parce qu'il a initié un
            paiement. Le Super Administrateur confirme le paiement ici, puis
            DS SCHOOL active automatiquement l'abonnement et les licences des
            établissements rattachés.
          </p>
        </div>
        <div className={styles.workflowSteps}>
          <span>1. Paiement reçu</span>
          <b>→</b>
          <span>2. Validation DIGIGROUPE</span>
          <b>→</b>
          <span>3. Abonnement ACTIF</span>
          <b>→</b>
          <span>4. Licence active</span>
          <b>→</b>
          <span>5. Quota appliqué</span>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.paymentsPanel}`}>
        <div className={styles.sectionHead}>
          <div>
            <small>CONTRÔLE ADMINISTRATIF</small>
            <h2>Paiements d'abonnements reçus</h2>
            <p>
              Les paiements EN_ATTENTE doivent être vérifiés avant activation
              du client.
            </p>
          </div>
          <div className={styles.waitingBadge}>{enAttente} à vérifier</div>
        </div>

        <div className={styles.paymentCards}>
          {paiementsRecus.map((p) => {
            const statut = String(p.statut || "").toUpperCase();
            const attente = statut === "EN_ATTENTE";

            return (
              <article className={styles.paymentCard} key={p.id}>
                <div className={styles.paymentTop}>
                  <div>
                    <span className={styles.reference}>
                      {p.reference_paiement || `Paiement #${p.id}`}
                    </span>
                    <h3>{p.client}</h3>
                    <p>
                      {p.code_abonnement} • {p.formule || "Standard"}
                    </p>
                  </div>
                  <span
                    className={styles.status}
                    data-status={statut.toLowerCase()}
                  >
                    {statut || "INCONNU"}
                  </span>
                </div>

                <div className={styles.paymentMeta}>
                  <div>
                    <small>Montant</small>
                    <b>{montant(p.montant, p.devise)}</b>
                  </div>
                  <div>
                    <small>Mode</small>
                    <b>{p.mode_paiement || "Non précisé"}</b>
                  </div>
                  <div>
                    <small>Date</small>
                    <b>{dateFR(p.date_paiement)}</b>
                  </div>
                  <div>
                    <small>Établissements liés</small>
                    <b>{Number(p.nb_ecoles || 0)}</b>
                  </div>
                </div>

                <div className={styles.schools}>
                  <small>Écoles qui seront activées</small>
                  <p>
                    {p.ecoles ||
                      "Aucune école rattachée — validation impossible tant que le rattachement n'est pas fait."}
                  </p>
                </div>

                {p.observations && (
                  <div className={styles.note}>{p.observations}</div>
                )}

                {attente && (
                  <div className={styles.validationGrid}>
                    <form
                      action={validerPaiementAbonnement}
                      className={styles.validateForm}
                    >
                      <input type="hidden" name="paiement_id" value={p.id} />

                      <label>
                        Quota élèves commercial
                        <input
                          type="number"
                          name="quota_eleves"
                          min="1"
                          defaultValue="480"
                          required
                        />
                      </label>

                      <label>
                        Observation de validation
                        <input
                          name="observation_validation"
                          defaultValue="Paiement vérifié et confirmé."
                        />
                      </label>

                      <button
                        className={styles.validateButton}
                        disabled={Number(p.nb_ecoles || 0) === 0}
                      >
                        Valider et activer le client
                      </button>
                    </form>

                    <form
                      action={rejeterPaiementAbonnement}
                      className={styles.rejectForm}
                    >
                      <input type="hidden" name="paiement_id" value={p.id} />

                      <label>
                        Motif du rejet
                        <input
                          name="motif_rejet"
                          placeholder="Ex. transaction non retrouvée"
                          required
                        />
                      </label>

                      <button className={styles.rejectButton}>
                        Rejeter le paiement
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}

          {!paiementsRecus.length && (
            <div className={styles.empty}>
              Aucun paiement d'abonnement n'a encore été reçu.
            </div>
          )}
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2>Créer un abonnement</h2>
          <form action={creerAbonnement}>
            <select name="organisation_id" required>
              <option value="">Client...</option>
              {orgs.map((o) => (
                <option value={o.id} key={o.id}>
                  {o.nom}
                </option>
              ))}
            </select>

            <input
              name="code_abonnement"
              placeholder="Code abonnement"
              required
            />

            <input
              name="formule"
              placeholder="Formule"
              defaultValue="Standard"
            />

            <div className={styles.duo}>
              <input name="date_debut" type="date" required />
              <input name="date_expiration" type="date" required />
            </div>

            <div className={styles.duo}>
              <input
                name="montant"
                type="number"
                step="0.01"
                placeholder="Montant"
              />
              <select name="devise">
                <option>USD</option>
                <option>CDF</option>
              </select>
            </div>

            <select name="periodicite">
              <option value="ANNUEL">Annuel</option>
              <option value="SEMESTRIEL">Semestriel</option>
              <option value="TRIMESTRIEL">Trimestriel</option>
              <option value="MENSUEL">Mensuel</option>
              <option value="PERSONNALISE">Personnalisé</option>
            </select>

            <textarea name="observations" placeholder="Observations" />
            <button>Créer l'abonnement EN_ATTENTE</button>
          </form>
        </section>

        <section className={styles.panel}>
          <h2>Enregistrer un paiement manuel</h2>
          <form action={enregistrerPaiement}>
            <select name="abonnement_id" required>
              <option value="">Abonnement...</option>
              {abos.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.client} — {a.code_abonnement}
                </option>
              ))}
            </select>

            <div className={styles.duo}>
              <input
                name="montant"
                type="number"
                step="0.01"
                required
                placeholder="Montant"
              />
              <select name="devise">
                <option>USD</option>
                <option>CDF</option>
              </select>
            </div>

            <input name="date_paiement" type="date" required />
            <input name="mode_paiement" placeholder="Mode de paiement" />
            <input name="reference_paiement" placeholder="Référence" />
            <textarea name="observations" placeholder="Observations" />
            <button>Enregistrer EN_ATTENTE</button>
          </form>
        </section>
      </div>

      <section className={styles.panel}>
        <h2>Abonnements & renouvellements</h2>

        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Code</th>
                <th>Formule</th>
                <th>Expiration</th>
                <th>Statut</th>
                <th>Renouveler</th>
              </tr>
            </thead>

            <tbody>
              {abos.map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.client}</b>
                  </td>
                  <td>{a.code_abonnement}</td>
                  <td>{a.formule}</td>
                  <td>{dateFR(a.date_expiration)}</td>
                  <td>
                    <span
                      className={styles.status}
                      data-status={String(a.statut).toLowerCase()}
                    >
                      {a.statut}
                    </span>
                  </td>
                  <td>
                    <form
                      className={styles.inline}
                      action={renouvelerAbonnement}
                    >
                      <input
                        type="hidden"
                        name="abonnement_id"
                        value={a.id}
                      />
                      <input
                        name="nouvelle_expiration"
                        type="date"
                        required
                      />
                      <input
                        name="montant"
                        type="number"
                        step="0.01"
                        placeholder="Montant"
                      />
                      <input type="hidden" name="devise" value={a.devise} />
                      <button>Renouveler</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
