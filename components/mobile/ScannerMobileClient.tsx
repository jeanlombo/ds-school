"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, CloudOff, RefreshCw, ScanLine, Wifi, XCircle } from "lucide-react";
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

type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

const CLE_FILE = "ds_school_scans_en_attente_v1";

function lireFile(): ScanEnAttente[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLE_FILE) || "[]") as ScanEnAttente[];
  } catch {
    return [];
  }
}

function sauverFile(file: ScanEnAttente[]) {
  localStorage.setItem(CLE_FILE, JSON.stringify(file));
}

export default function ScannerMobileClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fluxRef = useRef<MediaStream | null>(null);
  const boucleRef = useRef<number | null>(null);
  const verrouRef = useRef(false);
  const [uid, setUid] = useState("");
  const [direction, setDirection] = useState<Direction>("AUTO");
  const [cameraActive, setCameraActive] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [enLigne, setEnLigne] = useState(true);
  const [attente, setAttente] = useState(0);
  const [resultat, setResultat] = useState<ResultatScan | null>(null);
  const [messageCamera, setMessageCamera] = useState("");

  const actualiserAttente = useCallback(() => setAttente(lireFile().length), []);

  const envoyer = useCallback(async (code: string, sens: Direction, depuisFile = false) => {
    const codeNettoye = code.trim();
    if (!codeNettoye) return false;

    if (!navigator.onLine) {
      if (!depuisFile) {
        const file = lireFile();
        file.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          uid: codeNettoye,
          direction: sens,
          createdAt: new Date().toISOString(),
        });
        sauverFile(file);
        actualiserAttente();
        setResultat({ ok: true, message: "Scan enregistré hors connexion. Synchronisation automatique dès le retour d’Internet.", horsLigne: true });
      }
      return false;
    }

    setChargement(true);
    try {
      const reponse = await fetch("/api/mobile/scanner", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: codeNettoye, direction: sens }),
      });
      const donnees = (await reponse.json()) as ResultatScan;
      setResultat(donnees);
      if (reponse.ok && donnees.ok) {
        if (navigator.vibrate) navigator.vibrate(100);
        setUid("");
        return true;
      }
      return false;
    } catch {
      if (!depuisFile) {
        const file = lireFile();
        file.push({ id: `${Date.now()}`, uid: codeNettoye, direction: sens, createdAt: new Date().toISOString() });
        sauverFile(file);
        actualiserAttente();
        setResultat({ ok: true, message: "Réseau indisponible : scan placé dans la file de synchronisation.", horsLigne: true });
      }
      return false;
    } finally {
      setChargement(false);
    }
  }, [actualiserAttente]);

  const synchroniser = useCallback(async () => {
    if (!navigator.onLine || verrouRef.current) return;
    const file = lireFile();
    if (!file.length) return;
    verrouRef.current = true;
    const restants: ScanEnAttente[] = [];
    for (const element of file) {
      const ok = await envoyer(element.uid, element.direction, true);
      if (!ok) restants.push(element);
    }
    sauverFile(restants);
    actualiserAttente();
    verrouRef.current = false;
  }, [actualiserAttente, envoyer]);

  const arreterCamera = useCallback(() => {
    if (boucleRef.current) cancelAnimationFrame(boucleRef.current);
    boucleRef.current = null;
    fluxRef.current?.getTracks().forEach((track) => track.stop());
    fluxRef.current = null;
    setCameraActive(false);
  }, []);

  const demarrerCamera = useCallback(async () => {
    setMessageCamera("");
    setResultat(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessageCamera("La caméra n’est pas disponible dans ce navigateur.");
      return;
    }
    if (!window.BarcodeDetector) {
      setMessageCamera("Le scan automatique QR n’est pas pris en charge ici. Utilisez Chrome Android ou la saisie manuelle.");
      return;
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      fluxRef.current = flux;
      if (!videoRef.current) return;
      videoRef.current.srcObject = flux;
      await videoRef.current.play();
      setCameraActive(true);
      const detecteur = new window.BarcodeDetector({ formats: ["qr_code"] });
      let dernierScan = "";
      let derniereDate = 0;
      const analyser = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          boucleRef.current = requestAnimationFrame(analyser);
          return;
        }
        try {
          const codes = await detecteur.detect(video);
          const valeur = codes[0]?.rawValue?.trim();
          const maintenant = Date.now();
          if (valeur && (valeur !== dernierScan || maintenant - derniereDate > 3000)) {
            dernierScan = valeur;
            derniereDate = maintenant;
            setUid(valeur);
            await envoyer(valeur, direction);
          }
        } catch {
          // La boucle continue : certains appareils échouent ponctuellement pendant l’autofocus.
        }
        boucleRef.current = requestAnimationFrame(analyser);
      };
      analyser();
    } catch {
      setMessageCamera("Autorisez l’accès à la caméra, puis réessayez.");
      arreterCamera();
    }
  }, [arreterCamera, direction, envoyer]);

  useEffect(() => {
    setEnLigne(navigator.onLine);
    actualiserAttente();
    const online = () => { setEnLigne(true); void synchroniser(); };
    const offline = () => setEnLigne(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-ds-scanner.js").catch(() => undefined);
    }
    void synchroniser();
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      arreterCamera();
    };
  }, [actualiserAttente, arreterCamera, synchroniser]);

  function soumettre(event: FormEvent) {
    event.preventDefault();
    void envoyer(uid, direction);
  }

  return (
    <section className={styles.grille}>
      <article className={styles.scanner}>
        <div className={styles.etat}>
          <span className={enLigne ? styles.online : styles.offline}>
            {enLigne ? <Wifi size={16} /> : <CloudOff size={16} />}
            {enLigne ? "En ligne" : "Hors connexion"}
          </span>
          <button type="button" onClick={() => void synchroniser()} disabled={!attente || chargement}>
            <RefreshCw size={16} /> {attente} en attente
          </button>
        </div>

        <div className={styles.videoWrap}>
          <video ref={videoRef} playsInline muted className={styles.video} />
          {!cameraActive && (
            <div className={styles.placeholder}>
              <ScanLine size={58} />
              <strong>Caméra arrêtée</strong>
              <span>Appuyez sur « Ouvrir la caméra ».</span>
            </div>
          )}
          {cameraActive && <div className={styles.cadre}><i /><i /><i /><i /></div>}
        </div>

        <div className={styles.actionsCamera}>
          {!cameraActive ? (
            <button type="button" className={styles.primaire} onClick={() => void demarrerCamera()}>
              <Camera size={19} /> Ouvrir la caméra
            </button>
          ) : (
            <button type="button" className={styles.secondaire} onClick={arreterCamera}>Arrêter la caméra</button>
          )}
        </div>
        {messageCamera && <p className={styles.avertissement}>{messageCamera}</p>}

        <form onSubmit={soumettre} className={styles.formulaire}>
          <label>Direction du passage</label>
          <div className={styles.directions}>
            {(["AUTO", "ENTREE", "SORTIE"] as Direction[]).map((sens) => (
              <button type="button" key={sens} className={direction === sens ? styles.actif : ""} onClick={() => setDirection(sens)}>{sens}</button>
            ))}
          </div>
          <label htmlFor="uid">Code QR / UID manuel</label>
          <div className={styles.saisie}>
            <input id="uid" value={uid} onChange={(event) => setUid(event.target.value)} placeholder="Scannez ou saisissez le code" autoComplete="off" />
            <button type="submit" disabled={!uid.trim() || chargement}>{chargement ? "Envoi..." : "Valider"}</button>
          </div>
        </form>
      </article>

      <aside className={styles.resultat}>
        {!resultat ? (
          <div className={styles.vide}><ScanLine size={42} /><strong>En attente d’un scan</strong><span>Le résultat apparaîtra ici.</span></div>
        ) : (
          <div className={resultat.ok ? styles.succes : styles.echec}>
            {resultat.ok ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
            <strong>{resultat.message}</strong>
            {resultat.direction && <span className={styles.pill}>{resultat.direction}</span>}
            {resultat.personne?.nom && (
              <div className={styles.personne}>
                {resultat.personne.photo ? <img src={resultat.personne.photo} alt="" /> : <div className={styles.avatar}>{resultat.personne.nom.charAt(0)}</div>}
                <div><b>{resultat.personne.nom}</b><span>{resultat.personne.classeOuFonction || resultat.personne.type}</span></div>
              </div>
            )}
            {resultat.horsLigne && <small>Le scan sera envoyé automatiquement plus tard.</small>}
          </div>
        )}
      </aside>
    </section>
  );
}
