"use client";

import { useMemo, useState } from "react";
import { Download, Printer, ShieldCheck } from "lucide-react";
import { executerPromotion } from "./actions";
import styles from "./promotions.module.css";

type Decision = "PROMU" | "REDOUBLE" | "RATTRAPAGE" | "EXCLU";

type Ligne = {
  inscriptionId: number;
  eleveId: number;
  matricule: string;
  nomComplet: string;
  moyenne: number;
  rang: number;
  mention: string;
  tauxCompletion: number;
  statutActuel: string;
  decision: Decision;
};

type Props = {
  anneeSourceId: number;
  anneeCibleId: number;
  classeSourceId: number;
  classeCibleId: number;
  anneeSourceNom: string;
  anneeCibleNom: string;
  classeSourceNom: string;
  classeCibleNom: string;
  lignesInitiales: Ligne[];
};

function csv(valeur: string | number) {
  return `"${String(valeur).replaceAll('"', '""')}"`;
}

export default function PromotionClient(props: Props) {
  const [lignes, setLignes] = useState(props.lignesInitiales);
  const [confirmation, setConfirmation] = useState("");

  const stats = useMemo(() => {
    const compter = (decision: Decision) =>
      lignes.filter((ligne) => ligne.decision === decision).length;
    return {
      promus: compter("PROMU"),
      redoublants: compter("REDOUBLE"),
      rattrapage: compter("RATTRAPAGE"),
      exclus: compter("EXCLU"),
    };
  }, [lignes]);

  function changer(inscriptionId: number, decision: Decision) {
    setLignes((actuelles) =>
      actuelles.map((ligne) =>
        ligne.inscriptionId === inscriptionId
          ? { ...ligne, decision }
          : ligne,
      ),
    );
  }

  function exporter() {
    const contenu = [
      [
        "Matricule",
        "Élève",
        "Rang",
        "Moyenne",
        "Mention",
        "Décision",
        "Classe source",
        "Classe cible",
      ]
        .map(csv)
        .join(";"),
      ...lignes.map((ligne) =>
        [
          ligne.matricule,
          ligne.nomComplet,
          ligne.rang,
          ligne.moyenne,
          ligne.mention,
          ligne.decision,
          props.classeSourceNom,
          ligne.decision === "PROMU"
            ? props.classeCibleNom
            : props.classeSourceNom,
        ]
          .map(csv)
          .join(";"),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + contenu], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `promotion-${props.classeSourceNom
      .toLowerCase()
      .replaceAll(" ", "-")}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  const payload = JSON.stringify(
    lignes.map(({ inscriptionId, eleveId, decision }) => ({
      inscriptionId,
      eleveId,
      decision,
    })),
  );

  return (
    <>
      <section className={styles.resume}>
        <article className={styles.promu}>
          <strong>{stats.promus}</strong>
          <span>À promouvoir</span>
        </article>
        <article className={styles.redouble}>
          <strong>{stats.redoublants}</strong>
          <span>Redoublants</span>
        </article>
        <article className={styles.attente}>
          <strong>{stats.rattrapage}</strong>
          <span>En attente</span>
        </article>
        <article className={styles.exclu}>
          <strong>{stats.exclus}</strong>
          <span>Exclus</span>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.entete}>
          <div>
            <span>Prévisualisation</span>
            <h3>
              {props.classeSourceNom} · {props.anneeSourceNom} vers{" "}
              {props.anneeCibleNom}
            </h3>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={exporter}>
              <Download size={17} /> Export Excel/CSV
            </button>
            <button type="button" onClick={() => window.print()}>
              <Printer size={17} /> Imprimer / PDF
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Moyenne</th>
                <th>Mention</th>
                <th>Complétude</th>
                <th>Statut actuel</th>
                <th>Décision de promotion</th>
                <th>Destination</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.inscriptionId}>
                  <td>{ligne.rang}</td>
                  <td>{ligne.matricule}</td>
                  <td><strong>{ligne.nomComplet}</strong></td>
                  <td>{ligne.moyenne.toFixed(2)}%</td>
                  <td>{ligne.mention}</td>
                  <td>{ligne.tauxCompletion.toFixed(0)}%</td>
                  <td>{ligne.statutActuel}</td>
                  <td>
                    <select
                      value={ligne.decision}
                      onChange={(event) =>
                        changer(
                          ligne.inscriptionId,
                          event.target.value as Decision,
                        )
                      }
                    >
                      <option value="PROMU">Promu</option>
                      <option value="REDOUBLE">Redouble</option>
                      <option value="RATTRAPAGE">Rattrapage / attente</option>
                      <option value="EXCLU">Exclu</option>
                    </select>
                  </td>
                  <td>
                    {ligne.decision === "PROMU"
                      ? props.classeCibleNom
                      : ligne.decision === "REDOUBLE"
                        ? props.classeSourceNom
                        : "Aucune inscription"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {lignes.length === 0 && (
            <div className={styles.vide}>
              Aucun résultat à promouvoir pour cette sélection.
            </div>
          )}
        </div>
      </section>

      <section className={styles.validation}>
        <div>
          <ShieldCheck size={28} />
          <div>
            <h3>Validation définitive</h3>
            <p>
              Cette opération crée ou met à jour les inscriptions de{" "}
              {props.anneeCibleNom}, actualise le statut de l’inscription source
              et ajoute une trace dans l’historique de chaque élève.
            </p>
          </div>
        </div>

        <form action={executerPromotion}>
          <input type="hidden" name="anneeSourceId" value={props.anneeSourceId} />
          <input type="hidden" name="anneeCibleId" value={props.anneeCibleId} />
          <input type="hidden" name="classeSourceId" value={props.classeSourceId} />
          <input type="hidden" name="classeCibleId" value={props.classeCibleId} />
          <input type="hidden" name="lignes" value={payload} />

          <label>
            <span>Tapez CONFIRMER pour exécuter</span>
            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value.toUpperCase())}
              placeholder="CONFIRMER"
              autoComplete="off"
            />
          </label>

          <button
            type="submit"
            disabled={confirmation !== "CONFIRMER" || lignes.length === 0}
          >
            <ShieldCheck size={18} />
            Exécuter la promotion
          </button>
        </form>
      </section>
    </>
  );
}
