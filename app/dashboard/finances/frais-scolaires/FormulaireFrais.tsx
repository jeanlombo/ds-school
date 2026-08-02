"use client";

import { useMemo, useState } from "react";
import { CalendarDays, RefreshCw, WalletCards } from "lucide-react";
import styles from "./frais-scolaires.module.css";

type Valeurs = {
  code?: string;
  libelle?: string;
  famille?: string;
  nature?: string;
  categorie?: string;
  periodicite?: string;
  description?: string | null;
  obligatoire?: boolean;
  actif?: boolean;
  penaliteActive?: boolean;
  typePenalite?: string | null;
  valeurPenalite?: number;
  delaiGraceJours?: number;
};

type AnneeOption = {
  id: number;
  libelle: string;
  active?: boolean;
};

type ClasseOption = {
  id: number;
  nom: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  valeurs?: Valeurs;
  libelleBouton: string;

  /**
   * Active la création simultanée du premier tarif.
   * Utilisé sur la page "Nouveau frais scolaire".
   */
  afficherTarifInitial?: boolean;
  annees?: AnneeOption[];
  classes?: ClasseOption[];
  deviseParDefaut?: string;
};

const naturesParFamille: Record<string, string[]> = {
  ACADEMIQUES: [
    "INSCRIPTION",
    "MINERVAL",
    "EXAMEN",
    "BULLETIN",
    "DIPLOME",
    "CERTIFICAT",
    "LABORATOIRE",
    "BIBLIOTHEQUE",
  ],
  ADMINISTRATIFS: [
    "DOSSIER",
    "CARTE_ELEVE",
    "DOCUMENT_SCOLAIRE",
    "TRANSFERT",
    "ATTESTATION",
  ],
  SERVICES_SCOLAIRES: [
    "TRANSPORT",
    "CANTINE",
    "INTERNAT",
    "SANTE_SCOLAIRE",
    "GARDERIE",
  ],
  ACTIVITES: [
    "EXCURSION",
    "SPORT",
    "CULTURE",
    "CLUB",
    "CEREMONIE",
  ],
  EQUIPEMENTS: [
    "UNIFORME",
    "FOURNITURES",
    "MANUELS",
    "EQUIPEMENT_NUMERIQUE",
  ],
  AUTRES: ["AUTRE"],
};

const libellesNature: Record<string, string> = {
  INSCRIPTION: "Frais d’inscription",
  MINERVAL: "Minerval / Scolarité",
  EXAMEN: "Frais d’examen",
  BULLETIN: "Bulletin",
  DIPLOME: "Diplôme",
  CERTIFICAT: "Certificat",
  LABORATOIRE: "Laboratoire",
  BIBLIOTHEQUE: "Bibliothèque",
  DOSSIER: "Ouverture de dossier",
  CARTE_ELEVE: "Carte d’élève",
  DOCUMENT_SCOLAIRE: "Document scolaire",
  TRANSFERT: "Transfert",
  ATTESTATION: "Attestation",
  TRANSPORT: "Transport scolaire",
  CANTINE: "Cantine",
  INTERNAT: "Internat / Pension",
  SANTE_SCOLAIRE: "Santé scolaire",
  GARDERIE: "Garderie",
  EXCURSION: "Excursion",
  SPORT: "Activité sportive",
  CULTURE: "Activité culturelle",
  CLUB: "Club scolaire",
  CEREMONIE: "Cérémonie",
  UNIFORME: "Uniforme",
  FOURNITURES: "Fournitures",
  MANUELS: "Manuels scolaires",
  EQUIPEMENT_NUMERIQUE: "Équipement numérique",
  AUTRE: "Autre",
};

function genererCode(libelle: string): string {
  return libelle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " ET ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase()
    .slice(0, 80);
}

