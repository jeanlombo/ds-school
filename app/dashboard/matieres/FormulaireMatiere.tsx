"use client";

import { useState } from "react";
import { Save, Sparkles } from "lucide-react";
import styles from "./matieres.module.css";

type MatiereInitiale = {
  code?: string;
  nom?: string;
  description?: string | null;
  departement?: string | null;
  coefficient?: string | number;
  volumeHoraireHebdomadaire?: number;
  couleur?: string;
  statut?: "ACTIF" | "INACTIF";
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initiale?: MatiereInitiale;
  mode?: "creation" | "modification";
};

export default function FormulaireMatiere({
  action,
  initiale,
  mode = "creation",
}: Props) {
  const [couleur, setCouleur] = useState(initiale?.couleur || "#2563EB");

  return (
    <form action={action} className={styles.formulaire}>
      <div className={styles.formEntete}>
        <div className={styles.iconeForm}>
          <Sparkles size={22} />
        </div>
        <div>
          <h2>
            {mode === "creation"
              ? "Informations de la matière"
              : "Modifier la matière"}
          </h2>
          <p>
            Les champs marqués d’un astérisque sont obligatoires.
          </p>
        </div>
      </div>

      <div className={styles.grilleForm}>
        <label>
          <span>Nom de la matière *</span>
          <input
            name="nom"
            required
            minLength={2}
            maxLength={150}
            defaultValue={initiale?.nom || ""}
            placeholder="Ex. Mathématiques"
          />
        </label>

        <label>
          <span>Code</span>
          <input
            name="code"
            maxLength={30}
            defaultValue={initiale?.code || ""}
            placeholder={
              mode === "creation"
                ? "Laisser vide pour générer automatiquement"
                : "Ex. MAT001"
            }
          />
        </label>

        <label>
          <span>Département</span>
          <input
            name="departement"
            list="departements"
            maxLength={100}
            defaultValue={initiale?.departement || ""}
            placeholder="Ex. Sciences"
          />
          <datalist id="departements">
            <option value="Sciences" />
            <option value="Lettres et langues" />
            <option value="Sciences humaines" />
            <option value="Technique" />
            <option value="Arts et culture" />
            <option value="Éducation physique" />
            <option value="Informatique" />
          </datalist>
        </label>

        <label>
          <span>Coefficient *</span>
          <input
            name="coefficient"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            required
            defaultValue={initiale?.coefficient ?? 1}
          />
        </label>

        <label>
          <span>Volume horaire hebdomadaire *</span>
          <input
            name="volumeHoraireHebdomadaire"
            type="number"
            min="1"
            max="60"
            required
            defaultValue={initiale?.volumeHoraireHebdomadaire ?? 1}
          />
        </label>

        <label>
          <span>Statut *</span>
          <select name="statut" defaultValue={initiale?.statut || "ACTIF"}>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
          </select>
        </label>

        <label className={styles.champCouleur}>
          <span>Couleur pour l’emploi du temps</span>
          <div className={styles.couleurLigne}>
            <input
              name="couleur"
              type="color"
              value={couleur}
              onChange={(event) => setCouleur(event.target.value)}
            />
            <strong>{couleur.toUpperCase()}</strong>
            <i style={{ backgroundColor: couleur }} />
          </div>
        </label>

        <label className={styles.pleineLargeur}>
          <span>Description</span>
          <textarea
            name="description"
            rows={5}
            maxLength={1000}
            defaultValue={initiale?.description || ""}
            placeholder="Informations complémentaires sur la matière…"
          />
        </label>
      </div>

      <div className={styles.actionsForm}>
        <a href="/dashboard/matieres" className={styles.boutonSecondaire}>
          Annuler
        </a>
        <button type="submit" className={styles.boutonPrimaire}>
          <Save size={18} />
          {mode === "creation" ? "Enregistrer la matière" : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
