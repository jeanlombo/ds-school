"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "@/app/mobile/scanner/scanner.module.css";

type Lecteur = { id: number; nom: string; emplacement: string };
type Resultat = {
  ok: boolean;
  resultat: string;
  message: string;
  direction?: string;
  personne?: {
    nom: string;
    type: string;
    classeOuFonction?: string | null;
    photo?: string | null;
  };
  dateHeure?: string;
  horsLigne?: boolean;
};

type ScanEnAttente = {
  id: string;
  uid: string;
  lecteurId: number | null;
  direction: string;
  creeLe: string;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
    };
    NDEFReader?: new () => {
      scan(): Promise<void>;
      onreading: ((event: any) => void) | null;
      onreadingerror: (() => void) | null;
    };
  }
}

const DB_NAME = "ds-school-scanner";
const STORE_NAME = "scans-attente";

function ouvrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(DB_NAME, 1);
    requete.onupgradeneeded = () => {
      const db = requete.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

async function ajouterAttente(scan: ScanEnAttente) {
  const db = await ouvrirDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(scan);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function lireAttentes(): Promise<ScanEnAttente[]> {
  const db = await ouvrirDb();
  const lignes = await new Promise<ScanEnAttente[]>((resolve, reject) => {
    const requete = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    requete.onsuccess = () => resolve(requete.result as ScanEnAttente[]);
    requete.onerror = () => reject(requete.error);
  });
  db.close();
  return lignes;
}

async function supprimerAttente(id: string) {
  const db = await ouvrirDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

function idLocal() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

export default function ScannerPwaClient({ lecteurs }: { lecteurs: Lecteur[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fluxRef = useRef<MediaStream | null>(null);
  const boucleRef = useRef<number | null>(null);
  const verrouRef = useRef(false);

  const [uid, setUid] = useState("");
  const [lecteurId, setLecteurId] = useState(lecteurs[0] ? String(lecteurs[0].id) : "");
  const [direction, setDirection] = useState("AUTO");
  const [cameraActive, setCameraActive] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [enAttente, setEnAttente] = useState(0);
  const [enLigne, setEnLigne] = useState(true);
  const [installation, setInstallation] = useState<any>(null);
  const [messageCamera, setMessageCamera] = useState("");

  const actualiserCompteur = useCallback(async () => {
    try {
      setEnAttente((await lireAttentes()).length);
    } catch {
      setEnAttente(0);
    }
  }, []);

  const envoyerServeur = useCallback(async (scan: Omit<ScanEnAttente, "id" | "creeLe">) => {
    const reponse = await fetch("/api/mobile/scanner", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scan),
    });

    const donnees = await reponse.json();
    if (!reponse.ok && reponse.status >= 500) throw new Error(donnees.message || "Serveur indisponible");
    return donnees as Resultat;
  }, []);

  const synchroniser = useCallback(async () => {
    if (!navigator.onLine) return;
    const attentes = await lireAttentes();

    for (const scan of attentes) {
      try {
        await envoyerServeur(scan);
        await supprimerAttente(scan.id);
      } catch {
        break;
      }
    }

    await actualiserCompteur();
  }, [actualiserCompteur, envoyerServeur]);

  const traiterCode = useCallback(async (valeur: string) => {
    const code = valeur.trim();
    if (!code || verrouRef.current) return;

    verrouRef.current = true;
    setChargement(true);
    setUid(code);

    const scan = {
      uid: code,
      lecteurId: lecteurId ? Number(lecteurId) : null,
      direction,
    };

    try {
      if (!navigator.onLine) throw new Error("HORS_LIGNE");
      const donnees = await envoyerServeur(scan);
      setResultat(donnees);
      if (navigator.vibrate) navigator.vibrate(donnees.ok ? [80, 40, 80] : [250]);
    } catch {
      await ajouterAttente({ ...scan, id: idLocal(), creeLe: new Date().toISOString() });
      await actualiserCompteur();
      setResultat({
        ok: true,
        resultat: "EN_ATTENTE",
        message: "Scan enregistré hors connexion. Synchronisation automatique prévue.",
        horsLigne: true,
      });
      if (navigator.vibrate) navigator.vibrate([120]);
    } finally {
      setChargement(false);
      setTimeout(() => {
        verrouRef.current = false;
        setUid("");
      }, 1200);
    }
  }, [actualiserCompteur, direction, envoyerServeur, lecteurId]);

  const arreterCamera = useCallback(() => {
    if (boucleRef.current) cancelAnimationFrame(boucleRef.current);
    boucleRef.current = null;
    fluxRef.current?.getTracks().forEach((piste) => piste.stop());
    fluxRef.current = null;
    setCameraActive(false);
  }, []);

  const demarrerCamera = useCallback(async () => {
    setMessageCamera("");

    if (!window.BarcodeDetector) {
      setMessageCamera("Le scan caméra n’est pas disponible sur ce navigateur. Utilisez Chrome récent, NFC ou la saisie manuelle.");
      return;
    }

    try {
      const flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      fluxRef.current = flux;
      if (videoRef.current) {
        videoRef.current.srcObject = flux;
        await videoRef.current.play();
      }
      setCameraActive(true);

      const detecteur = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "code_39"] });

      const boucle = async () => {
        if (!videoRef.current || !fluxRef.current) return;
        try {
          const codes = await detecteur.detect(videoRef.current);
          if (codes[0]?.rawValue) await traiterCode(codes[0].rawValue);
        } catch {
          // Une image sans code est normale.
        }
        boucleRef.current = requestAnimationFrame(boucle);
      };

      boucleRef.current = requestAnimationFrame(boucle);
    } catch {
      setMessageCamera("Autorisez la caméra dans les paramètres du navigateur.");
      arreterCamera();
    }
  }, [arreterCamera, traiterCode]);

  async function lireNfc() {
    if (!window.NDEFReader) {
      setMessageCamera("NFC Web non disponible sur cet appareil. Utilisez le QR Code ou un lecteur USB HID.");
      return;
    }

    try {
      const lecteur = new window.NDEFReader();
      await lecteur.scan();
      setMessageCamera("Approchez maintenant la carte NFC du téléphone.");
      lecteur.onreading = async (event: any) => {
        const numero = event.serialNumber || "";
        let contenu = numero;
        for (const enregistrement of event.message?.records || []) {
          try {
            contenu = new TextDecoder(enregistrement.encoding || "utf-8").decode(enregistrement.data) || contenu;
          } catch {
            // Conserve le numéro de série.
          }
        }
        await traiterCode(contenu);
      };
      lecteur.onreadingerror = () => setMessageCamera("Carte NFC illisible. Réessayez.");
    } catch {
      setMessageCamera("La lecture NFC a été refusée ou interrompue.");
    }
  }

  useEffect(() => {
    setEnLigne(navigator.onLine);
    actualiserCompteur();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw-ds-school.js").catch(() => undefined);

    const retourEnLigne = () => {
      setEnLigne(true);
      synchroniser();
    };
    const passageHorsLigne = () => setEnLigne(false);
    const avantInstallation = (event: Event) => {
      event.preventDefault();
      setInstallation(event);
    };

    window.addEventListener("online", retourEnLigne);
    window.addEventListener("offline", passageHorsLigne);
    window.addEventListener("beforeinstallprompt", avantInstallation);

    return () => {
      arreterCamera();
      window.removeEventListener("online", retourEnLigne);
      window.removeEventListener("offline", passageHorsLigne);
      window.removeEventListener("beforeinstallprompt", avantInstallation);
    };
  }, [actualiserCompteur, arreterCamera, synchroniser]);

  async function installerPwa() {
    if (!installation) return;
    await installation.prompt();
    setInstallation(null);
  }

  return (
    <section className={styles.shell}>
      <div className={styles.statutBarre}>
        <span className={enLigne ? styles.enLigne : styles.horsLigne}>{enLigne ? "● En ligne" : "● Hors connexion"}</span>
        <span>{enAttente} scan(s) à synchroniser</span>
        {enAttente > 0 && enLigne && <button onClick={synchroniser}>Synchroniser</button>}
        {installation && <button onClick={installerPwa}>Installer la PWA</button>}
      </div>

      <div className={styles.grille}>
        <article className={styles.scanner}>
          <div className={styles.videoZone}>
            <video ref={videoRef} muted playsInline className={styles.video} />
            {!cameraActive && <div className={styles.videoVide}>📷<strong>Caméra arrêtée</strong><span>Ouvrez le scanner pour lire une carte élève.</span></div>}
            {cameraActive && <div className={styles.cadreScan} />}
          </div>

          <div className={styles.actionsCamera}>
            {!cameraActive ? <button onClick={demarrerCamera}>Ouvrir la caméra</button> : <button onClick={arreterCamera}>Arrêter la caméra</button>}
            <button onClick={lireNfc}>Lire NFC</button>
          </div>

          {messageCamera && <p className={styles.info}>{messageCamera}</p>}

          <div className={styles.parametres}>
            <label>Point de contrôle
              <select value={lecteurId} onChange={(e) => setLecteurId(e.target.value)}>
                <option value="">Poste mobile</option>
                {lecteurs.map((lecteur) => <option key={lecteur.id} value={lecteur.id}>{lecteur.nom} — {lecteur.emplacement}</option>)}
              </select>
            </label>
            <label>Direction
              <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="AUTO">Automatique</option>
                <option value="ENTREE">Entrée</option>
                <option value="SORTIE">Sortie</option>
              </select>
            </label>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); traiterCode(uid); }} className={styles.saisie}>
            <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="UID, matricule ou contenu QR" autoComplete="off" />
            <button type="submit" disabled={chargement || !uid.trim()}>{chargement ? "Envoi..." : "Valider"}</button>
          </form>
        </article>

        <article className={`${styles.resultat} ${resultat?.ok ? styles.succes : resultat ? styles.refus : ""}`}>
          {!resultat ? <><div className={styles.icone}>🛡️</div><h2>Système prêt</h2><p>Scannez une carte, un QR Code ou un tag NFC.</p></> : <>
            <div className={styles.icone}>{resultat.horsLigne ? "📥" : resultat.ok ? "✅" : "⛔"}</div>
            <h2>{resultat.message}</h2>
            {resultat.personne && <div className={styles.personne}>
              <div className={styles.avatar}>{resultat.personne.photo ? <img src={resultat.personne.photo} alt="" /> : resultat.personne.nom.slice(0,1)}</div>
              <strong>{resultat.personne.nom}</strong>
              <span>{resultat.personne.type}</span>
              <span>{resultat.personne.classeOuFonction || "—"}</span>
              {resultat.direction && <b>{resultat.direction}</b>}
            </div>}
            {resultat.dateHeure && <small>{new Date(resultat.dateHeure).toLocaleString("fr-FR")}</small>}
          </>}
        </article>
      </div>
    </section>
  );
}
