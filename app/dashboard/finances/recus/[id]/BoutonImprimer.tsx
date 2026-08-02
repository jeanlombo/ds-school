"use client";

import { Printer } from "lucide-react";

type Props = {
  libelle?: string;
};

export default function BoutonImprimer({
  libelle = "Imprimer",
}: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
    >
      <Printer size={17} />
      {libelle}
    </button>
  );
}
