"use client";

import { Printer } from "lucide-react";

export default function BoutonImprimer() {
  return (
    <button type="button" onClick={() => window.print()}>
      <Printer size={18} />
      Imprimer le bulletin
    </button>
  );
}
