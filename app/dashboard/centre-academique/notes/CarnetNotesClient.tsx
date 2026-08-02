"use client";

import { useMemo, useState } from "react";
import { Save, UserX } from "lucide-react";
import styles from "./carnet-notes.module.css";

type Ligne = {
  eleveId: number;
  matricule: string;
  nomComplet: string;
  valeur: number | null;
  absent: boolean;
  appreciation: string;
};

type Props = {
  evaluationId: number;
  bareme: number;
  lignes: Ligne[];
  action: (formData: FormData) => void | Promise<void>;
};

export default function CarnetNotesClient({
  evaluationId,
  bareme,
  lignes,
  action,
}: Props) {
  const [valeurs, setValeurs] = useState<Record<number, string>>(
    Object.fromEntries(
      lignes.map((ligne) => [
        ligne.eleveId,
        ligne.valeur === null ? "" : String(ligne.valeur),
      ]),
    ),
  );

  const [absents, setAbsents] = useState<Record<number, boolean>>(
    Object.fromEntries(lignes.map((ligne) => [ligne.eleveId, ligne.absent])),
  );

  const statistiques = useMemo(() => {
    const notes = lignes
      .filter((ligne) => !absents[ligne.eleveId])
      .map((ligne) => Number(valeurs[ligne.eleveId]))
      .filter((note) => Number.isFinite(note) && valeurs[ligne.eleveId] !== "");

    const moyenne = notes.length
      ? notes.reduce((total, note) => total + note, 0) / notes.length
      : 0;
    const meilleure = notes.length ? Math.max(...notes) : 0;
    const plusFaible = notes.length ? Math.min(...notes) : 0;
    const seuil = bareme / 2;
    const reussites = notes.filter((note) => note >= seuil).length;

    return {
      saisies: notes.length,
      absents: Object.values(absents).filter(Boolean).length,
      moyenne,
      meilleure,
      plusFaible,
      taux: notes.length ? (reussites / notes.length) * 100 : 0,
    };
  }, [absents, bareme, lignes, valeurs]);

  function gererClavier(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key !== "Enter" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const suivant = document.querySelector<HTMLInputElement>(
      `[data-note-index="${index + 1}"]`,
    );
    suivant?.focus();
    suivant?.select();
  }

  return (
    <>
      <section className={styles.statsRapides}>
        <article><small>Notes saisies</small><strong>{statistiques.saisies}</strong></article>
        <article><small>Moyenne de classe</small><strong>{statistiques.moyenne.toFixed(2)} / {bareme}</strong></article>
        <article><small>Meilleure note</small><strong>{statistiques.meilleure.toFixed(2)}</strong></article>
        <article><small>Taux de réussite</small><strong>{statistiques.taux.toFixed(1)} %</strong></article>
      </section>

      <form action={action} className={styles.formulaire}>
        <input type="hidden" name="evaluationId" value={evaluationId} />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Note / {bareme}</th>
                <th>Absent</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne, index) => {
                const absent = absents[ligne.eleveId] ?? false;
                const valeur = valeurs[ligne.eleveId] ?? "";
                const invalide = valeur !== "" && (
                  !Number.isFinite(Number(valeur)) ||
                  Number(valeur) < 0 ||
                  Number(valeur) > bareme
                );

                return (
                  <tr key={ligne.eleveId} className={absent ? styles.ligneAbsente : ""}>
                    <td>{index + 1}</td>
                    <td><span className={styles.matricule}>{ligne.matricule}</span></td>
                    <td><strong>{ligne.nomComplet}</strong></td>
                    <td>
                      <input type="hidden" name="eleveId" value={ligne.eleveId} />
                      <input
                        data-note-index={index}
                        className={`${styles.noteInput} ${invalide ? styles.inputInvalide : ""}`}
                        name={`note_${ligne.eleveId}`}
                        type="number"
                        min="0"
                        max={bareme}
                        step="0.25"
                        value={valeur}
                        disabled={absent}
                        onChange={(event) => setValeurs((actuel) => ({
                          ...actuel,
                          [ligne.eleveId]: event.target.value,
                        }))}
                        onKeyDown={(event) => gererClavier(event, index)}
                        placeholder="—"
                      />
                      {invalide && <small className={styles.erreur}>0 à {bareme}</small>}
                    </td>
                    <td>
                      <label className={styles.absentToggle}>
                        <input
                          name={`absent_${ligne.eleveId}`}
                          type="checkbox"
                          checked={absent}
                          onChange={(event) => {
                            const coche = event.target.checked;
                            setAbsents((actuel) => ({ ...actuel, [ligne.eleveId]: coche }));
                            if (coche) {
                              setValeurs((actuel) => ({ ...actuel, [ligne.eleveId]: "" }));
                            }
                          }}
                        />
                        <UserX size={16} />
                        <span>{absent ? "Absent" : "Présent"}</span>
                      </label>
                    </td>
                    <td>
                      <input
                        className={styles.appreciation}
                        name={`appreciation_${ligne.eleveId}`}
                        defaultValue={ligne.appreciation}
                        placeholder="Appréciation facultative"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className={styles.footerAction}>
          <div>
            <strong>{lignes.length} élève(s)</strong>
            <span>{statistiques.absents} absent(s) · Plus faible : {statistiques.plusFaible.toFixed(2)}</span>
          </div>
          <button type="submit" className={styles.boutonSauvegarde}>
            <Save size={18} />
            Enregistrer toutes les notes
          </button>
        </footer>
      </form>
    </>
  );
}
