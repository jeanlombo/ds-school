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
  prolongerEcheancePaiement,
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
  date_echeance_paiement: Date | null;
  statut: string;
  montant: unknown;
  devise: string;
  total_paye: unknown;
  total_en_attente: unknown;
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

function monnaie(
  v: unknown,
  devise = "USD"
) {
  return `${Number(v ?? 0).toLocaleString(
    "fr-FR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )} ${devise}`;
}

function dateFR(
  v: Date | null
) {
  if (!v) return "—";

  return new Date(v)
    .toLocaleDateString("fr-FR");
}

function jourISO(
  v: Date | null
) {
  if (!v) return "";

  return new Date(v)
    .toISOString()
    .slice(0, 10);
}

function financier(a: Abo) {
  const total =
    Number(a.montant ?? 0);

  const paye =
    Number(a.total_paye ?? 0);

  const attente =
    Number(a.total_en_attente ?? 0);

  const solde =
    Math.max(0, total - paye);

  const progression =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (paye / total) * 100
          )
        )
      : 0;

  const echeanceExpiree =
    Boolean(a.date_echeance_paiement) &&
    new Date().getTime() >
      new Date(
        `${jourISO(
          a.date_echeance_paiement
        )}T23:59:59`
      ).getTime() &&
    solde > 0;

  let statut = "NON_PAYE";

  if (solde <= 0) {
    statut = "SOLDE";
  } else if (
    echeanceExpiree &&
    paye > 0
  ) {
    statut = "PARTIEL_EXPIRE";
  } else if (echeanceExpiree) {
    statut = "ECHEANCE_EXPIREE";
  } else if (paye > 0) {
    statut = "PARTIEL";
  } else if (attente > 0) {
    statut = "EN_ATTENTE";
  }

  return {
    total,
    paye,
    attente,
    solde,
    progression,
    echeanceExpiree,
    statut,
  };
}

