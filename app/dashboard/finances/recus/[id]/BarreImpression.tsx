"use client";

import Link from "next/link";
import { ArrowLeft, FileDown, Printer, ReceiptText } from "lucide-react";
import { useState } from "react";
import { enregistrerImpressionRecu } from "../actions";
import styles from "../module.module.css";

type Format = "A4" | "A5" | "POS58" | "POS80";

type Props = {
  recuId: number;
  formatActuel: Format;
  duplicata: boolean;
};

const formats: Array<{
  code: Format;
  libelle: string;
  icon: typeof Printer;
}> = [
  { code: "A4", libelle: "A4 / PDF", icon: FileDown },
  { code: "A5", libelle: "A5", icon: ReceiptText },
  { code: "POS58", libelle: "POS 58 mm", icon: Printer },
  { code: "POS80", libelle: "POS 80 mm", icon: Printer },
];

export default function BarreImpression({
  recuId,
  formatActuel,
  duplicata,
}: Props) {
  const [chargement, setChargement] = useState<string | null>(null);

  async function imprimer(format: Format) {
    try {
      setChargement(format);

      await enregistrerImpressionRecu(
        recuId,
        format,
        true
      );

      const url = new URL(window.location.href);
      url.searchParams.set("format", format.toLowerCase());
      url.searchParams.set("duplicata", "1");

      if (format === formatActuel && duplicata) {
        window.print();
        return;
      }

      const fenetre = window.open(
        url.toString(),
        "_blank",
        "noopener,noreferrer"
      );

      if (!fenetre) {
        window.location.href = url.toString();
      }
    } finally {
      setChargement(null);
    }
  }

  return (
    <div className={styles.toolbar}>
      <Link href="/dashboard/finances/recus">
        <ArrowLeft size={17} />
        Historique des reçus
      </Link>

      <div className={styles.outilsImpression}>
        {formats.map(({ code, libelle, icon: Icon }) => (
          <button
            key={code}
            type="button"
            onClick={() => imprimer(code)}
            disabled={chargement !== null}
            title={
              code === "A4"
                ? "Dans la boîte d’impression, choisissez Enregistrer au format PDF."
                : undefined
            }
          >
            <Icon size={17} />
            {chargement === code ? "Préparation..." : libelle}
          </button>
        ))}
      </div>
    </div>
  );
}
