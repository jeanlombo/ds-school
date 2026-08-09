"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Smartphone,
  WalletCards,
} from "lucide-react";

import styles from "./paiement.module.css";

type Abonnement = {
  id: number;
  code: string;
  client: string;
  formule: string;
  montant: number;
  devise: string;
  statut: string;
  dateExpiration: string | null;

  dateEcheancePaiement: string | null;
  totalPaye: number;
  totalEnAttente: number;
  soldeRestant: number;
  disponibleNouveauPaiement: number;
  statutFinancier: string;
  paiementBloque: boolean;
  echeanceExpiree: boolean;
};

type Etape = "verification" | "paiement" | "confirmation";

function monnaie(v: number, devise: string) {
  return `${Number(v || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  })} ${devise}`;
}

function dateFR(v: string | null) {
  if (!v) return "Non définie";

  const d = new Date(`${v.slice(0, 10)}T00:00:00`);

  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("fr-FR");
}

export default function PaiementAbonnementPage() {
  const [etape, setEtape] = useState<Etape>("verification");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [reference, setReference] = useState("");
  const [modePaiement, setModePaiement] = useState("MPESA");

  const progression = useMemo(() => {
    if (!abonnement || abonnement.montant <= 0) return 0;

    return Math.min(
      100,
      Math.round((abonnement.totalPaye / abonnement.montant) * 100)
    );
  }, [abonnement]);

  async function verifier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setChargement(true);
    setMessage("");

    try {
      const fd = new FormData(e.currentTarget);

      const reponse = await fetch("/api/paiement-abonnement/verifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.message || "Impossible de vérifier l'abonnement."
        );
      }

      setAbonnement(resultat.abonnement);
      setEtape("paiement");
    } catch (erreur) {
      setMessage(
        erreur instanceof Error
          ? erreur.message
          : "Erreur de vérification."
      );
    } finally {
      setChargement(false);
    }
  }

  async function initierPaiement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!abonnement) return;

    setChargement(true);
    setMessage("");

    try {
      const fd = new FormData(e.currentTarget);

      const reponse = await fetch("/api/paiement-abonnement/initier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abonnementId: abonnement.id,
          ...Object.fromEntries(fd.entries()),
        }),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.message || "Impossible d'initier le paiement."
        );
      }

      setReference(resultat.reference);
      setEtape("confirmation");
    } catch (erreur) {
      setMessage(
        erreur instanceof Error
          ? erreur.message
          : "Erreur pendant l'initiation."
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link href="/" className={styles.retour}>
          <ArrowLeft size={17} />
          Retour à la vitrine
        </Link>

        <section className={styles.carte}>
          <div className={styles.entete}>
            <span className={styles.icone}>
              <WalletCards size={28} />
            </span>

            <div>
              <small>DS SCHOOL ENTERPRISE</small>
              <h1>Paiement d’abonnement</h1>
              <p>
                Paiement total ou partiel de votre abonnement, selon
                l’échéance accordée par DIGIGROUPE.
              </p>
            </div>
          </div>

          <div className={styles.etapes}>
            <span
              className={
                etape !== "verification" ? styles.fait : styles.actif
              }
            >
              1. Vérification
            </span>

            <span
              className={
                etape === "paiement"
                  ? styles.actif
                  : etape === "confirmation"
                    ? styles.fait
                    : ""
              }
            >
              2. Paiement
            </span>

            <span
              className={etape === "confirmation" ? styles.actif : ""}
            >
              3. Confirmation
            </span>
          </div>

          {message && <div className={styles.erreur}>{message}</div>}

          {etape === "verification" && (
            <form onSubmit={verifier} className={styles.form}>
              <div className={styles.info}>
                <LockKeyhole size={20} />

                <p>
                  Utilisez le <strong>code d’abonnement</strong> et
                  l’adresse e-mail ou le téléphone enregistrés par
                  DIGIGROUPE.
                </p>
              </div>

              <label>
                Code d’abonnement
                <input
                  name="codeAbonnement"
                  required
                  placeholder="Ex. ABO-GROUPE-2026-001"
                  autoComplete="off"
                />
              </label>

              <label>
                E-mail ou téléphone du client
                <input
                  name="contact"
                  required
                  placeholder="contact@ecole.cd ou +243..."
                  autoComplete="off"
                />
              </label>

              <button disabled={chargement}>
                {chargement ? (
                  <>
                    <LoaderCircle
                      className={styles.spin}
                      size={18}
                    />
                    Vérification...
                  </>
                ) : (
                  "Continuer"
                )}
              </button>
            </form>
          )}

          {etape === "paiement" && abonnement && (
            <>
              <div className={styles.resume}>
                <div>
                  <Building2 size={20} />
                  <span>Client</span>
                  <strong>{abonnement.client}</strong>
                </div>

                <div>
                  <CreditCard size={20} />
                  <span>Abonnement</span>
                  <strong>{abonnement.code}</strong>
                </div>

                <div>
                  <WalletCards size={20} />
                  <span>Formule</span>
                  <strong>
                    {abonnement.formule || "Personnalisée"}
                  </strong>
                </div>

                <div>
                  <CalendarClock size={20} />
                  <span>Échéance du solde</span>
                  <strong>
                    {dateFR(abonnement.dateEcheancePaiement)}
                  </strong>
                </div>
              </div>

              <div className={styles.financier}>
                <div>
                  <small>Montant abonnement</small>
                  <b>
                    {monnaie(
                      abonnement.montant,
                      abonnement.devise
                    )}
                  </b>
                </div>

                <div>
                  <small>Déjà validé</small>
                  <b>
                    {monnaie(
                      abonnement.totalPaye,
                      abonnement.devise
                    )}
                  </b>
                </div>

                <div>
                  <small>En attente</small>
                  <b>
                    {monnaie(
                      abonnement.totalEnAttente,
                      abonnement.devise
                    )}
                  </b>
                </div>

                <div>
                  <small>Solde restant</small>
                  <b>
                    {monnaie(
                      abonnement.soldeRestant,
                      abonnement.devise
                    )}
                  </b>
                </div>
              </div>

              <div className={styles.progressionBloc}>
                <div>
                  <span>Progression du paiement</span>
                  <strong>{progression}%</strong>
                </div>

                <div className={styles.progression}>
                  <span style={{ width: `${progression}%` }} />
                </div>
              </div>

              {abonnement.echeanceExpiree && (
                <div className={styles.blocage}>
                  <CalendarClock size={22} />

                  <div>
                    <strong>Échéance de paiement dépassée</strong>

                    <p>
                      Le délai accordé pour solder cet abonnement est
                      expiré. Aucun nouveau versement ne peut être
                      enregistré. Contactez DIGIGROUPE pour une
                      prolongation.
                    </p>
                  </div>
                </div>
              )}

              {!abonnement.echeanceExpiree &&
                abonnement.soldeRestant <= 0 && (
                  <div className={styles.solded}>
                    <CheckCircle2 size={22} />

                    <div>
                      <strong>Abonnement soldé</strong>

                      <p>
                        Le montant de cet abonnement a déjà été
                        entièrement couvert.
                      </p>
                    </div>
                  </div>
                )}

              {!abonnement.paiementBloque && (
                <form
                  onSubmit={initierPaiement}
                  className={styles.form}
                >
                  <label>
                    Moyen de paiement

                    <select
                      name="modePaiement"
                      required
                      value={modePaiement}
                      onChange={(e) =>
                        setModePaiement(e.target.value)
                      }
                    >
                      <option value="MPESA">M-Pesa</option>
                      <option value="AIRTEL_MONEY">
                        Airtel Money
                      </option>
                      <option value="ORANGE_MONEY">
                        Orange Money
                      </option>
                      <option value="CARTE_BANCAIRE">
                        Carte bancaire
                      </option>
                      <option value="VIREMENT">
                        Virement bancaire
                      </option>
                    </select>
                  </label>

                  <label>
                    {modePaiement === "MPESA" ||
                    modePaiement === "AIRTEL_MONEY" ||
                    modePaiement === "ORANGE_MONEY"
                      ? "Votre numéro Mobile Money"
                      : "Numéro / compte de paiement"}

                    <div className={styles.champIcone}>
                      <Smartphone size={18} />

                      <input
                        name="comptePaiement"
                        required
                        placeholder="+243..."
                      />
                    </div>
                  </label>

                  {(modePaiement === "MPESA" ||
                    modePaiement === "AIRTEL_MONEY" ||
                    modePaiement === "ORANGE_MONEY") && (
                    <div className={styles.caisseBox}>
                      <div className={styles.caisseTitre}>
                        <Smartphone size={20} />

                        <div>
                          <strong>
                            Numéro caisse DIGIGROUPE
                          </strong>

                          <small>
                            Utilisez le numéro caisse/marchand
                            officiel DIGIGROUPE du réseau choisi.
                          </small>
                        </div>
                      </div>

                      <label>
                        Numéro caisse / marchand

                        <input
                          name="numeroCaisse"
                          required
                          placeholder={
                            modePaiement === "MPESA"
                              ? "Numéro caisse M-Pesa DIGIGROUPE"
                              : modePaiement === "AIRTEL_MONEY"
                                ? "Numéro marchand Airtel Money DIGIGROUPE"
                                : "Numéro marchand Orange Money DIGIGROUPE"
                          }
                          autoComplete="off"
                        />
                      </label>
                    </div>
                  )}

                  <label>
                    Montant de ce versement

                    <input
                      name="montant"
                      type="number"
                      min="0.01"
                      max={Math.max(
                        0.01,
                        abonnement.disponibleNouveauPaiement
                      )}
                      step="0.01"
                      defaultValue={
                        abonnement.disponibleNouveauPaiement
                      }
                      required
                    />

                    <small>
                      Vous pouvez payer une partie du solde. Le
                      compte ne sera activé qu’après validation des
                      paiements et règlement complet avant
                      l’échéance.
                    </small>
                  </label>

                  <button disabled={chargement}>
                    {chargement ? (
                      <>
                        <LoaderCircle
                          className={styles.spin}
                          size={18}
                        />
                        Traitement...
                      </>
                    ) : (
                      "Enregistrer ce versement"
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {etape === "confirmation" && (
            <div className={styles.confirmation}>
              <CheckCircle2 size={54} />

              <h2>Versement enregistré</h2>

              <p>Votre référence est :</p>

              <strong className={styles.reference}>
                {reference}
              </strong>

              <p>
                Ce versement est actuellement <b>EN ATTENTE</b>.
                DIGIGROUPE devra le vérifier. Si le montant total
                validé atteint le montant de l’abonnement avant
                l’échéance, l’abonnement et la licence pourront être
                activés.
              </p>

              <Link href="/">Retour à l’accueil</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
