"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { enregistrerPaiement } from "../actions";
import styles from "../paiements.module.css";

type Frais = {
  fraisId: number;
  tarifId: number | null;
  code: string;
  libelle: string;
  montantAttendu: number;
  dejaPaye: number;
  solde: number;
  devise: string;
};

type Mode = {
  id: string;
  mode: string;
  montant: number;
  reference: string;
  telephone: string;
  banque: string;
};

type Props = {
  inscriptionId: number;
  anneeScolaireId: number;
  devise: string;
  frais: Frais[];
};

export default function PaiementClient({
  inscriptionId,
  anneeScolaireId,
  devise,
  frais,
}: Props) {
  const [montants, setMontants] = useState<Record<number, number>>({});
  const [modes, setModes] = useState<Mode[]>([
    {
      id: crypto.randomUUID(),
      mode: "ESPECES",
      montant: 0,
      reference: "",
      telephone: "",
      banque: "",
    },
  ]);

  const details = useMemo(
    () =>
      frais
        .map((item) => ({
          fraisId: item.fraisId,
          tarifId: item.tarifId,
          montant: Number(montants[item.fraisId] ?? 0),
          devise: item.devise,
        }))
        .filter((item) => item.montant > 0),
    [frais, montants]
  );

  const totalDetails = useMemo(
    () => details.reduce((s, d) => s + d.montant, 0),
    [details]
  );

  const totalModes = useMemo(
    () => modes.reduce((s, m) => s + Number(m.montant || 0), 0),
    [modes]
  );

  function ajouterMode() {
    setModes((actuels) => [
      ...actuels,
      {
        id: crypto.randomUUID(),
        mode: "ESPECES",
        montant: 0,
        reference: "",
        telephone: "",
        banque: "",
      },
    ]);
  }

  function modifierMode(id: string, champ: keyof Mode, valeur: string | number) {
    setModes((actuels) =>
      actuels.map((mode) =>
        mode.id === id ? { ...mode, [champ]: valeur } : mode
      )
    );
  }

  function supprimerMode(id: string) {
    setModes((actuels) => actuels.filter((mode) => mode.id !== id));
  }

  return (
    <form action={enregistrerPaiement} className={styles.formPaiement}>
      <input type="hidden" name="inscription_id" value={inscriptionId} />
      <input type="hidden" name="annee_scolaire_id" value={anneeScolaireId} />
      <input type="hidden" name="devise" value={devise} />
      <input type="hidden" name="details" value={JSON.stringify(details)} />
      <input
        type="hidden"
        name="modes"
        value={JSON.stringify(
          modes.map(({ id, ...mode }) => mode)
        )}
      />

      <section className={styles.panel}>
        <div className={styles.enteteSection}>
          <div>
            <h2>Frais à régler</h2>
            <p>Saisissez le montant payé pour un ou plusieurs frais.</p>
          </div>
          <strong>{totalDetails.toLocaleString("fr-FR")} {devise}</strong>
        </div>

        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Frais</th>
                <th>Attendu</th>
                <th>Déjà payé</th>
                <th>Solde</th>
                <th>Montant à payer</th>
              </tr>
            </thead>
            <tbody>
              {frais.map((item) => (
                <tr key={item.fraisId}>
                  <td>{item.code}</td>
                  <td><strong>{item.libelle}</strong></td>
                  <td>{item.montantAttendu.toLocaleString("fr-FR")} {item.devise}</td>
                  <td>{item.dejaPaye.toLocaleString("fr-FR")} {item.devise}</td>
                  <td>
                    <strong className={item.solde > 0 ? styles.solde : styles.soldeZero}>
                      {item.solde.toLocaleString("fr-FR")} {item.devise}
                    </strong>
                  </td>
                  <td>
                    <input
                      className={styles.montant}
                      type="number"
                      min="0"
                      max={Math.max(0, item.solde)}
                      step="0.01"
                      value={montants[item.fraisId] ?? ""}
                      onChange={(event) =>
                        setMontants((actuels) => ({
                          ...actuels,
                          [item.fraisId]: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.enteteSection}>
          <div>
            <h2>Modes de paiement</h2>
            <p>Un paiement peut utiliser un seul mode ou plusieurs modes.</p>
          </div>

          <button type="button" className={styles.secondaire} onClick={ajouterMode}>
            <Plus size={17} />
            Ajouter un mode
          </button>
        </div>

        <div className={styles.modes}>
          {modes.map((mode, index) => (
            <article key={mode.id}>
              <header>
                <strong>Mode {index + 1}</strong>
                {modes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => supprimerMode(mode.id)}
                    title="Supprimer ce mode"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </header>

              <div className={styles.grilleModes}>
                <label>
                  <span>Mode</span>
                  <select
                    value={mode.mode}
                    onChange={(event) =>
                      modifierMode(mode.id, "mode", event.target.value)
                    }
                  >
                    <option value="ESPECES">Espèces</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="AFRIMONEY">Afrimoney</option>
                    <option value="CARTE_BANCAIRE">Carte bancaire</option>
                    <option value="VIREMENT">Virement bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </label>

                <label>
                  <span>Montant</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mode.montant || ""}
                    onChange={(event) =>
                      modifierMode(
                        mode.id,
                        "montant",
                        Number(event.target.value || 0)
                      )
                    }
                  />
                </label>

                <label>
                  <span>Référence</span>
                  <input
                    value={mode.reference}
                    onChange={(event) =>
                      modifierMode(mode.id, "reference", event.target.value)
                    }
                    placeholder="Transaction, bordereau..."
                  />
                </label>

                <label>
                  <span>Téléphone</span>
                  <input
                    value={mode.telephone}
                    onChange={(event) =>
                      modifierMode(mode.id, "telephone", event.target.value)
                    }
                    placeholder="+243..."
                  />
                </label>

                <label>
                  <span>Banque</span>
                  <input
                    value={mode.banque}
                    onChange={(event) =>
                      modifierMode(mode.id, "banque", event.target.value)
                    }
                    placeholder="Nom de la banque"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.equilibre}>
          <div>
            <small>Total des frais</small>
            <strong>{totalDetails.toLocaleString("fr-FR")} {devise}</strong>
          </div>
          <div>
            <small>Total des modes</small>
            <strong>{totalModes.toLocaleString("fr-FR")} {devise}</strong>
          </div>
          <div>
            <small>Écart</small>
            <strong
              className={
                Math.abs(totalDetails - totalModes) < 0.01
                  ? styles.ok
                  : styles.ko
              }
            >
              {(totalModes - totalDetails).toLocaleString("fr-FR")} {devise}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <label className={styles.observation}>
          <span>Observation</span>
          <textarea name="observation" rows={4} />
        </label>
      </section>

      <div className={styles.actionsFinales}>
        <button
          type="submit"
          className={styles.primaire}
          disabled={
            totalDetails <= 0 ||
            Math.abs(totalDetails - totalModes) >= 0.01
          }
        >
          Valider le paiement et générer le reçu
        </button>
      </div>
    </form>
  );
}
