"use client";

import {
  ImageIcon,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./parametres.module.css";

type Props = {
  logoActuel: string | null;
  nomEcole: string;
};

const TYPES_AUTORISES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function LogoEcoleUpload({
  logoActuel,
  nomEcole,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState<string | null>(
    logoActuel
  );
  const [erreur, setErreur] = useState<string | null>(
    null
  );
  const [supprimer, setSupprimer] = useState(false);

  useEffect(() => {
    return () => {
      if (apercu?.startsWith("blob:")) {
        URL.revokeObjectURL(apercu);
      }
    };
  }, [apercu]);

  function choisirFichier() {
    inputRef.current?.click();
  }

  function changerFichier(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    if (!TYPES_AUTORISES.includes(fichier.type)) {
      setErreur(
        "Choisissez une image JPG, PNG ou WEBP."
      );
      event.target.value = "";
      return;
    }

    if (fichier.size > 5 * 1024 * 1024) {
      setErreur("Le fichier ne doit pas dépasser 5 Mo.");
      event.target.value = "";
      return;
    }

    if (apercu?.startsWith("blob:")) {
      URL.revokeObjectURL(apercu);
    }

    setApercu(URL.createObjectURL(fichier));
    setSupprimer(false);
    setErreur(null);
  }

  function retirerLogo() {
    if (apercu?.startsWith("blob:")) {
      URL.revokeObjectURL(apercu);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setApercu(null);
    setSupprimer(true);
    setErreur(null);
  }

  return (
    <section className={styles.uploadBloc}>
      <div className={styles.uploadEntete}>
        <div>
          <span>Logo de l’établissement</span>
          <p>
            PNG, JPG ou WEBP — taille maximale : 5 Mo
          </p>
        </div>

        <UploadCloud size={24} />
      </div>

      <div className={styles.uploadZone}>
        <div className={styles.uploadApercu}>
          {apercu ? (
            <img
              src={apercu}
              alt={`Logo de ${nomEcole}`}
            />
          ) : (
            <ImageIcon size={44} />
          )}
        </div>

        <div className={styles.uploadContenu}>
          <strong>
            {apercu
              ? "Logo prêt à être enregistré"
              : "Aucun logo sélectionné"}
          </strong>

          <p>
            Cliquez sur le bouton pour choisir une image
            depuis votre ordinateur ou votre téléphone.
          </p>

          <div className={styles.uploadActions}>
            <button
              type="button"
              onClick={choisirFichier}
              className={styles.boutonUpload}
            >
              <UploadCloud size={18} />
              {apercu
                ? "Changer le logo"
                : "Choisir le logo"}
            </button>

            {apercu && (
              <button
                type="button"
                onClick={retirerLogo}
                className={styles.boutonSupprimer}
              >
                <Trash2 size={17} />
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        className={styles.inputFichier}
        type="file"
        name="logoFichier"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={changerFichier}
      />

      <input
        type="hidden"
        name="supprimerLogo"
        value={supprimer ? "1" : "0"}
      />

      {erreur && (
        <div className={styles.erreurLocale}>
          {erreur}
        </div>
      )}
    </section>
  );
}
