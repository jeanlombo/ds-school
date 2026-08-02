"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import styles from "./eleves.module.css";

type Props = {
  photoActuelle?: string | null;
  nomEleve?: string;
};

const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];
const TAILLE_MAX_SOURCE = 12 * 1024 * 1024;

async function compresserEtRecadrer(source: File): Promise<File> {
  const image = await createImageBitmap(source);
  const coteSource = Math.min(image.width, image.height);
  const sx = Math.max(0, (image.width - coteSource) / 2);
  const sy = Math.max(0, (image.height - coteSource) / 2);
  const tailleFinale = 700;
  const canvas = document.createElement("canvas");
  canvas.width = tailleFinale;
  canvas.height = tailleFinale;
  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Votre navigateur ne permet pas le traitement de l’image.");
  contexte.drawImage(image, sx, sy, coteSource, coteSource, 0, 0, tailleFinale, tailleFinale);
  image.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("La compression de la photo a échoué.");
  const nomSansExtension = source.name.replace(/\.[^.]+$/, "") || "photo-eleve";
  return new File([blob], `${nomSansExtension}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export default function PhotoEleveUpload({ photoActuelle, nomEleve = "Élève" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState(photoActuelle || "");
  const [message, setMessage] = useState("");
  const [traitement, setTraitement] = useState(false);
  const [supprimer, setSupprimer] = useState(false);
  const urlLocaleRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (urlLocaleRef.current) URL.revokeObjectURL(urlLocaleRef.current);
  }, []);

  async function appliquerFichier(fichier?: File) {
    if (!fichier) return;
    setMessage("");
    if (!TYPES_ACCEPTES.includes(fichier.type)) {
      setMessage("Format refusé. Utilisez JPG, PNG ou WEBP.");
      return;
    }
    if (fichier.size > TAILLE_MAX_SOURCE) {
      setMessage("La photo source ne doit pas dépasser 12 Mo.");
      return;
    }
    setTraitement(true);
    try {
      const compresse = await compresserEtRecadrer(fichier);
      const transfert = new DataTransfer();
      transfert.items.add(compresse);
      if (inputRef.current) inputRef.current.files = transfert.files;
      if (urlLocaleRef.current) URL.revokeObjectURL(urlLocaleRef.current);
      urlLocaleRef.current = URL.createObjectURL(compresse);
      setApercu(urlLocaleRef.current);
      setSupprimer(false);
      setMessage(`Photo prête • ${(compresse.size / 1024).toFixed(0)} Ko • 700 × 700 px`);
    } catch (erreur) {
      setMessage(erreur instanceof Error ? erreur.message : "Impossible de traiter cette photo.");
    } finally {
      setTraitement(false);
    }
  }

  function changer(event: ChangeEvent<HTMLInputElement>) {
    void appliquerFichier(event.target.files?.[0]);
  }

  function deposer(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void appliquerFichier(event.dataTransfer.files?.[0]);
  }

  function retirer() {
    if (inputRef.current) inputRef.current.value = "";
    if (urlLocaleRef.current) {
      URL.revokeObjectURL(urlLocaleRef.current);
      urlLocaleRef.current = null;
    }
    setApercu("");
    setSupprimer(true);
    setMessage("La photo sera retirée après l’enregistrement.");
  }

  function annuler() {
    if (inputRef.current) inputRef.current.value = "";
    if (urlLocaleRef.current) {
      URL.revokeObjectURL(urlLocaleRef.current);
      urlLocaleRef.current = null;
    }
    setApercu(photoActuelle || "");
    setSupprimer(false);
    setMessage("");
  }

  return (
    <div className={styles.photoBloc}>
      <input ref={inputRef} className={styles.photoInputCache} type="file" name="photoFichier" accept="image/jpeg,image/png,image/webp" onChange={changer} />
      <input type="hidden" name="supprimerPhoto" value={supprimer ? "1" : "0"} />

      <div className={styles.photoApercu} aria-label={`Photo de ${nomEleve}`}>
        {apercu ? <img src={apercu} alt={`Photo de ${nomEleve}`} /> : <Camera size={46} />}
      </div>

      <div className={styles.photoZone} onDragOver={(event) => event.preventDefault()} onDrop={deposer} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}>
        <UploadCloud size={28} />
        <strong>{traitement ? "Traitement de la photo…" : "Déposez la photo ici"}</strong>
        <span>ou cliquez pour sélectionner depuis l’ordinateur ou le téléphone</span>
        <small>JPG, PNG ou WEBP • source maximale 12 Mo</small>
      </div>

      <div className={styles.photoActions}>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={traitement}><ImagePlus size={16} /> Choisir</button>
        {(apercu || photoActuelle) && <button type="button" onClick={retirer} className={styles.photoBoutonDanger}><Trash2 size={16} /> Retirer</button>}
        {(supprimer || (apercu && apercu !== photoActuelle)) && <button type="button" onClick={annuler}><RotateCcw size={16} /> Annuler</button>}
      </div>

      <p className={styles.photoAide}>{message || "La photo est automatiquement centrée, recadrée au format carré et compressée avant l’enregistrement."}</p>
    </div>
  );
}
