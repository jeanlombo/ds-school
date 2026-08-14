"use client";

import { Printer } from "lucide-react";
import c from "./carte.module.css";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={c.printButton}
    >
      <Printer size={17} />
      Imprimer en PVC
    </button>
  );
}
