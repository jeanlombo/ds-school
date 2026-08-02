"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";
import styles from "./admin.module.css";

type Props = {
  texte?: string;
  icone?: ReactNode;
};

export default function BoutonSoumission({
  texte = "Enregistrer",
  icone,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.boutonPrimaire}
      disabled={pending}
    >
      {pending ? (
        <>
          <LoaderCircle
            size={18}
            className={styles.rotation}
          />
          Traitement...
        </>
      ) : (
        <>
          {icone ?? <Save size={18} />}
          {texte}
        </>
      )}
    </button>
  );
}