"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  CheckCircle2,
  CloudOff,
  RefreshCw,
  ScanLine,
  Wifi,
  XCircle,
} from "lucide-react";

import styles from "./scanner-mobile.module.css";

type Direction = "AUTO" | "ENTREE" | "SORTIE";

type ResultatScan = {
  ok: boolean;
  resultat?: string;
  message: string;
  direction?: string;
  personne?: {
    nom?: string | null;
    type?: string | null;
    classeOuFonction?: string | null;
    photo?: string | null;
  };
  dateHeure?: string;
  horsLigne?: boolean;
};

type ScanEnAttente = {
  id: string;
  uid: string;
  direction: Direction;
  createdAt: string;
};

type CodeBarreDetecte = {
  rawValue?: string;
};

type DetecteurCodeBarre = {
  detect(
    source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement,
  ): Promise<CodeBarreDetecte[]>;
};

type ConstructeurDetecteurCodeBarre = new (
  options?: {
    formats?: string[];
  },
) => DetecteurCodeBarre;

type GlobalAvecBarcodeDetector = typeof globalThis & {
  BarcodeDetector?: ConstructeurDetecteurCodeBarre;
};

const CLE_FILE = "ds_school_scans_en_attente_v1";

function obtenirConstructeurBarcodeDetector():
  | ConstructeurDetecteurCodeBarre
  | undefined {
  return (globalThis as GlobalAvecBarcodeDetector).BarcodeDetector;
}

function lireFile(): ScanEnAttente[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const contenu = localStorage.getItem(CLE_FILE);

    if (!contenu) {
      return [];
    }

    const donnees: unknown = JSON.parse(contenu);

    return Array.isArray(donnees)
      ? (donnees as ScanEnAttente[])
      : [];
  } catch {
    return [];
  }
}

function sauverFile(file: ScanEnAttente[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CLE_FILE, JSON.stringify(file));
}

