"use client";

import { useState } from "react";

type Props = {
  src?: string | null;
  alt: string;
  initiales: string;
};

function normaliserSource(source?: string | null): string | null {
  if (!source) return null;

  const valeur = source.trim();
  if (!valeur) return null;

  const normalisee = valeur.replaceAll("\\", "/");

  // URL déjà publique.
  if (
    normalisee.startsWith("http://") ||
    normalisee.startsWith("https://") ||
    normalisee.startsWith("data:") ||
    normalisee.startsWith("blob:")
  ) {
    return normalisee;
  }

  // Chemin public normal : /uploads/...
  if (normalisee.startsWith("/uploads/")) {
    return normalisee;
  }

  // Anciennes valeurs enregistrées avec "public/uploads/..."
  if (normalisee.includes("/public/")) {
    return `/${normalisee.split("/public/")[1]}`;
  }

  // Anciennes valeurs sans slash initial : uploads/...
  if (normalisee.startsWith("uploads/")) {
    return `/${normalisee}`;
  }

  // Dernier filet de sécurité si le chemin contient uploads/.
  if (normalisee.includes("/uploads/")) {
    return `/uploads/${normalisee.split("/uploads/")[1]}`;
  }

  return null;
}

export default function PhotoEnseignantCarte({
  src,
  alt,
  initiales,
}: Props) {
  const [imageErreur, setImageErreur] = useState(false);
  const source = normaliserSource(src);

  if (!source || imageErreur) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
          alignContent: "center",
          gap: 4,
          background: "linear-gradient(145deg,#e2e8f0,#f8fafc)",
          color: "#475569",
        }}
      >
        <strong style={{ fontSize: 30 }}>{initiales || "EN"}</strong>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>
          PHOTO
        </span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={alt}
      onError={() => setImageErreur(true)}
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        display: "block",
      }}
    />
  );
}
