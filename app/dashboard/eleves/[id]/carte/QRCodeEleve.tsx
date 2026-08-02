"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QRCodeEleveProps = {
  contenu: string;
  nomEleve: string;
};

export default function QRCodeEleve({ contenu, nomEleve }: QRCodeEleveProps) {
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    let actif = true;

    QRCode.toDataURL(contenu, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#173f72",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (actif) setQrCode(url);
      })
      .catch((erreur) => {
        console.error("Impossible de générer le QR Code de l’élève :", erreur);
      });

    return () => {
      actif = false;
    };
  }, [contenu]);

  if (!qrCode) {
    return <div className="qr-loading">Génération…</div>;
  }

  return (
    <img
      src={qrCode}
      alt={`QR Code de ${nomEleve}`}
      width={132}
      height={132}
    />
  );
}