export default async function SaasPage() {
  const u =
    await obtenirUtilisateurConnecte();

  if (!u) {
    redirect("/connexion");
  }

  if (!u.superAdministrateur) {
    redirect("/dashboard");
  }

  const [
    kpis,
    orgs,
    abos,
    paiementsAnnee,
    alertes,
    paiementsRecus,
  ] = await Promise.all([
    prisma.$queryRaw<Kpi[]>`
      SELECT
        (
          SELECT COUNT(*)
          FROM organisations_clientes
          WHERE statut='ACTIF'
        ) clients,

        (
          SELECT COUNT(*)
          FROM ecoles
        ) ecoles,

        (
          SELECT COUNT(*)
          FROM licences
          WHERE statut='actif'
        ) licences_actives,

        (
          SELECT COUNT(*)
          FROM licences
          WHERE statut='actif'
            AND date_expiration
              BETWEEN CURDATE()
              AND DATE_ADD(
                CURDATE(),
                INTERVAL 30 DAY
              )
        ) expirent_30j
    `,

    prisma.$queryRaw<Org[]>`
      SELECT
        id,
        nom
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
        a.date_echeance_paiement,
        a.statut,
        a.montant,
        a.devise,

        COALESCE((
          SELECT SUM(p.montant)
          FROM paiements_abonnements_clients p
          WHERE p.abonnement_id = a.id
            AND UPPER(p.statut)='VALIDE'
        ),0) total_paye,

        COALESCE((
          SELECT SUM(p.montant)
          FROM paiements_abonnements_clients p
          WHERE p.abonnement_id = a.id
            AND UPPER(p.statut)='EN_ATTENTE'
        ),0) total_en_attente

      FROM abonnements_clients a
      JOIN organisations_clientes o
        ON o.id = a.organisation_id
      ORDER BY a.id DESC
      LIMIT 100
    `,

    prisma.$queryRaw<
      Array<{ total: unknown }>
    >`
      SELECT
        COALESCE(
          SUM(montant),
          0
        ) total
      FROM paiements_abonnements_clients
      WHERE statut='VALIDE'
        AND YEAR(date_paiement)
          = YEAR(CURDATE())
    `,

    prisma.$queryRaw<
      Array<{ total: bigint }>
    >`
      SELECT
        COUNT(*) total
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

        COUNT(
          DISTINCT oe.ecole_id
        ) AS nb_ecoles,

        GROUP_CONCAT(
          DISTINCT e.nom
          ORDER BY
            oe.principal DESC,
            e.nom
          SEPARATOR ', '
        ) AS ecoles

      FROM paiements_abonnements_clients p

      INNER JOIN abonnements_clients a
        ON a.id = p.abonnement_id

      INNER JOIN organisations_clientes o
        ON o.id = p.organisation_id

      LEFT JOIN organisation_etablissements oe
        ON oe.organisation_id =
          p.organisation_id

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

  const k =
    kpis[0] || {
      clients: BigInt(0),
      ecoles: BigInt(0),
      licences_actives: BigInt(0),
      expirent_30j: BigInt(0),
    };

  const enAttente =
    paiementsRecus.filter(
      (p) =>
        String(
          p.statut
        ).toUpperCase() ===
        "EN_ATTENTE"
    ).length;

  const partielsExpires =
    abos.filter(
      (a) =>
        financier(a).statut ===
        "PARTIEL_EXPIRE"
    ).length;

  return (
    <AdminShell
      utilisateur={u}
      titre="Centre SaaS DIGIGROUPE"
      description="Paiements totaux ou partiels, échéances, validation et activation des licences DS SCHOOL ENTERPRISE."
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
          <b>
            {Number(
              k.licences_actives
            )}
          </b>
        </div>

        <div>
          <span>
            Expiration ≤ 30 j
          </span>
          <b>
            {Number(
              k.expirent_30j
            )}
          </b>
        </div>

        <div>
          <span>
            Paiements année
          </span>
          <b>
            {Number(
              paiementsAnnee[0]
                ?.total || 0
            ).toLocaleString(
              "fr-FR"
            )}{" "}
            USD
          </b>
        </div>

        <div>
          <span>
            Paiements à vérifier
          </span>
          <b>{enAttente}</b>
        </div>

        <div>
          <span>
            Partiels expirés
          </span>
          <b>{partielsExpires}</b>
        </div>

        <div>
          <span>
            Alertes ouvertes
          </span>
          <b>
            {Number(
              alertes[0]?.total ||
                0
            )}
          </b>
        </div>
      </div>

      <section
        className={`${styles.panel} ${styles.workflow}`}
      >
        <small>
          CYCLE FINANCIER
        </small>

        <h2>
          Paiement partiel sécurisé
        </h2>

        <p>
          Chaque versement est
          vérifié séparément. Le
          client n'est activé que
          lorsque le cumul validé
          solde l'abonnement avant
          l'échéance.
        </p>

        <div
          className={
            styles.workflowSteps
          }
        >
          <span>
            Versement
          </span>
          <b>→</b>
          <span>
            EN_ATTENTE
          </span>
          <b>→</b>
          <span>
            Validation
          </span>
          <b>→</b>
          <span>
            PARTIEL
          </span>
          <b>→</b>
          <span>
            SOLDE
          </span>
          <b>→</b>
          <span>
            Activation
          </span>
        </div>
      </section>

      <section
        className={`${styles.panel} ${styles.paymentsPanel}`}
      >
        <div
          className={
            styles.sectionHead
          }
        >
          <div>
            <small>
              CONTRÔLE DIGIGROUPE
            </small>

            <h2>
              Paiements reçus
            </h2>

            <p>
              Validez ou rejetez
              chaque versement.
              Un versement partiel
              validé n'active pas
              encore la licence.
            </p>
          </div>

          <div
            className={
              styles.waitingBadge
            }
          >
            {enAttente} à vérifier
          </div>
        </div>

        <div
          className={
            styles.paymentCards
          }
        >
          {paiementsRecus.map(
            (p) => {
              const statut =
                String(
                  p.statut || ""
                ).toUpperCase();

              const attente =
                statut ===
                "EN_ATTENTE";

              return (
                <article
                  className={
                    styles.paymentCard
                  }
                  key={p.id}
                >
                  <div
                    className={
                      styles.paymentTop
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.reference
                        }
                      >
                        {p.reference_paiement ||
                          `Paiement #${p.id}`}
                      </span>

                      <h3>
                        {p.client}
                      </h3>

                      <p>
                        {
                          p.code_abonnement
                        }{" "}
                        •{" "}
                        {p.formule ||
                          "Standard"}
                      </p>
                    </div>

                    <span
                      className={
                        styles.status
                      }
                      data-status={statut.toLowerCase()}
                    >
                      {statut ||
                        "INCONNU"}
                    </span>
                  </div>

                  <div
                    className={
                      styles.paymentMeta
                    }
                  >
                    <div>
                      <small>
                        Versement
                      </small>
                      <b>
                        {monnaie(
                          p.montant,
                          p.devise
                        )}
                      </b>
                    </div>

                    <div>
                      <small>
                        Mode
                      </small>
                      <b>
                        {p.mode_paiement ||
                          "Non précisé"}
                      </b>
                    </div>

                    <div>
                      <small>
                        Date
                      </small>
                      <b>
                        {dateFR(
                          p.date_paiement
                        )}
                      </b>
                    </div>

                    <div>
                      <small>
                        Écoles liées
                      </small>
                      <b>
                        {Number(
                          p.nb_ecoles ||
                            0
                        )}
                      </b>
                    </div>
                  </div>

                  {p.observations && (
                    <div
                      className={
                        styles.note
                      }
                    >
                      {
                        p.observations
                      }
                    </div>
                  )}

                  {attente && (
                    <div
                      className={
                        styles.validationGrid
                      }
                    >
                      <form
                        action={
                          validerPaiementAbonnement
                        }
                        className={
                          styles.validateForm
                        }
                      >
                        <input
                          type="hidden"
                          name="paiement_id"
                          value={p.id}
                        />

                        <label>
                          Quota élèves
                          à appliquer
                          quand
                          l'abonnement
                          sera soldé

                          <input
                            type="number"
                            name="quota_eleves"
                            min="1"
                            defaultValue="480"
                            required
                          />
                        </label>

                        <label>
                          Observation

                          <input
                            name="observation_validation"
                            defaultValue="Paiement vérifié et confirmé."
                          />
                        </label>

                        <button
                          className={
                            styles.validateButton
                          }
                        >
                          Valider ce
                          versement
                        </button>
                      </form>

                      <form
                        action={
                          rejeterPaiementAbonnement
                        }
                        className={
                          styles.rejectForm
                        }
                      >
                        <input
                          type="hidden"
                          name="paiement_id"
                          value={p.id}
                        />

                        <label>
                          Motif du rejet

                          <input
                            name="motif_rejet"
                            placeholder="Ex. transaction non retrouvée"
                            required
                          />
                        </label>

                        <button
                          className={
                            styles.rejectButton
                          }
                        >
                          Rejeter
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              );
            }
          )}

          {!paiementsRecus.length && (
            <div
              className={
                styles.empty
              }
            >
              Aucun paiement
              d'abonnement reçu.
            </div>
          )}
        </div>
      </section>

      <div className={styles.grid}>
        <section
          className={styles.panel}
        >
          <h2>
            Créer un abonnement
          </h2>

          <form
            action={
              creerAbonnement
            }
          >
            <select
              name="organisation_id"
              required
            >
              <option value="">
                Client...
              </option>

              {orgs.map((o) => (
                <option
                  value={o.id}
                  key={o.id}
                >
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

            <div
              className={
                styles.duo
              }
            >
              <label>
                Début
                <input
                  name="date_debut"
                  type="date"
                  required
                />
              </label>

              <label>
                Expiration licence
                <input
                  name="date_expiration"
                  type="date"
                  required
                />
              </label>
            </div>

            <label>
              Échéance pour solder
              le paiement

              <input
                name="date_echeance_paiement"
                type="date"
                required
              />

              <small>
                Après cette date,
                tout nouveau
                versement est
                bloqué tant que
                DIGIGROUPE ne
                prolonge pas
                l'échéance.
              </small>
            </label>

            <div
              className={
                styles.duo
              }
            >
              <input
                name="montant"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Montant"
                required
              />

              <select
                name="devise"
              >
                <option>
                  USD
                </option>
                <option>
                  CDF
                </option>
              </select>
            </div>

            <select
              name="periodicite"
            >
              <option
                value="ANNUEL"
              >
                Annuel
              </option>

              <option
                value="SEMESTRIEL"
              >
                Semestriel
              </option>

              <option
                value="TRIMESTRIEL"
              >
                Trimestriel
              </option>

              <option
                value="MENSUEL"
              >
                Mensuel
              </option>

              <option
                value="PERSONNALISE"
              >
                Personnalisé
              </option>
            </select>

            <textarea
              name="observations"
              placeholder="Observations"
            />

            <button>
              Créer l'abonnement
              EN_ATTENTE
            </button>
          </form>
        </section>

        <section
          className={styles.panel}
        >
          <h2>
            Enregistrer un
            versement manuel
          </h2>

          <form
            action={
              enregistrerPaiement
            }
          >
            <select
              name="abonnement_id"
              required
            >
              <option value="">
                Abonnement...
              </option>

              {abos.map((a) => {
                const f =
                  financier(a);

                return (
                  <option
                    value={a.id}
                    key={a.id}
                  >
                    {a.client} —{" "}
                    {
                      a.code_abonnement
                    } — Solde{" "}
                    {monnaie(
                      f.solde,
                      a.devise
                    )}
                  </option>
                );
              })}
            </select>

            <div
              className={
                styles.duo
              }
            >
              <input
                name="montant"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Montant du versement"
              />

              <select
                name="devise"
              >
                <option>
                  USD
                </option>
                <option>
                  CDF
                </option>
              </select>
            </div>

            <input
              name="date_paiement"
              type="date"
              required
            />

            <input
              name="mode_paiement"
              placeholder="Mode de paiement"
            />

            <input
              name="reference_paiement"
              placeholder="Référence"
            />

            <textarea
              name="observations"
              placeholder="Observations"
            />

            <button>
              Enregistrer
              EN_ATTENTE
            </button>
          </form>
        </section>
      </div>

      <section
        className={styles.panel}
      >
        <div
          className={
            styles.sectionHeadSimple
          }
        >
          <div>
            <small>
              SUIVI FINANCIER
            </small>

            <h2>
              Abonnements,
              soldes et échéances
            </h2>
          </div>
        </div>

        <div
          className={
            styles.abonnementCards
          }
        >
          {abos.map((a) => {
            const f =
              financier(a);

            return (
              <article
                className={
                  styles.abonnementCard
                }
                key={a.id}
              >
                <div
                  className={
                    styles.aboTop
                  }
                >
                  <div>
                    <h3>
                      {a.client}
                    </h3>

                    <p>
                      {
                        a.code_abonnement
                      }{" "}
                      •{" "}
                      {a.formule ||
                        "Standard"}
                    </p>
                  </div>

                  <span
                    className={
                      styles.financeStatus
                    }
                    data-status={f.statut.toLowerCase()}
                  >
                    {f.statut}
                  </span>
                </div>

                <div
                  className={
                    styles.financialGrid
                  }
                >
                  <div>
                    <small>
                      Montant
                    </small>
                    <b>
                      {monnaie(
                        f.total,
                        a.devise
                      )}
                    </b>
                  </div>

                  <div>
                    <small>
                      Validé
                    </small>
                    <b>
                      {monnaie(
                        f.paye,
                        a.devise
                      )}
                    </b>
                  </div>

                  <div>
                    <small>
                      En attente
                    </small>
                    <b>
                      {monnaie(
                        f.attente,
                        a.devise
                      )}
                    </b>
                  </div>

                  <div>
                    <small>
                      Solde
                    </small>
                    <b>
                      {monnaie(
                        f.solde,
                        a.devise
                      )}
                    </b>
                  </div>
                </div>

                <div
                  className={
                    styles.progressBar
                  }
                >
                  <span
                    style={{
                      width: `${f.progression}%`,
                    }}
                  />
                </div>

                <div
                  className={
                    styles.aboDates
                  }
                >
                  <span>
                    Échéance paiement :
                    <b>
                      {" "}
                      {dateFR(
                        a.date_echeance_paiement
                      )}
                    </b>
                  </span>

                  <span>
                    Expiration licence :
                    <b>
                      {" "}
                      {dateFR(
                        a.date_expiration
                      )}
                    </b>
                  </span>
                </div>

                {f.echeanceExpiree && (
                  <div
                    className={
                      styles.expiredBox
                    }
                  >
                    Échéance dépassée :
                    nouveaux versements
                    bloqués.
                  </div>
                )}

                <form
                  action={
                    prolongerEcheancePaiement
                  }
                  className={
                    styles.extendForm
                  }
                >
                  <input
                    type="hidden"
                    name="abonnement_id"
                    value={a.id}
                  />

                  <label>
                    Nouvelle échéance
                    <input
                      name="nouvelle_echeance"
                      type="date"
                      required
                    />
                  </label>

                  <label>
                    Motif
                    <input
                      name="motif_prolongation"
                      placeholder="Accord commercial exceptionnel"
                    />
                  </label>

                  <button>
                    Prolonger
                    l'échéance
                  </button>
                </form>

                <form
                  className={
                    styles.inline
                  }
                  action={
                    renouvelerAbonnement
                  }
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
                    placeholder="Montant renouvellement"
                  />

                  <input
                    type="hidden"
                    name="devise"
                    value={a.devise}
                  />

                  <button>
                    Renouveler
                    l'abonnement
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
