"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Send,
} from "lucide-react";

import styles from "./demande.module.css";

export default function DemandePage() {
  const [type, setType] =
    useState("TARIFICATION");

  const [
    typeEtablissement,
    setTypeEtablissement,
  ] = useState("SECONDAIRE");

  const [effectif, setEffectif] =
    useState("");

  const [etat, setEtat] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");

  const [
    messageRetour,
    setMessageRetour,
  ] = useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const typeUrl =
      params.get("type");

    const etablissementUrl =
      params.get("etablissement");

    const effectifUrl =
      params.get("effectif");

    if (typeUrl) {
      setType(
        typeUrl.toUpperCase(),
      );
    }

    if (etablissementUrl) {
      setTypeEtablissement(
        etablissementUrl.toUpperCase(),
      );
    }

    if (effectifUrl) {
      setEffectif(effectifUrl);
    }
  }, []);

  async function envoyer(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setEtat("loading");
    setMessageRetour("");

    const formulaire =
      e.currentTarget;

    const fd =
      new FormData(formulaire);

    const payload =
      Object.fromEntries(
        fd.entries(),
      );

    try {
      const reponse =
        await fetch(
          "/api/demandes",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const resultat =
        await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.message ||
            "Impossible d'enregistrer la demande.",
        );
      }

      setEtat("ok");

      setMessageRetour(
        `Demande enregistrée avec succès. Référence : ${resultat.reference}`,
      );

      formulaire.reset();
    } catch (erreur) {
      console.error(
        "ERREUR DEMANDE VITRINE:",
        erreur,
      );

      setEtat("error");

      setMessageRetour(
        erreur instanceof Error
          ? erreur.message
          : "Erreur pendant l'envoi de la demande.",
      );
    }
  }

  return (
    <main
      className={styles.page}
    >
      <div
        className={styles.wrap}
      >
        <Link
          href="/"
          className={
            styles.retour
          }
        >
          <ArrowLeft size={17} />
          Retour à la vitrine
        </Link>

        <section
          className={styles.card}
        >
          <div
            className={
              styles.intro
            }
          >
            <span>
              DS SCHOOL ENTERPRISE
            </span>

            <h1>
              Parlons de votre
              établissement
            </h1>

            <p>
              Votre demande sera
              transmise directement à
              l’administration
              DIGIGROUPE.
              Pour la tarification,
              le montant sera
              déterminé selon
              l’effectif déclaré et
              les paramètres
              commerciaux déjà
              gérés dans
              l’administration.
            </p>
          </div>

          {etat === "ok" ? (
            <div
              className={
                styles.succes
              }
            >
              <CheckCircle2
                size={42}
              />

              <h2>
                Demande reçue
              </h2>

              <p>
                {messageRetour}
              </p>

              <Link href="/">
                Retour à l’accueil
              </Link>
            </div>
          ) : (
            <form
              onSubmit={
                envoyer
              }
              className={
                styles.form
              }
            >
              <label>
                Objet de la
                demande

                <select
                  name="type"
                  value={type}
                  onChange={(
                    e,
                  ) =>
                    setType(
                      e.target
                        .value,
                    )
                  }
                >
                  <option value="TARIFICATION">
                    Demande de
                    tarification
                  </option>

                  <option value="DEMONSTRATION">
                    Demande de
                    démonstration
                  </option>

                  <option value="INFORMATION">
                    Demande
                    d'information
                  </option>

                  <option value="ASSISTANCE">
                    Assistance
                  </option>

                  <option value="INSCRIPTION">
                    Demande
                    d'inscription
                  </option>
                </select>
              </label>

              <div
                className={
                  styles.duo
                }
              >
                <label>
                  Nom de
                  l’établissement

                  <input
                    name="nomEtablissement"
                    required
                    placeholder="Ex. Complexe Scolaire Horizon"
                  />
                </label>

                <label>
                  Type
                  d’établissement

                  <select
                    name="typeEtablissement"
                    value={
                      typeEtablissement
                    }
                    onChange={(
                      e,
                    ) =>
                      setTypeEtablissement(
                        e.target
                          .value,
                      )
                    }
                  >
                    <option value="PRIMAIRE">
                      Primaire
                    </option>

                    <option value="SECONDAIRE">
                      Secondaire
                    </option>

                    <option value="PRIMAIRE_SECONDAIRE">
                      Primaire +
                      Secondaire
                    </option>

                    <option value="UNIVERSITE">
                      Université
                    </option>

                    <option value="MIXTE">
                      Mixte / Groupe
                    </option>
                  </select>
                </label>
              </div>

              {type ===
                "TARIFICATION" && (
                <label>
                  Nombre
                  d’élèves /
                  étudiants

                  <input
                    name="effectif"
                    type="number"
                    min="1"
                    required
                    value={
                      effectif
                    }
                    onChange={(
                      e,
                    ) =>
                      setEffectif(
                        e.target
                          .value,
                      )
                    }
                    placeholder="Ex. 850"
                  />

                  <small>
                    Ce nombre sert
                    à préparer
                    l’offre.
                    Le prix n’est
                    pas calculé
                    publiquement
                    sur la
                    vitrine.
                  </small>
                </label>
              )}

              <div
                className={
                  styles.duo
                }
              >
                <label>
                  Nom du
                  responsable

                  <input
                    name="nomResponsable"
                    required
                  />
                </label>

                <label>
                  Téléphone /
                  WhatsApp

                  <input
                    name="telephone"
                    required
                  />
                </label>
              </div>

              <label>
                E-mail

                <input
                  name="email"
                  type="email"
                />
              </label>

              <label>
                Votre message

                <textarea
                  name="message"
                  rows={5}
                  placeholder="Précisez votre besoin..."
                />
              </label>

              {etat ===
                "error" && (
                <p
                  className={
                    styles.erreur
                  }
                >
                  {
                    messageRetour
                  }
                </p>
              )}

              <button
                type="submit"
                disabled={
                  etat ===
                  "loading"
                }
              >
                <Send
                  size={17}
                />

                {etat ===
                "loading"
                  ? "Envoi..."
                  : "Envoyer ma demande"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}