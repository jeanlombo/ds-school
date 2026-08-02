"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import styles from "./enseignants.module.css";

type Props = { photoActuelle?: string | null; nom?: string };

async function compresser(source: File): Promise<File> {
  const image = await createImageBitmap(source);
  const cote = Math.min(image.width, image.height);
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 700;
  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Traitement de l’image impossible.");
  contexte.drawImage(image, (image.width - cote) / 2, (image.height - cote) / 2, cote, cote, 0, 0, 700, 700);
  image.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("Compression impossible.");
  return new File([blob], "photo-enseignant.jpg", { type: "image/jpeg" });
}

export default function PhotoEnseignantUpload({ photoActuelle, nom = "Enseignant" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const [apercu, setApercu] = useState(photoActuelle || "");
  const [message, setMessage] = useState("");
  const [supprimer, setSupprimer] = useState(false);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  async function appliquer(fichier?: File) {
    if (!fichier) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(fichier.type)) {
      setMessage("Utilisez une image JPG, PNG ou WEBP."); return;
    }
    if (fichier.size > 12 * 1024 * 1024) {
      setMessage("La photo source dépasse 12 Mo."); return;
    }
    try {
      const finale = await compresser(fichier);
      const dt = new DataTransfer();
      dt.items.add(finale);
      if (inputRef.current) inputRef.current.files = dt.files;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(finale);
      setApercu(urlRef.current);
      setSupprimer(false);
      setMessage(`Photo prête • ${Math.round(finale.size / 1024)} Ko`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Photo invalide.");
    }
  }

  return <div className={styles.photoBloc}>
    <input ref={inputRef} hidden type="file" name="photoFichier" accept="image/jpeg,image/png,image/webp"
      onChange={(e: ChangeEvent<HTMLInputElement>) => void appliquer(e.target.files?.[0])} />
    <input type="hidden" name="supprimerPhoto" value={supprimer ? "1" : "0"} />
    <div className={styles.photoApercu}>{apercu ? <img src={apercu} alt={`Photo de ${nom}`} /> : <Camera size={46} />}</div>
    <div className={styles.photoZone}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
      onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); void appliquer(e.dataTransfer.files?.[0]); }}
      role="button" tabIndex={0}>
      <UploadCloud size={28} /><strong>Déposez ou sélectionnez la photo</strong><span>Recadrage carré et compression automatiques</span>
    </div>
    <div className={styles.photoActions}>
      <button type="button" onClick={() => inputRef.current?.click()}><ImagePlus size={16}/> Choisir</button>
      {(apercu || photoActuelle) && <button type="button" onClick={() => { setApercu(""); setSupprimer(true); if (inputRef.current) inputRef.current.value = ""; }}><Trash2 size={16}/> Retirer</button>}
      {(supprimer || apercu !== (photoActuelle || "")) && <button type="button" onClick={() => { setApercu(photoActuelle || ""); setSupprimer(false); setMessage(""); }}><RotateCcw size={16}/> Annuler</button>}
    </div>
    <small>{message || "JPG, PNG ou WEBP — maximum 12 Mo avant compression."}</small>
  </div>;
}
