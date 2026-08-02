"use client";

import { Download, Printer } from "lucide-react";
import styles from "./tableau-analytique.module.css";

type LigneExport = {
  classe: string;
  section: string;
  eleves: number;
  moyenne: number;
  tauxReussite: number;
  evaluations: number;
};

function echapperCsv(valeur: string | number) {
  const texte = String(valeur).replaceAll('"', '""');
  return `"${texte}"`;
}

export default function BarreActions({
  nomPeriode,
  lignes,
}: {
  nomPeriode: string;
  lignes: LigneExport[];
}) {
  function exporterCsv() {
    const entetes = [
      "Classe",
      "Section",
      "Élèves",
      "Moyenne",
      "Taux de réussite",
      "Évaluations publiées",
    ];

    const contenu = [
      entetes.map(echapperCsv).join(";"),
      ...lignes.map((ligne) =>
        [
          ligne.classe,
          ligne.section,
          ligne.eleves,
          ligne.moyenne,
          ligne.tauxReussite,
          ligne.evaluations,
        ]
          .map(echapperCsv)
          .join(";"),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + contenu], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `analyse-academique-${nomPeriode
      .toLowerCase()
      .replaceAll(" ", "-")}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.actions}>
      <button type="button" onClick={exporterCsv}>
        <Download size={17} />
        Export Excel/CSV
      </button>
      <button type="button" onClick={() => window.print()}>
        <Printer size={17} />
        Imprimer / PDF
      </button>
    </div>
  );
}
