"use client";

import { useState } from "react";

type Props = {
  source?: string | null;
  nomEcole: string;
};

export default function LogoEcole({
  source,
  nomEcole,
}: Props) {
  const [erreur, setErreur] = useState(false);

  const initiales = nomEcole
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join("");

  if (!source || erreur) {
    return (
      <span aria-label={`Initiales ${nomEcole}`}>
        {initiales || "DS"}
      </span>
    );
  }

  return (
    <img
      src={source}
      alt={`Logo ${nomEcole}`}
      onError={() => setErreur(true)}
    />
  );
}