function creerIdentifiantScan(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export default function ScannerMobileClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fluxRef = useRef<MediaStream | null>(null);
  const boucleRef = useRef<number | null>(null);
  const verrouRef = useRef(false);

  const [uid, setUid] = useState("");
  const [direction, setDirection] =
    useState<Direction>("AUTO");
  const [cameraActive, setCameraActive] =
    useState(false);
  const [chargement, setChargement] =
    useState(false);
  const [enLigne, setEnLigne] = useState(true);
  const [attente, setAttente] = useState(0);

  const [resultat, setResultat] =
    useState<ResultatScan | null>(null);

  const [messageCamera, setMessageCamera] =
    useState("");

  const actualiserAttente = useCallback(() => {
    setAttente(lireFile().length);
  }, []);

  const ajouterDansFile = useCallback(
    (
      code: string,
      sens: Direction,
      message: string,
    ) => {
      const file = lireFile();

      file.push({
        id: creerIdentifiantScan(),
        uid: code,
        direction: sens,
        createdAt: new Date().toISOString(),
      });

      sauverFile(file);
      actualiserAttente();

      setResultat({
        ok: true,
        message,
        horsLigne: true,
      });
    },
    [actualiserAttente],
  );

  const envoyer = useCallback(
    async (
      code: string,
      sens: Direction,
      depuisFile = false,
    ): Promise<boolean> => {
      const codeNettoye = code.trim();

      if (!codeNettoye) {
        return false;
      }

      if (!navigator.onLine) {
        if (!depuisFile) {
          ajouterDansFile(
            codeNettoye,
            sens,
            "Scan enregistré hors connexion. La synchronisation se fera automatiquement au retour d’Internet.",
          );
        }

        return false;
      }

      setChargement(true);

      try {
        const reponse = await fetch(
          "/api/mobile/scanner",
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              uid: codeNettoye,
              direction: sens,
            }),
          },
        );

        let donnees: ResultatScan;

        try {
          donnees =
            (await reponse.json()) as ResultatScan;
        } catch {
          donnees = {
            ok: false,
            message:
              "Le serveur a renvoyé une réponse invalide.",
          };
        }

        setResultat(donnees);

        if (reponse.ok && donnees.ok) {
          if (
            typeof navigator.vibrate === "function"
          ) {
            navigator.vibrate(100);
          }

          setUid("");
          return true;
        }

        return false;
      } catch (erreur) {
        console.error(
          "Erreur d’envoi du scan :",
          erreur,
        );

        if (!depuisFile) {
          ajouterDansFile(
            codeNettoye,
            sens,
            "Réseau indisponible : le scan a été placé dans la file de synchronisation.",
          );
        }

        return false;
      } finally {
        setChargement(false);
      }
    },
    [ajouterDansFile],
  );

  const synchroniser = useCallback(async () => {
    if (
      !navigator.onLine ||
      verrouRef.current
    ) {
      return;
    }

    const file = lireFile();

    if (!file.length) {
      actualiserAttente();
      return;
    }

    verrouRef.current = true;

    try {
      const restants: ScanEnAttente[] = [];

      for (const element of file) {
        const synchronise = await envoyer(
          element.uid,
          element.direction,
          true,
        );

        if (!synchronise) {
          restants.push(element);
        }
      }

      sauverFile(restants);
      actualiserAttente();
    } finally {
      verrouRef.current = false;
    }
  }, [actualiserAttente, envoyer]);

  const arreterCamera = useCallback(() => {
    if (boucleRef.current !== null) {
      cancelAnimationFrame(boucleRef.current);
    }

    boucleRef.current = null;

    fluxRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    fluxRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }, []);

  const demarrerCamera = useCallback(async () => {
    setMessageCamera("");
    setResultat(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessageCamera(
        "La caméra n’est pas disponible dans ce navigateur.",
      );
      return;
    }

    const BarcodeDetector =
      obtenirConstructeurBarcodeDetector();

    if (!BarcodeDetector) {
      setMessageCamera(
        "Le scan automatique QR n’est pas pris en charge par ce navigateur. Utilisez Chrome sur Android ou la saisie manuelle.",
      );
      return;
    }

    try {
      arreterCamera();

      const flux =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      fluxRef.current = flux;

      const video = videoRef.current;

      if (!video) {
        flux
          .getTracks()
          .forEach((track) => track.stop());

        setMessageCamera(
          "Le lecteur vidéo n’est pas disponible.",
        );

        return;
      }

      video.srcObject = flux;
      await video.play();

      setCameraActive(true);

      const detecteur = new BarcodeDetector({
        formats: ["qr_code"],
      });

      let dernierScan = "";
      let derniereDate = 0;
      let analyseEnCours = false;

      const analyser = async (): Promise<void> => {
        const videoActuelle = videoRef.current;

        if (
          !videoActuelle ||
          !fluxRef.current
        ) {
          return;
        }

        if (
          videoActuelle.readyState < 2 ||
          analyseEnCours
        ) {
          boucleRef.current =
            requestAnimationFrame(analyser);
          return;
        }

        analyseEnCours = true;

        try {
          const codes =
            await detecteur.detect(
              videoActuelle,
            );

          const valeur =
            codes[0]?.rawValue?.trim();

          const maintenant = Date.now();

          const nouveauScan =
            valeur &&
            (valeur !== dernierScan ||
              maintenant - derniereDate > 3000);

          if (nouveauScan) {
            dernierScan = valeur;
            derniereDate = maintenant;

            setUid(valeur);

            await envoyer(
              valeur,
              direction,
            );
          }
        } catch (erreur) {
          console.debug(
            "Analyse QR temporairement impossible :",
            erreur,
          );
        } finally {
          analyseEnCours = false;
        }

        if (fluxRef.current) {
          boucleRef.current =
            requestAnimationFrame(analyser);
        }
      };

      boucleRef.current =
        requestAnimationFrame(analyser);
    } catch (erreur) {
      console.error(
        "Erreur d’accès à la caméra :",
        erreur,
      );

      setMessageCamera(
        "Autorisez l’accès à la caméra, puis réessayez.",
      );

      arreterCamera();
    }
  }, [
    arreterCamera,
    direction,
    envoyer,
  ]);

  useEffect(() => {
    setEnLigne(navigator.onLine);
    actualiserAttente();

    const gererConnexion = () => {
      setEnLigne(true);
      void synchroniser();
    };

    const gererDeconnexion = () => {
      setEnLigne(false);
    };

    window.addEventListener(
      "online",
      gererConnexion,
    );

    window.addEventListener(
      "offline",
      gererDeconnexion,
    );

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw-ds-scanner.js")
        .catch((erreur) => {
          console.warn(
            "Service Worker non enregistré :",
            erreur,
          );
        });
    }

    void synchroniser();

    return () => {
      window.removeEventListener(
        "online",
        gererConnexion,
      );

      window.removeEventListener(
        "offline",
        gererDeconnexion,
      );

      arreterCamera();
    };
  }, [
    actualiserAttente,
    arreterCamera,
    synchroniser,
  ]);

  function soumettre(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();
    void envoyer(uid, direction);
  }

  return (
    <section className={styles.grille}>
      <article className={styles.scanner}>
        <div className={styles.etat}>
          <span
            className={
              enLigne
                ? styles.online
                : styles.offline
            }
          >
            {enLigne ? (
              <Wifi size={16} />
            ) : (
              <CloudOff size={16} />
            )}

            {enLigne
              ? "En ligne"
              : "Hors connexion"}
          </span>

          <button
            type="button"
            onClick={() =>
              void synchroniser()
            }
            disabled={
              attente === 0 || chargement
            }
          >
            <RefreshCw size={16} />
            {attente} en attente
          </button>
        </div>

        <div className={styles.videoWrap}>
          <video
            ref={videoRef}
            playsInline
            muted
            className={styles.video}
          />

          {!cameraActive && (
            <div
              className={
                styles.placeholder
              }
            >
              <ScanLine size={58} />

              <strong>
                Caméra arrêtée
              </strong>

              <span>
                Appuyez sur « Ouvrir la
                caméra ».
              </span>
            </div>
          )}

          {cameraActive && (
            <div className={styles.cadre}>
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        <div
          className={
            styles.actionsCamera
          }
        >
          {!cameraActive ? (
            <button
              type="button"
              className={styles.primaire}
              onClick={() =>
                void demarrerCamera()
              }
            >
              <Camera size={19} />
              Ouvrir la caméra
            </button>
          ) : (
            <button
              type="button"
              className={styles.secondaire}
              onClick={arreterCamera}
            >
              Arrêter la caméra
            </button>
          )}
        </div>

        {messageCamera && (
          <p
            className={
              styles.avertissement
            }
          >
            {messageCamera}
          </p>
        )}

        <form
          onSubmit={soumettre}
          className={styles.formulaire}
        >
          <label>
            Direction du passage
          </label>

          <div
            className={styles.directions}
          >
            {(
              [
                "AUTO",
                "ENTREE",
                "SORTIE",
              ] as Direction[]
            ).map((sens) => (
              <button
                type="button"
                key={sens}
                className={
                  direction === sens
                    ? styles.actif
                    : ""
                }
                onClick={() =>
                  setDirection(sens)
                }
              >
                {sens}
              </button>
            ))}
          </div>

          <label htmlFor="uid">
            Code QR / UID manuel
          </label>

          <div className={styles.saisie}>
            <input
              id="uid"
              value={uid}
              onChange={(event) =>
                setUid(
                  event.target.value,
                )
              }
              placeholder="Scannez ou saisissez le code"
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={
                !uid.trim() ||
                chargement
              }
            >
              {chargement
                ? "Envoi..."
                : "Valider"}
            </button>
          </div>
        </form>
      </article>

      <aside className={styles.resultat}>
        {!resultat ? (
          <div className={styles.vide}>
            <ScanLine size={42} />

            <strong>
              En attente d’un scan
            </strong>

            <span>
              Le résultat apparaîtra ici.
            </span>
          </div>
        ) : (
          <div
            className={
              resultat.ok
                ? styles.succes
                : styles.echec
            }
          >
            {resultat.ok ? (
              <CheckCircle2 size={48} />
            ) : (
              <XCircle size={48} />
            )}

            <strong>
              {resultat.message}
            </strong>

            {resultat.direction && (
              <span
                className={styles.pill}
              >
                {resultat.direction}
              </span>
            )}

            {resultat.personne?.nom && (
              <div
                className={
                  styles.personne
                }
              >
                {resultat.personne
                  .photo ? (
                  <img
                    src={
                      resultat.personne
                        .photo
                    }
                    alt={
                      resultat.personne
                        .nom
                    }
                  />
                ) : (
                  <div
                    className={
                      styles.avatar
                    }
                  >
                    {resultat.personne.nom
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <b>
                    {
                      resultat.personne
                        .nom
                    }
                  </b>

                  <span>
                    {resultat.personne
                      .classeOuFonction ||
                      resultat.personne
                        .type ||
                      ""}
                  </span>
                </div>
              </div>
            )}

            {resultat.horsLigne && (
              <small>
                Le scan sera envoyé
                automatiquement plus tard.
              </small>
            )}
          </div>
        )}
      </aside>
    </section>
  );
}