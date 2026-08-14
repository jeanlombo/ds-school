"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Eye,
  FileDown,
  Grid3X3,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Printer,
  RefreshCcw,
  Save,
  Settings2,
  Type,
} from "lucide-react";
import styles from "./document-designer.module.css";

type Modele = {
  id: number;
  nom: string;
  niveau: string | null;
  formatPapier: string;
  orientation: string;
  couleurPrincipale: string;
  actif: boolean;
  parDefaut: boolean;
  version: number;
};

type Bloc = {
  id: string;
  type: "texte" | "titre" | "image" | "tableau" | "separateur";
  contenu: string;
  visible: boolean;
  alignement: "left" | "center" | "right";
  taille: number;
  gras: boolean;
};

type Configuration = {
  couleurPrincipale: string;
  couleurSecondaire: string;
  police: string;
  afficherLogo: boolean;
  afficherDevise: boolean;
  afficherSignatures: boolean;
  afficherObservation: boolean;
  marges: number;
  blocs: Bloc[];
};

const configurationInitiale: Configuration = {
  couleurPrincipale: "#1d4ed8",
  couleurSecondaire: "#eaf2ff",
  police: "Inter",
  afficherLogo: true,
  afficherDevise: true,
  afficherSignatures: true,
  afficherObservation: true,
  marges: 24,
  blocs: [
    {
      id: "entete",
      type: "titre",
      contenu: "BULLETIN SCOLAIRE",
      visible: true,
      alignement: "center",
      taille: 24,
      gras: true,
    },
    {
      id: "identite",
      type: "texte",
      contenu: "Nom de l’établissement · Année scolaire · Classe · Période",
      visible: true,
      alignement: "center",
      taille: 12,
      gras: false,
    },
    {
      id: "eleve",
      type: "texte",
      contenu: "Apprenant : Jean Exemple · Matricule : DS-2026-001",
      visible: true,
      alignement: "left",
      taille: 14,
      gras: true,
    },
    {
      id: "resultats",
      type: "tableau",
      contenu: "Résultats par matière",
      visible: true,
      alignement: "left",
      taille: 13,
      gras: true,
    },
    {
      id: "synthese",
      type: "texte",
      contenu: "Moyenne : 76,50 % · Rang : 2e · Mention : Très bien",
      visible: true,
      alignement: "center",
      taille: 15,
      gras: true,
    },
    {
      id: "observation",
      type: "texte",
      contenu: "Observation de la direction : résultats satisfaisants.",
      visible: true,
      alignement: "left",
      taille: 12,
      gras: false,
    },
  ],
};

function cleStockage(id: number) {
  return `ds-school-document-designer-${id}`;
}