export default function FormulaireFrais({
  action,
  valeurs = {},
  libelleBouton,
  afficherTarifInitial = false,
  annees = [],
  classes = [],
  deviseParDefaut = "CDF",
}: Props) {
  const [libelle, setLibelle] = useState(valeurs.libelle ?? "");
  const [code, setCode] = useState(
    valeurs.code ?? genererCode(valeurs.libelle ?? "")
  );
  const [codeManuel, setCodeManuel] = useState(Boolean(valeurs.code));
  const [famille, setFamille] = useState(
    valeurs.famille ?? "ACADEMIQUES"
  );
  const [nature, setNature] = useState(
    valeurs.nature ?? valeurs.categorie ?? "MINERVAL"
  );
  const [penaliteActive, setPenaliteActive] = useState(
    Boolean(valeurs.penaliteActive)
  );

  const natures = useMemo(
    () => naturesParFamille[famille] ?? ["AUTRE"],
    [famille]
  );

  const anneeActive =
    annees.find((annee) => Boolean(annee.active)) ?? annees[0];

  function changerLibelle(valeur: string) {
    setLibelle(valeur);

    if (!codeManuel) {
      setCode(genererCode(valeur));
    }
  }

  function changerFamille(valeur: string) {
    setFamille(valeur);
    setNature(naturesParFamille[valeur]?.[0] ?? "AUTRE");
  }

  return (
    <form action={action} className={styles.formulaire}>
      <div className={styles.grilleFormulaire}>
        <label>
          <span>Libellé du frais *</span>
          <input
            name="libelle"
            required
            value={libelle}
            onChange={(event) =>
              changerLibelle(event.target.value)
            }
          />
        </label>

        <label>
          <span>Code du frais</span>

          <div className={styles.champCode}>
            <input
              name="code"
              required
              value={code}
              onChange={(event) => {
                setCode(genererCode(event.target.value));
                setCodeManuel(true);
              }}
            />

            <button
              type="button"
              title="Régénérer le code"
              onClick={() => {
                setCode(genererCode(libelle));
                setCodeManuel(false);
              }}
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <small>
            Généré automatiquement, mais modifiable.
          </small>
        </label>

        <label>
          <span>Famille de frais *</span>

          <select
            name="famille"
            value={famille}
            onChange={(event) =>
              changerFamille(event.target.value)
            }
          >
            <option value="ACADEMIQUES">
              Frais académiques
            </option>
            <option value="ADMINISTRATIFS">
              Frais administratifs
            </option>
            <option value="SERVICES_SCOLAIRES">
              Services scolaires
            </option>
            <option value="ACTIVITES">
              Activités parascolaires
            </option>
            <option value="EQUIPEMENTS">
              Équipements et fournitures
            </option>
            <option value="AUTRES">Autres</option>
          </select>
        </label>

        <label>
          <span>Nature du frais *</span>

          <select
            name="nature"
            value={nature}
            onChange={(event) =>
              setNature(event.target.value)
            }
          >
            {natures.map((item) => (
              <option key={item} value={item}>
                {libellesNature[item] ?? item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Périodicité *</span>

          <select
            name="periodicite"
            defaultValue={valeurs.periodicite ?? "MENSUEL"}
          >
            <option value="UNIQUE">Paiement unique</option>
            <option value="MENSUEL">Mensuel</option>
            <option value="TRIMESTRIEL">Trimestriel</option>
            <option value="SEMESTRIEL">Semestriel</option>
            <option value="ANNUEL">Annuel</option>
            <option value="PERSONNALISE">Personnalisé</option>
          </select>
        </label>

        <label className={styles.large}>
          <span>Description</span>

          <textarea
            name="description"
            rows={4}
            defaultValue={valeurs.description ?? ""}
          />
        </label>
      </div>

      {afficherTarifInitial && (
        <section className={styles.blocPenalite}>
          <div className={styles.titreSection}>
            <div>
              <h2>Montant et affectation initiale</h2>
              <p>
                Le premier tarif actif sera créé en même temps
                que le frais scolaire.
              </p>
            </div>

            <WalletCards size={26} />
          </div>

          {!annees.length ? (
            <div className={styles.erreur}>
              Aucune année scolaire n’est disponible. Créez
              d’abord une année scolaire avant d’enregistrer
              ce frais.
            </div>
          ) : (
            <div className={styles.grilleTarif}>
              <label>
                <span>Montant initial *</span>

                <input
                  type="number"
                  name="montant_initial"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="Ex. 50"
                />
              </label>

              <label>
                <span>Devise *</span>

                <select
                  name="devise_initiale"
                  defaultValue={
                    ["CDF", "USD"].includes(
                      deviseParDefaut.toUpperCase()
                    )
                      ? deviseParDefaut.toUpperCase()
                      : "CDF"
                  }
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                </select>
              </label>

              <label>
                <span>Année scolaire *</span>

                <select
                  name="annee_scolaire_id"
                  required
                  defaultValue={anneeActive?.id}
                >
                  {annees.map((annee) => (
                    <option key={annee.id} value={annee.id}>
                      {annee.libelle}
                      {annee.active ? " — Active" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Classe concernée</span>

                <select
                  name="classe_id"
                  defaultValue="0"
                >
                  <option value="0">
                    Toutes les classes
                  </option>

                  {classes.map((classe) => (
                    <option
                      key={classe.id}
                      value={classe.id}
                    >
                      {classe.nom}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date d’échéance</span>

                <input
                  type="date"
                  name="date_echeance"
                />
              </label>

              <label className={styles.caseTarif}>
                <input
                  type="checkbox"
                  name="tarif_actif"
                  defaultChecked
                />
                <span>Tarif actif immédiatement</span>
              </label>
            </div>
          )}

          <p
            style={{
              margin: "14px 0 0",
              color: "#64748b",
              fontSize: ".86rem",
              lineHeight: 1.6,
            }}
          >
            <CalendarDays
              size={15}
              style={{
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />
            Choisissez « Toutes les classes » si le même
            montant doit s’appliquer à tous les élèves de
            l’année scolaire sélectionnée.
          </p>
        </section>
      )}

      <div className={styles.options}>
        <label className={styles.case}>
          <input
            type="checkbox"
            name="obligatoire"
            defaultChecked={valeurs.obligatoire ?? true}
          />
          <span>Frais obligatoire</span>
        </label>

        <label className={styles.case}>
          <input
            type="checkbox"
            name="actif"
            defaultChecked={valeurs.actif ?? true}
          />
          <span>Frais actif</span>
        </label>
      </div>

      <section className={styles.blocPenalite}>
        <div className={styles.entetePenalite}>
          <div>
            <h2>Pénalité de retard facultative</h2>
            <p>
              Désactivée par défaut et appliquée uniquement
              sur décision de l’établissement.
            </p>
          </div>

          <label className={styles.interrupteur}>
            <input
              type="checkbox"
              name="penalite_active"
              checked={penaliteActive}
              onChange={(event) =>
                setPenaliteActive(event.target.checked)
              }
            />
            <span>
              {penaliteActive ? "Activée" : "Désactivée"}
            </span>
          </label>
        </div>

        {penaliteActive && (
          <div className={styles.grillePenalite}>
            <label>
              <span>Type</span>

              <select
                name="type_penalite"
                defaultValue={
                  valeurs.typePenalite ?? "MONTANT_FIXE"
                }
              >
                <option value="MONTANT_FIXE">
                  Montant fixe
                </option>
                <option value="POURCENTAGE">
                  Pourcentage
                </option>
              </select>
            </label>

            <label>
              <span>Valeur</span>

              <input
                type="number"
                name="valeur_penalite"
                min="0"
                step="0.01"
                defaultValue={
                  valeurs.valeurPenalite ?? 0
                }
              />
            </label>

            <label>
              <span>Délai de grâce</span>

              <input
                type="number"
                name="delai_grace_jours"
                min="0"
                defaultValue={
                  valeurs.delaiGraceJours ?? 0
                }
              />
            </label>
          </div>
        )}
      </section>

      <div className={styles.actions}>
        <button
          className={styles.primaire}
          disabled={afficherTarifInitial && !annees.length}
        >
          {libelleBouton}
        </button>
      </div>
    </form>
  );
}
