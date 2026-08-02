"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export default function QRCodeEnseignant({ valeur, taille = 150 }: { valeur: string; taille?: number }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    QRCode.toDataURL(valeur, { width: taille * 2, margin: 1, errorCorrectionLevel: "H" }).then(setSource);
  }, [valeur, taille]);
  return source ? <img src={source} width={taille} height={taille} alt="QR Code de vérification de l’enseignant" /> : <span>QR…</span>;
}
