"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileCheck2,
  Printer,
  RotateCcw,
  Save,
} from "lucide-react";
import styles from "./deliberations.module.css";

type Decision = "Admis" | "Rattrapage" | "Redouble" | "Exclu";

type Ligne = {
  inscriptionId: number;
  eleveId: number;
  matricule: string;
  nomComplet: string;
  moyenne: number;
  rang: number;
  mention: string;
  tauxCompletion: number;
  proposition: string;
};

type EtatLigne = Ligne & {
  decision: Decision;
  observation: string;
};

type Props = {
  cleStockage: string;
  ecoleNom: string;
  classeNom: string;
  sectionNom: string;
  periodeNom: string;
  anneeNom: string;
  utilisateurNom: string;
  seuilReussite: number;
  lignesInitiales: Ligne[];
};

function echapperCsv(valeur: string | number) {
  return `"${String(valeur).replaceAll('"', '""')}"`;
}

export default function DeliberationClient({
  cleStockage,
  ecoleNom,
  classeNom,
  sectionNom,
  periodeNom,
  anneeNom,
  utilisateurNom,
  seuilReussite,
  lignesInitiales,
}: Props) {
  const [lignes, setLignes] = useState<EtatLigne[]>(
    lignesInitiales.map((ligne) => ({
      ...ligne,
      decision: ligne.proposition as Decision,
      observation: "",
    })),
  );
  const [president, setPresident] = useState(utilisateurNom);
  const [secretaire, setSecretaire] = useState("");
  const [dateConseil, setDateConseil] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [validee, setValidee] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sauvegarde = localStorage.getItem(cleStockage);
    if (!sauvegarde) return;

    try {
      const etat = JSON.parse(sauvegarde);
      if (Array.isArray(etat.lignes)) setLignes(etat.lignes);
      if (typeof etat.president === "string") setPresident(etat.president);
      if (typeof etat.secretaire === "string") setSecretaire(etat.secretaire);
      if (typeof etat.dateConseil === "string") setDateConseil(etat.dateConseil);
      if (typeof etat.validee === "boolean") setValidee(etat.validee);
    } catch {
      localStorage.removeItem(cleStockage);
    }
  }, [cleStockage]);

  const statistiques = useMemo(() => {
    const compter = (decision: Decision) =>
      lignes.filter((ligne) => ligne.decision === decision).length;

    const admis = compter("Admis");
    const rattrapage = compter("Rattrapage");
    const redouble = compter("Redouble");
    const exclu = compter("Exclu");
    const taux =
      lignes.length > 0 ? ((admis + rattrapage) / lignes.length) * 100 : 0;

    return { admis, rattrapage, redouble, exclu, taux };
  }, [lignes]);

  function modifierDecision(inscriptionId: number, decision: Decision) {
    if (validee) return;
    setLignes((courantes) =>
      courantes.map((ligne) =>
        ligne.inscriptionId === inscriptionId ? { ...ligne, decision } : ligne,
      ),
    );
  }

  function modifierObservation(inscriptionId: number, observation: string) {
    if (validee) return;
    setLignes((courantes) =>
      courantes.map((ligne) =>
        ligne.inscriptionId === inscriptionId
          ? { ...ligne, observation }
          : ligne,
      ),
    );
  }

  function sauvegarder() {
    localStorage.setItem(
      cleStockage,
      JSON.stringify({
        lignes,
        president,
        secretaire,
        dateConseil,
        validee,
        sauvegardeLe: new Date().toISOString(),
      }),
    );
    setMessage("Délibération sauvegardée sur cet appareil.");
    window.setTimeout(() => setMessage(""), 2800);
  }

  function validerOfficiellement() {
    const prochainEtat = true;
    setValidee(prochainEtat);
    localStorage.setItem(
      cleStockage,
      JSON.stringify({
        lignes,
        president,
        secretaire,
        dateConseil,
        validee: prochainEtat,
        valideeLe: new Date().toISOString(),
      }),
    );
    setMessage("Délibération validée et verrouillée.");
    window.setTimeout(() => setMessage(""), 2800);
  }

  function deverrouiller() {
    setValidee(false);
    setMessage("Délibération déverrouillée pour correction.");
    window.setTimeout(() => setMessage(""), 2800);
  }

  function reinitialiser() {
    if (!window.confirm("Réinitialiser toutes les décisions proposées ?")) return;
    const initiales = lignesInitiales.map((ligne) => ({
      ...ligne,
      decision: ligne.proposition as Decision,
      observation: "",
    }));
    setLignes(initiales);
    setValidee(false);
    localStorage.removeItem(cleStockage);
  }

  function exporter() {
    const entetes = [
      "Matricule",
      "Apprenant",
      "Rang",
      "Moyenne",
      "Mention",
      "Complétude",
      "Décision",
      "Observation",
    ];

    const contenu = [
      entetes.map(echapperCsv).join(";"),
      ...lignes.map((ligne) =>
        [
          ligne.matricule,
          ligne.nomComplet,
          ligne.rang,
          ligne.moyenne,
          ligne.mention,
          `${ligne.tauxCompletion}%`,
          ligne.decision,
          ligne.observation,
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
    lien.download = `deliberation-${classeNom.toLowerCase().replaceAll(" ", "-")}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.resume}>
        <article className={styles.admis}>
          <strong>{statistiques.admis}</strong>
          <span>Admis</span>
        </article>
        <article className={styles.rattrapage}>
          <strong>{statistiques.rattrapage}</strong>
          <span>Rattrapage</span>
        </article>
        <article className={styles.redouble}>
          <strong>{statistiques.redouble}</strong>
          <span>Redoublants</span>
        </article>
        <article className={styles.exclus}>
          <strong>{statistiques.exclu}</strong>
          <span>Exclus</span>
        </article>
        <article className={styles.taux}>
          <strong>{statistiques.taux.toFixed(1)}%</strong>
          <span>Réussite finale</span>
        </article>
      </section>

      <section className={styles.outils}>
        <div>
          <label>
            <span>Président du conseil</span>
            <input
              value={president}
              onChange={(event) => setPresident(event.target.value)}
              disabled={validee}
            />
          </label>
          <label>
            <span>Secrétaire de séance</span>
            <input
              value={secretaire}
              onChange={(event) => setSecretaire(event.target.value)}
              placeholder="Nom du secrétaire"
              disabled={validee}
            />
          </label>
          <label>
            <span>Date du conseil</span>
            <input
              type="date"
              value={dateConseil}
              onChange={(event) => setDateConseil(event.target.value)}
              disabled={validee}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={sauvegarder}>
            <Save size={17} />
            Sauvegarder
          </button>
          <button type="button" onClick={exporter}>
            <Download size={17} />
            Export Excel/CSV
          </button>
          <button type="button" onClick={() => window.print()}>
            <Printer size={17} />
            Procès-verbal PDF
          </button>
          {!validee ? (
            <button
              type="button"
              className={styles.valider}
              onClick={validerOfficiellement}
            >
              <FileCheck2 size={17} />
              Valider officiellement
            </button>
          ) : (
            <button type="button" onClick={deverrouiller}>
              <RotateCcw size={17} />
              Déverrouiller
            </button>
          )}
        </div>
      </section>

      <section className={styles.procesVerbal}>
        <div className={styles.entetePv}>
          <div>
            <small>{ecoleNom}</small>
            <h2>PROCÈS-VERBAL DE DÉLIBÉRATION</h2>
            <p>
              {classeNom} {sectionNom ? `— ${sectionNom}` : ""} · {periodeNom} ·{" "}
              {anneeNom}
            </p>
          </div>
          <span className={validee ? styles.statutValide : styles.statutBrouillon}>
            {validee ? (
              <>
                <CheckCircle2 size={16} /> Validée
              </>
            ) : (
              "Brouillon"
            )}
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Matricule</th>
                <th>Apprenant</th>
                <th>Moyenne</th>
                <th>Mention</th>
                <th>Complétude</th>
                <th>Décision finale</th>
                <th>Observation du conseil</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.inscriptionId}>
                  <td>{ligne.rang}</td>
                  <td>{ligne.matricule}</td>
                  <td>
                    <strong>{ligne.nomComplet}</strong>
                  </td>
                  <td>
                    <b className={ligne.moyenne >= seuilReussite ? styles.ok : styles.ko}>
                      {ligne.moyenne.toFixed(2)}%
                    </b>
                  </td>
                  <td>{ligne.mention}</td>
                  <td>{ligne.tauxCompletion.toFixed(0)}%</td>
                  <td>
                    <select
                      value={ligne.decision}
                      onChange={(event) =>
                        modifierDecision(
                          ligne.inscriptionId,
                          event.target.value as Decision,
                        )
                      }
                      disabled={validee}
                    >
                      <option value="Admis">Admis</option>
                      <option value="Rattrapage">Rattrapage</option>
                      <option value="Redouble">Redouble</option>
                      <option value="Exclu">Exclu</option>
                    </select>
                  </td>
                  <td>
                    <input
                      value={ligne.observation}
                      onChange={(event) =>
                        modifierObservation(
                          ligne.inscriptionId,
                          event.target.value,
                        )
                      }
                      placeholder="Observation..."
                      disabled={validee}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {lignes.length === 0 && (
            <div className={styles.vide}>
              Aucun résultat disponible pour cette classe et cette période.
            </div>
          )}
        </div>

        <div className={styles.signatures}>
          <div>
            <span>Président du conseil</span>
            <strong>{president || "________________________"}</strong>
            <small>Signature</small>
          </div>
          <div>
            <span>Secrétaire de séance</span>
            <strong>{secretaire || "________________________"}</strong>
            <small>Signature</small>
          </div>
          <div>
            <span>Date du conseil</span>
            <strong>{dateConseil || "________________"}</strong>
            <small>Cachet de l’établissement</small>
          </div>
        </div>

        <div className={styles.notePv}>
          Décisions proposées automatiquement à partir du seuil de réussite de{" "}
          {seuilReussite.toFixed(0)} %. Toute modification relève du conseil de
          classe.
        </div>
      </section>

      <button type="button" className={styles.reinitialiser} onClick={reinitialiser}>
        <RotateCcw size={16} />
        Réinitialiser la session de délibération
      </button>
    </>
  );
}
