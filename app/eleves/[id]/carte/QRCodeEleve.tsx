"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QRCodeEleveProps = {
  contenu: string;
  nomEleve: string;
};

export default function QRCodeEleve({
  contenu,
  nomEleve,
}: QRCodeEleveProps) {
  const [qrCode, setQrCode] = useState("");
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let actif = true;

    setQrCode("");
    setErreur(false);

    QRCode.toDataURL(contenu, {
      width: 512,
      margin: 3,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (actif) {
          setQrCode(url);
        }
      })
      .catch((cause) => {
        console.error(
          "Impossible de générer le QR Code de l’apprenant :",
          cause
        );

        if (actif) {
          setErreur(true);
        }
      });

    return () => {
      actif = false;
    };
  }, [contenu]);

  if (erreur) {
    return (
      <div className="qr-error">
        QR indisponible
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="qr-loading">
        Génération…
      </div>
    );
  }

  return (
    <img
      src={qrCode}
      alt={`QR Code Safe Campus de ${nomEleve}`}
      width={160}
      height={160}
      draggable={false}
    />
  );
}