export default function DesignerClient({ modeles }: { modeles: Modele[] }) {
  const [modeleId, setModeleId] = useState<number>(modeles[0]?.id ?? 0);
  const [configuration, setConfiguration] =
    useState<Configuration>(configurationInitiale);
  const [blocActif, setBlocActif] = useState<string>("entete");
  const [message, setMessage] = useState("");
  const zoneImpression = useRef<HTMLDivElement>(null);

  const modele = useMemo(
    () => modeles.find((element) => element.id === modeleId),
    [modeleId, modeles],
  );

  useEffect(() => {
    if (!modeleId) return;

    const sauvegarde = window.localStorage.getItem(cleStockage(modeleId));
    if (sauvegarde) {
      try {
        setConfiguration(JSON.parse(sauvegarde) as Configuration);
        return;
      } catch {
        window.localStorage.removeItem(cleStockage(modeleId));
      }
    }

    setConfiguration({
      ...configurationInitiale,
      couleurPrincipale:
        modele?.couleurPrincipale || configurationInitiale.couleurPrincipale,
    });
  }, [modeleId, modele?.couleurPrincipale]);

  const blocSelectionne = configuration.blocs.find(
    (element) => element.id === blocActif,
  );

  function modifierConfiguration(
    cle: keyof Configuration,
    valeur: Configuration[keyof Configuration],
  ) {
    setConfiguration((ancienne) => ({ ...ancienne, [cle]: valeur }));
  }

  function modifierBloc(cle: keyof Bloc, valeur: Bloc[keyof Bloc]) {
    setConfiguration((ancienne) => ({
      ...ancienne,
      blocs: ancienne.blocs.map((bloc) =>
        bloc.id === blocActif ? { ...bloc, [cle]: valeur } : bloc,
      ),
    }));
  }

  function enregistrer() {
    if (!modeleId) return;

    window.localStorage.setItem(
      cleStockage(modeleId),
      JSON.stringify(configuration),
    );
    setMessage("La mise en page a été enregistrée dans ce navigateur.");
    window.setTimeout(() => setMessage(""), 3200);
  }

  function reinitialiser() {
    if (!modeleId) return;

    window.localStorage.removeItem(cleStockage(modeleId));
    setConfiguration({
      ...configurationInitiale,
      couleurPrincipale:
        modele?.couleurPrincipale || configurationInitiale.couleurPrincipale,
    });
    setMessage("Le modèle visuel a été réinitialisé.");
    window.setTimeout(() => setMessage(""), 3200);
  }

  function dupliquerBloc() {
    if (!blocSelectionne) return;

    const copie: Bloc = {
      ...blocSelectionne,
      id: `${blocSelectionne.id}-${Date.now()}`,
      contenu: `${blocSelectionne.contenu} (copie)`,
    };

    setConfiguration((ancienne) => ({
      ...ancienne,
      blocs: [...ancienne.blocs, copie],
    }));
    setBlocActif(copie.id);
  }

  function imprimer() {
    window.print();
  }

  return (
    <div className={styles.designer}>
      <section className={styles.barreSuperieure}>
        <div>
          <span className={styles.eyebrow}>Studio de conception</span>
          <h2>Designer vos documents académiques</h2>
        </div>

        <div className={styles.actionsPrincipales}>
          <button type="button" onClick={reinitialiser}>
            <RefreshCcw size={17} />
            Réinitialiser
          </button>
          <button type="button" onClick={enregistrer}>
            <Save size={17} />
            Enregistrer
          </button>
          <button type="button" onClick={imprimer} className={styles.primaire}>
            <Printer size={17} />
            Imprimer l’aperçu
          </button>
        </div>
      </section>

      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.selectionModele}>
        <label>
          <span>Modèle de bulletin</span>
          <select
            value={modeleId}
            onChange={(event) => setModeleId(Number(event.target.value))}
          >
            {modeles.map((element) => (
              <option key={element.id} value={element.id}>
                {element.nom}
                {element.parDefaut ? " — Par défaut" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.metaModele}>
          <span>{modele?.formatPapier ?? "A4"}</span>
          <span>{modele?.orientation ?? "PORTRAIT"}</span>
          <span>Version {modele?.version ?? 1}</span>
          <span>{modele?.actif ? "Actif" : "Inactif"}</span>
        </div>
      </section>

      <div className={styles.workspace}>
        <aside className={styles.palette}>
          <div className={styles.titrePanneau}>
            <LayoutTemplate size={19} />
            <div>
              <strong>Structure</strong>
              <small>Éléments du bulletin</small>
            </div>
          </div>

          <div className={styles.listeBlocs}>
            {configuration.blocs.map((bloc) => (
              <button
                key={bloc.id}
                type="button"
                className={bloc.id === blocActif ? styles.blocActif : ""}
                onClick={() => setBlocActif(bloc.id)}
              >
                {bloc.type === "titre" && <Type size={17} />}
                {bloc.type === "texte" && <AlignLeft size={17} />}
                {bloc.type === "image" && <ImageIcon size={17} />}
                {bloc.type === "tableau" && <Grid3X3 size={17} />}
                {bloc.type === "separateur" && <FileDown size={17} />}
                <span>{bloc.contenu.slice(0, 28)}</span>
                <i>{bloc.visible ? "Visible" : "Masqué"}</i>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.boutonDupliquer}
            onClick={dupliquerBloc}
            disabled={!blocSelectionne}
          >
            <Copy size={17} />
            Dupliquer le bloc
          </button>
        </aside>

        <section className={styles.canvasZone}>
          <div className={styles.canvasToolbar}>
            <span>
              <Eye size={17} />
              Aperçu en temps réel
            </span>
            <span>{modele?.nom ?? "Bulletin"}</span>
          </div>

          <div className={styles.canvasScroll}>
            <div
              ref={zoneImpression}
              className={styles.document}
              style={
                {
                  "--couleur-principale": configuration.couleurPrincipale,
                  "--couleur-secondaire": configuration.couleurSecondaire,
                  "--marges-document": `${configuration.marges}px`,
                  fontFamily: configuration.police,
                } as React.CSSProperties
              }
            >
              <header className={styles.documentHeader}>
                {configuration.afficherLogo && (
                  <div className={styles.logoApercu}>DS</div>
                )}
                <div>
                  <small>DS SCHOOL ENTERPRISE</small>
                  <h1>BULLETIN SCOLAIRE</h1>
                  {configuration.afficherDevise && (
                    <p>Excellence · Discipline · Innovation</p>
                  )}
                </div>
                <div className={styles.annee}>
                  <small>Année scolaire</small>
                  <strong>2026–2027</strong>
                </div>
              </header>

              {configuration.blocs
                .filter((bloc) => bloc.visible)
                .map((bloc) => (
                  <section
                    key={bloc.id}
                    className={`${styles.blocApercu} ${
                      bloc.id === blocActif ? styles.blocApercuActif : ""
                    }`}
                    style={{
                      textAlign: bloc.alignement,
                      fontSize: `${bloc.taille}px`,
                      fontWeight: bloc.gras ? 800 : 400,
                    }}
                    onClick={() => setBlocActif(bloc.id)}
                  >
                    {bloc.type === "tableau" ? (
                      <>
                        <h3>{bloc.contenu}</h3>
                        <table className={styles.tableApercu}>
                          <thead>
                            <tr>
                              <th>Matière</th>
                              <th>Interrogations</th>
                              <th>Examen</th>
                              <th>Moyenne</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Mathématiques</td>
                              <td>78 %</td>
                              <td>82 %</td>
                              <td>80 %</td>
                            </tr>
                            <tr>
                              <td>Français</td>
                              <td>72 %</td>
                              <td>76 %</td>
                              <td>74 %</td>
                            </tr>
                            <tr>
                              <td>Sciences</td>
                              <td>81 %</td>
                              <td>79 %</td>
                              <td>80 %</td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <div>{bloc.contenu}</div>
                    )}
                  </section>
                ))}

              {configuration.afficherObservation && (
                <section className={styles.observation}>
                  <strong>Observation de la direction</strong>
                  <p>
                    Travail satisfaisant. L’apprenant est encouragé à poursuivre ses
                    efforts.
                  </p>
                </section>
              )}

              {configuration.afficherSignatures && (
                <section className={styles.signatures}>
                  <div>
                    <span>Le titulaire</span>
                  </div>
                  <div>
                    <span>Le parent</span>
                  </div>
                  <div>
                    <span>La direction</span>
                  </div>
                </section>
              )}

              <footer className={styles.documentFooter}>
                Document généré par DS School Enterprise
              </footer>
            </div>
          </div>
        </section>

        <aside className={styles.proprietes}>
          <div className={styles.titrePanneau}>
            <Settings2 size={19} />
            <div>
              <strong>Propriétés</strong>
              <small>Style et contenu</small>
            </div>
          </div>

          <div className={styles.groupe}>
            <h3>
              <Palette size={16} />
              Identité visuelle
            </h3>

            <label>
              <span>Couleur principale</span>
              <input
                type="color"
                value={configuration.couleurPrincipale}
                onChange={(event) =>
                  modifierConfiguration(
                    "couleurPrincipale",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Couleur secondaire</span>
              <input
                type="color"
                value={configuration.couleurSecondaire}
                onChange={(event) =>
                  modifierConfiguration(
                    "couleurSecondaire",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Police</span>
              <select
                value={configuration.police}
                onChange={(event) =>
                  modifierConfiguration("police", event.target.value)
                }
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </label>

            <label>
              <span>Marges ({configuration.marges}px)</span>
              <input
                type="range"
                min="12"
                max="48"
                value={configuration.marges}
                onChange={(event) =>
                  modifierConfiguration("marges", Number(event.target.value))
                }
              />
            </label>
          </div>

          {blocSelectionne && (
            <div className={styles.groupe}>
              <h3>
                <Type size={16} />
                Bloc sélectionné
              </h3>

              <label>
                <span>Contenu</span>
                <textarea
                  rows={5}
                  value={blocSelectionne.contenu}
                  onChange={(event) =>
                    modifierBloc("contenu", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Taille ({blocSelectionne.taille}px)</span>
                <input
                  type="range"
                  min="9"
                  max="34"
                  value={blocSelectionne.taille}
                  onChange={(event) =>
                    modifierBloc("taille", Number(event.target.value))
                  }
                />
              </label>

              <div className={styles.alignements}>
                <button
                  type="button"
                  className={
                    blocSelectionne.alignement === "left"
                      ? styles.actif
                      : ""
                  }
                  onClick={() => modifierBloc("alignement", "left")}
                >
                  <AlignLeft size={17} />
                </button>
                <button
                  type="button"
                  className={
                    blocSelectionne.alignement === "center"
                      ? styles.actif
                      : ""
                  }
                  onClick={() => modifierBloc("alignement", "center")}
                >
                  <AlignCenter size={17} />
                </button>
                <button
                  type="button"
                  className={
                    blocSelectionne.alignement === "right"
                      ? styles.actif
                      : ""
                  }
                  onClick={() => modifierBloc("alignement", "right")}
                >
                  <AlignRight size={17} />
                </button>
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={blocSelectionne.gras}
                  onChange={(event) =>
                    modifierBloc("gras", event.target.checked)
                  }
                />
                <span>Texte en gras</span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={blocSelectionne.visible}
                  onChange={(event) =>
                    modifierBloc("visible", event.target.checked)
                  }
                />
                <span>Afficher ce bloc</span>
              </label>
            </div>
          )}

          <div className={styles.groupe}>
            <h3>Options du document</h3>

            {[
              ["afficherLogo", "Afficher le logo"],
              ["afficherDevise", "Afficher la devise"],
              ["afficherObservation", "Afficher l’observation"],
              ["afficherSignatures", "Afficher les signatures"],
            ].map(([cle, libelle]) => (
              <label className={styles.checkbox} key={cle}>
                <input
                  type="checkbox"
                  checked={Boolean(
                    configuration[cle as keyof Configuration],
                  )}
                  onChange={(event) =>
                    modifierConfiguration(
                      cle as keyof Configuration,
                      event.target.checked,
                    )
                  }
                />
                <span>{libelle}</span>
              </label>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
