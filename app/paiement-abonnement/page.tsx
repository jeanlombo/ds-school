"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
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
};

type Etape = "verification" | "paiement" | "confirmation";

export default function PaiementAbonnementPage() {
  const [etape, setEtape] = useState<Etape>("verification");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [reference, setReference] = useState("");
  const [modePaiement, setModePaiement] = useState("MPESA");

  async function verifier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChargement(true);
    setMessage("");

    try {
      const fd = new FormData(e.currentTarget);
      const reponse = await fetch("/api/paiement-abonnement/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(resultat.message || "Impossible de vérifier l'abonnement.");
      }

      setAbonnement(resultat.abonnement);
      setEtape("paiement");
    } catch (erreur) {
      setMessage(erreur instanceof Error ? erreur.message : "Erreur de vérification.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abonnementId: abonnement.id,
          ...Object.fromEntries(fd.entries()),
        }),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(resultat.message || "Impossible d'initier le paiement.");
      }

      setReference(resultat.reference);
      setEtape("confirmation");
    } catch (erreur) {
      setMessage(erreur instanceof Error ? erreur.message : "Erreur pendant l'initiation.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link href="/" className={styles.retour}>
          <ArrowLeft size={17} /> Retour à la vitrine
        </Link>

        <section className={styles.carte}>
          <div className={styles.entete}>
            <span className={styles.icone}><WalletCards size={28} /></span>
            <div>
              <small>DS SCHOOL ENTERPRISE</small>
              <h1>Paiement d’abonnement</h1>
              <p>
                Réglez ou préparez le règlement de votre abonnement DS School
                à partir du code communiqué par DIGIGROUPE.
              </p>
            </div>
          </div>

          <div className={styles.etapes}>
            <span className={etape !== "verification" ? styles.fait : styles.actif}>1. Vérification</span>
            <span className={etape === "paiement" ? styles.actif : etape === "confirmation" ? styles.fait : ""}>2. Paiement</span>
            <span className={etape === "confirmation" ? styles.actif : ""}>3. Confirmation</span>
          </div>

          {message && <div className={styles.erreur}>{message}</div>}

          {etape === "verification" && (
            <form onSubmit={verifier} className={styles.form}>
              <div className={styles.info}>
                <LockKeyhole size={20} />
                <p>
                  Utilisez le <strong>code d’abonnement</strong> et l’adresse e-mail
                  ou le téléphone enregistrés par DIGIGROUPE.
                </p>
              </div>

              <label>
                Code d’abonnement
                <input name="codeAbonnement" required placeholder="Ex. ABO-GROUPE-2026-001" autoComplete="off" />
              </label>

              <label>
                E-mail ou téléphone du client
                <input name="contact" required placeholder="contact@ecole.cd ou +243..." autoComplete="off" />
              </label>

              <button disabled={chargement}>
                {chargement ? <><LoaderCircle className={styles.spin} size={18}/> Vérification...</> : "Continuer"}
              </button>
            </form>
          )}

          {etape === "paiement" && abonnement && (
            <>
              <div className={styles.resume}>
                <div><Building2 size={20}/><span>Client</span><strong>{abonnement.client}</strong></div>
                <div><CreditCard size={20}/><span>Abonnement</span><strong>{abonnement.code}</strong></div>
                <div><WalletCards size={20}/><span>Formule</span><strong>{abonnement.formule || "Personnalisée"}</strong></div>
                <div className={styles.montant}><span>Montant de l’abonnement</span><strong>{abonnement.montant.toLocaleString("fr-FR")} {abonnement.devise}</strong></div>
              </div>

              <form onSubmit={initierPaiement} className={styles.form}>
                <label>
                  Moyen de paiement
                  <select
                    name="modePaiement"
                    required
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value)}
                  >
                    <option value="MPESA">M-Pesa</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="CARTE_BANCAIRE">Carte bancaire</option>
                    <option value="VIREMENT">Virement bancaire</option>
                  </select>
                </label>

                <label>
                  {modePaiement === "MPESA" || modePaiement === "AIRTEL_MONEY" || modePaiement === "ORANGE_MONEY"
                    ? "Votre numéro Mobile Money"
                    : "Numéro / compte de paiement"}
                  <div className={styles.champIcone}>
                    <Smartphone size={18}/>
                    <input name="comptePaiement" required placeholder="+243..." />
                  </div>
                </label>

                {(modePaiement === "MPESA" || modePaiement === "AIRTEL_MONEY" || modePaiement === "ORANGE_MONEY") && (
                  <div className={styles.caisseBox}>
                    <div className={styles.caisseTitre}>
                      <Smartphone size={20}/>
                      <div>
                        <strong>Numéro caisse DIGIGROUPE</strong>
                        <small>Renseignez le numéro caisse officiel communiqué par DIGIGROUPE pour ce réseau.</small>
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

                    <div className={styles.avertissementCaisse}>
                      Le paiement restera <b>EN ATTENTE</b> jusqu'à confirmation réelle du réseau ou validation par DIGIGROUPE.
                    </div>
                  </div>
                )}

                <label>
                  Montant à payer
                  <input
                    name="montant"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={abonnement.montant}
                    required
                  />
                  <small>
                    Le système n’active pas automatiquement une licence tant que
                    le paiement n’est pas confirmé par la passerelle ou validé par DIGIGROUPE.
                  </small>
                </label>

                <button disabled={chargement}>
                  {chargement ? <><LoaderCircle className={styles.spin} size={18}/> Traitement...</> : "Initier le paiement"}
                </button>
              </form>
            </>
          )}

          {etape === "confirmation" && (
            <div className={styles.confirmation}>
              <CheckCircle2 size={54}/>
              <h2>Demande de paiement enregistrée</h2>
              <p>Votre référence est :</p>
              <strong className={styles.reference}>{reference}</strong>
              <p>
                Le paiement est actuellement <b>EN ATTENTE</b>. Il passera à
                <b> VALIDE</b> uniquement après confirmation réelle du prestataire
                de paiement ou validation par DIGIGROUPE.
              </p>
              <Link href="/">Retour à l’accueil</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
