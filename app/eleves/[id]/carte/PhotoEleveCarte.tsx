"use client";

import { useState } from "react";

type Props = {
  src?: string | null;
  alt: string;
  initiales: string;
};

function normaliserSource(
  source?: string | null
): string | null {
  if (!source) {
    return null;
  }

  const valeur = source.trim();

  if (!valeur) {
    return null;
  }

  if (
    valeur.startsWith("http://") ||
    valeur.startsWith("https://") ||
    valeur.startsWith("/") ||
    valeur.startsWith("data:") ||
    valeur.startsWith("blob:")
  ) {
    return valeur;
  }

  /*
   * Compatibilité avec d’anciennes valeurs Windows telles que :
   * C:\xampp\htdocs\ds-school\public\uploads\eleves\photo.jpg
   */
  const normalisee = valeur.replaceAll("\\", "/");
  const repere = "/public/";

  if (normalisee.includes(repere)) {
    return `/${normalisee.split(repere)[1]}`;
  }

  if (normalisee.includes("/uploads/")) {
    return `/uploads/${normalisee.split("/uploads/")[1]}`;
  }

  return null;
}

export default function PhotoEleveCarte({
  src,
  alt,
  initiales,
}: Props) {
  const [imageErreur, setImageErreur] =
    useState(false);

  const source = normaliserSource(src);

  if (!source || imageErreur) {
    return (
      <div className="photo-placeholder">
        <strong>{initiales}</strong>
        <span>PHOTO</span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={alt}
      onError={() => setImageErreur(true)}
      draggable={false}
    />
  );
}
