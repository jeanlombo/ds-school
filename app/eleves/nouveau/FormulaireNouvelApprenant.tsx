"use client";

import { useMemo, useState } from "react";
import { HeartPulse, Save, School, UserRound, UsersRound } from "lucide-react";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import PhotoEleveUpload from "@/components/eleves/PhotoEleveUpload";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import { creerEleve } from "../actions";

type ClasseOption = {
  id: number;
  nom: string;
  sectionNom: string;
};

type AnneeOption = {
  id: number;
  libelle: string;
  active: boolean;
};

type Props = {
  classes: ClasseOption[];
  annees: AnneeOption[];
  matricule: string;
  aujourdHui: string;
};

function normaliser(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function terminologie(sectionNom: string) {
  const s = normaliser(sectionNom);
  const superieur =
    s.includes("univers") ||
    s.includes("institut superieur") ||
    s.includes("institut supérieur");

  return superieur
    ? {
        personne: "étudiant",
        personneMaj: "Étudiant",
        personnes: "étudiants",
        structure: "promotion",
        structureMaj: "Promotion",
        periode: "année académique",
        periodeMaj: "Année académique",
        carte: "carte étudiant",
        provenance: "établissement / université de provenance",
      }
    : {
        personne: "élève",
        personneMaj: "Élève",
        personnes: "élèves",
        structure: "classe",
        structureMaj: "Classe",
        periode: "année scolaire",
        periodeMaj: "Année scolaire",
        carte: "carte élève",
        provenance: "école / établissement de provenance",
      };
}

export default function FormulaireNouvelApprenant({
  classes,
  annees,
  matricule,
  aujourdHui,
}: Props) {
  const [classeId, setClasseId] = useState("");

  const classeSelectionnee = useMemo(
    () => classes.find((c) => String(c.id) === classeId),
    [classes, classeId]
  );

  const t = terminologie(classeSelectionnee?.sectionNom || "");

  return (
    <form
      action={creerEleve}
      className={elevesStyles.formulaireLong}
      encType="multipart/form-data"
    >
      <section className={styles.panneau}>
        <div className={styles.panneauEntete}>
          <div className={elevesStyles.titreSection}>
            <span><UserRound /></span>
            <div>
              <h2>Identification de l’{t.personne}</h2>
              <p>
                Identité officielle de l’{t.personne} et photo utilisée sur sa {t.carte}.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.panneauCorps}>
          <PhotoEleveUpload />
          <div className={styles.formGrille}>
            <div className={styles.champ}>
              <label>Matricule de l’{t.personne}</label>
              <input name="matricule" defaultValue={matricule} />
            </div>
            <div className={styles.champ}>
              <label>Numéro permanent</label>
              <input name="numeroPermanent" placeholder="Facultatif" />
            </div>
            <div className={styles.champ}><label>Nom *</label><input name="nom" required /></div>
            <div className={styles.champ}><label>Postnom</label><input name="postnom" /></div>
            <div className={styles.champ}><label>Prénom *</label><input name="prenom" required /></div>
            <div className={styles.champ}>
              <label>Sexe *</label>
              <select name="sexe" required defaultValue="">
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className={styles.champ}><label>Date de naissance *</label><input type="date" name="dateNaissance" required /></div>
            <div className={styles.champ}><label>Lieu de naissance</label><input name="lieuNaissance" /></div>
            <div className={styles.champ}><label>Nationalité</label><input name="nationalite" defaultValue="Congolaise" /></div>
            <div className={`${styles.champ} ${styles.champLarge}`}><label>Adresse</label><textarea name="adresse" /></div>
          </div>
        </div>
      </section>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}>
          <div className={elevesStyles.titreSection}>
            <span><School /></span>
            <div>
              <h2>Informations académiques</h2>
              <p>
                Sélectionnez d’abord la {t.structure}; la terminologie du formulaire
                s’adapte automatiquement à la section.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.panneauCorps}>
          <div className={styles.formGrille}>
            <div className={styles.champ}>
              <label>{t.periodeMaj} *</label>
              <select
                name="anneeScolaireId"
                required
                defaultValue={String(annees.find((a) => a.active)?.id || annees[0]?.id || "")}
              >
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.libelle}{a.active ? " — active" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.champ}>
              <label>{t.structureMaj} / section *</label>
              <select
                name="classeId"
                required
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
              >
                <option value="">Sélectionner</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.sectionNom} — {c.nom}
                  </option>
                ))}
              </select>
            </div>

            {classeSelectionnee && (
              <div className={`${styles.champ} ${styles.champLarge}`}>
                <div className={styles.infoBandeau}>
                  Section : <strong>{classeSelectionnee.sectionNom}</strong> ·
                  Dossier traité comme <strong>{t.personne}</strong> ·
                  Structure : <strong>{t.structure}</strong> ·
                  Période : <strong>{t.periode}</strong>.
                </div>
              </div>
            )}

            <div className={styles.champ}><label>Date d’inscription</label><input type="date" name="dateInscription" defaultValue={aujourdHui} /></div>
            <div className={styles.champ}>
              <label>Type d’admission</label>
              <select name="typeAdmission" defaultValue="nouveau">
                <option value="nouveau">Nouveau / débutant</option>
                <option value="ancien">Ancien / déjà inscrit</option>
                <option value="transfert">Transfert</option>
              </select>
            </div>
            <div className={`${styles.champ} ${styles.champLarge}`}>
              <label>{t.provenance}</label>
              <input name="ancienneEcole" placeholder={`Nom de l’${t.provenance}`} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}>
          <div className={elevesStyles.titreSection}>
            <span><UsersRound /></span>
            <div>
              <h2>Responsables / personnes de contact</h2>
              <p>
                Parents, tuteur ou personne de contact. Ces informations restent
                facultatives et conviennent aussi aux {t.personnes} majeurs.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.panneauCorps}>
          <div className={elevesStyles.responsablesGrille}>
            {["pere", "mere", "tuteur"].map((type) => (
              <fieldset key={type} className={elevesStyles.responsable}>
                <legend>{type === "pere" ? "Père" : type === "mere" ? "Mère" : "Tuteur / contact"}</legend>
                <label>Nom complet<input name={`${type}Nom`} /></label>
                <label>Téléphone<input name={`${type}Telephone`} /></label>
                <label>E-mail<input type="email" name={`${type}Email`} /></label>
                <label>Profession<input name={`${type}Profession`} /></label>
                <label>Adresse<input name={`${type}Adresse`} /></label>
              </fieldset>
            ))}
          </div>
          <div className={styles.champ}>
            <label>Contact principal</label>
            <select name="responsablePrincipal" defaultValue="tuteur">
              <option value="pere">Père</option>
              <option value="mere">Mère</option>
              <option value="tuteur">Tuteur / contact</option>
            </select>
          </div>
        </div>
      </section>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}>
          <div className={elevesStyles.titreSection}>
            <span><HeartPulse /></span>
            <div>
              <h2>Informations médicales</h2>
              <p>Données utiles en cas d’urgence concernant l’{t.personne}.</p>
            </div>
          </div>
        </div>
        <div className={styles.panneauCorps}>
          <div className={styles.formGrille}>
            <div className={styles.champ}>
              <label>Groupe sanguin</label>
              <select name="groupeSanguin" defaultValue="">
                <option value="">Non renseigné</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className={styles.champ}><label>Contact d’urgence</label><input name="contactUrgence" /></div>
            <div className={styles.champ}><label>Téléphone d’urgence</label><input name="telephoneUrgence" /></div>
            <div className={styles.champ}><label>Allergies</label><textarea name="allergies" /></div>
            <div className={`${styles.champ} ${styles.champLarge}`}><label>Handicap ou besoin particulier</label><textarea name="handicap" /></div>
          </div>
        </div>
      </section>

      <div className={elevesStyles.barreValidation}>
        <span>
          Les champs marqués d’un astérisque sont obligatoires. Le dossier sera
          enregistré comme dossier d’{t.personne}.
        </span>
        <BoutonSoumission
          texte={`Enregistrer l’${t.personne}`}
          icone={<Save size={18} />}
        />
      </div>
    </form>
  );
}
