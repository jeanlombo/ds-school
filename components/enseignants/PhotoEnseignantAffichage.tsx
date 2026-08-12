"use client";

import { useState } from "react";

type Props = {
  src?: string | null;
  alt: string;
  initiales: string;
  className?: string;
};

function normaliserSource(source?: string | null): string | null {
  if (!source) return null;

  const valeur = source.trim();
  if (!valeur) return null;

  if (
    valeur.startsWith("http://") ||
    valeur.startsWith("https://") ||
    valeur.startsWith("/") ||
    valeur.startsWith("data:") ||
    valeur.startsWith("blob:")
  ) {
    return valeur;
  }

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

export default function PhotoEnseignantAffichage({
  src,
  alt,
  initiales,
  className,
}: Props) {
  const [erreur, setErreur] = useState(false);
  const source = normaliserSource(src);

  if (!source || erreur) {
    return (
      <span className={className} aria-label={alt}>
        {initiales || "EN"}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={source}
      alt={alt}
      onError={() => setErreur(true)}
      draggable={false}
    />
  );
}
