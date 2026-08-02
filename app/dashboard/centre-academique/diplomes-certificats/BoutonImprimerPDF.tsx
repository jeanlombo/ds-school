"use client";

import { FileDown, Printer } from "lucide-react";
import { useState } from "react";

export default function BoutonImprimerPDF() {
  const [preparation, setPreparation] = useState(false);

  function imprimer() {
    setPreparation(true);

    // Petit délai pour laisser les images et styles terminer leur rendu.
    window.setTimeout(() => {
      window.print();
      setPreparation(false);
    }, 250);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onClick={imprimer}
        disabled={preparation}
        title="Imprimer ou enregistrer au format PDF"
      >
        <Printer size={17} />
        {preparation ? "Préparation..." : "Imprimer"}
      </button>

      <button
        type="button"
        onClick={imprimer}
        disabled={preparation}
        title="Dans la fenêtre d’impression, choisissez Enregistrer au format PDF"
      >
        <FileDown size={17} />
        PDF A4
      </button>
    </div>
  );
}
