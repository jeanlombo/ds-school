"use client";

import { useMemo, useState } from "react";
import { HeartPulse, Save, School, UserRound, UsersRound } from "lucide-react";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import PhotoEleveUpload from "@/components/eleves/PhotoEleveUpload";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import { creerEleve } from "../actions";

type ClasseOption = { id: number; nom: string; sectionNom: string };
type PromotionOption = {
  id: number; nom: string; code: string; cycleNom: string;
  departementNom: string; faculteNom: string;
};
type AnneeOption = { id: number; libelle: string; active: boolean };

type Props = {
  classes: ClasseOption[];
  promotions: PromotionOption[];
  annees: AnneeOption[];
  matricule: string;
  aujourdHui: string;
  typeEtablissement: string;
};

function normaliser(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function sectionSuperieure(nom: string) {
  const s = normaliser(nom);
  return s.includes("univers") || s.includes("institut superieur") || s.includes("enseignement superieur");
}

export default function FormulaireNouvelApprenant({
  classes, promotions, annees, matricule, aujourdHui, typeEtablissement,
}: Props) {
  const type = normaliser(typeEtablissement);
  const universitePure = type.includes("univers") || type.includes("institut superieur");
  const [mode, setMode] = useState<"scolaire"|"superieur">(universitePure ? "superieur" : "scolaire");
  const [classeId, setClasseId] = useState("");
  const [promotionId, setPromotionId] = useState("");

  const classesScolaires = useMemo(
    () => classes.filter(c => !sectionSuperieure(c.sectionNom)),
    [classes]
  );
  const t = mode === "superieur" ? {
    personne:"étudiant", personnes:"étudiants", structure:"promotion",
    structureMaj:"Promotion", periodeMaj:"Année académique",
    carte:"carte d’étudiant", provenance:"établissement / université de provenance"
  } : {
    personne:"élève", personnes:"élèves", structure:"classe",
    structureMaj:"Classe", periodeMaj:"Année scolaire",
    carte:"carte d’élève", provenance:"école / établissement de provenance"
  };

  return (
    <form action={creerEleve} className={elevesStyles.formulaireLong} encType="multipart/form-data">
      <input type="hidden" name="modeAcademique" value={mode} />

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div className={elevesStyles.titreSection}>
          <span><School /></span><div><h2>Type de dossier académique</h2>
          <p>Choisissez le niveau avant de compléter l’identification.</p></div>
        </div></div>
        <div className={styles.panneauCorps}>
          <div className={styles.formGrille}>
            <div className={`${styles.champ} ${styles.champLarge}`}>
              <label>Cycle / niveau d’enseignement *</label>
              <select value={mode} onChange={e => { setMode(e.target.value as "scolaire"|"superieur"); setClasseId(""); setPromotionId(""); }}>
                <option value="scolaire">Primaire / Secondaire / Humanités — Élève</option>
                <option value="superieur">Université / Institut supérieur — Étudiant</option>
              </select>
            </div>
          </div>
          <div className={styles.infoBandeau}>
            Le dossier sera traité comme <strong>{t.personne}</strong>. Les libellés, la structure académique et les documents s’adaptent à ce choix.
          </div>
        </div>
      </section>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div className={elevesStyles.titreSection}>
          <span><UserRound /></span><div><h2>Identification de l’{t.personne}</h2>
          <p>Identité officielle et photo utilisée sur la {t.carte}.</p></div>
        </div></div>
        <div className={styles.panneauCorps}>
          <PhotoEleveUpload />
          <div className={styles.formGrille}>
            <div className={styles.champ}><label>Matricule de l’{t.personne}</label><input name="matricule" defaultValue={matricule}/></div>
            <div className={styles.champ}><label>Numéro permanent</label><input name="numeroPermanent" placeholder="Facultatif"/></div>
            <div className={styles.champ}><label>Nom *</label><input name="nom" required/></div>
            <div className={styles.champ}><label>Postnom</label><input name="postnom"/></div>
            <div className={styles.champ}><label>Prénom *</label><input name="prenom" required/></div>
            <div className={styles.champ}><label>Sexe *</label><select name="sexe" required defaultValue=""><option value="">Sélectionner</option><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
            <div className={styles.champ}><label>Date de naissance *</label><input type="date" name="dateNaissance" required/></div>
            <div className={styles.champ}><label>Lieu de naissance</label><input name="lieuNaissance"/></div>
            <div className={styles.champ}><label>Nationalité</label><input name="nationalite" defaultValue="Congolaise"/></div>
            <div className={`${styles.champ} ${styles.champLarge}`}><label>Adresse</label><textarea name="adresse"/></div>
          </div>
        </div>
      </section>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div className={elevesStyles.titreSection}>
          <span><School /></span><div><h2>Informations académiques</h2>
          <p>{mode === "superieur" ? "Faculté, département et promotion de l’étudiant." : "Section et classe de l’élève."}</p></div>
        </div></div>
        <div className={styles.panneauCorps}><div className={styles.formGrille}>
          <div className={styles.champ}>
            <label>{t.periodeMaj} *</label>
            <select name="anneeScolaireId" required defaultValue={String(annees.find(a=>a.active)?.id || annees[0]?.id || "")}>
              {annees.map(a=><option key={a.id} value={a.id}>{a.libelle}{a.active ? " — active" : ""}</option>)}
            </select>
          </div>

          {mode === "scolaire" ? (
            <div className={styles.champ}>
              <label>Classe / section *</label>
              <select name="classeId" required value={classeId} onChange={e=>setClasseId(e.target.value)}>
                <option value="">Sélectionner</option>
                {classesScolaires.map(c=><option key={c.id} value={c.id}>{c.sectionNom} — {c.nom}</option>)}
              </select>
            </div>
          ) : (
            <div className={`${styles.champ} ${styles.champLarge}`}>
              <label>Promotion universitaire *</label>
              <select name="promotionId" required value={promotionId} onChange={e=>setPromotionId(e.target.value)}>
                <option value="">Sélectionner une promotion</option>
                {promotions.map(p=><option key={p.id} value={p.id}>{p.faculteNom} — {p.departementNom} — {p.cycleNom} — {p.nom}</option>)}
              </select>
              {!promotions.length && <small>Aucune promotion active. Configurez d’abord Structure universitaire.</small>}
            </div>
          )}

          <div className={styles.champ}><label>Date d’inscription</label><input type="date" name="dateInscription" defaultValue={aujourdHui}/></div>
          <div className={styles.champ}><label>Type d’admission</label><select name="typeAdmission" defaultValue="nouveau"><option value="nouveau">Nouveau / débutant</option><option value="ancien">Ancien / déjà inscrit</option><option value="transfert">Transfert</option></select></div>
          <div className={`${styles.champ} ${styles.champLarge}`}><label>{t.provenance}</label><input name="ancienneEcole" placeholder={`Nom de l’${t.provenance}`}/></div>
        </div></div>
      </section>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div className={elevesStyles.titreSection}>
          <span><UsersRound /></span><div><h2>{mode==="superieur" ? "Contacts / personnes de référence" : "Parents et tuteur"}</h2>
          <p>Informations de contact du dossier de l’{t.personne}.</p></div>
        </div></div>
        <div className={styles.panneauCorps}>
          <div className={elevesStyles.responsablesGrille}>
            {["pere","mere","tuteur"].map(typeContact=>(
              <fieldset key={typeContact} className={elevesStyles.responsable}>
                <legend>{typeContact==="pere"?"Père":typeContact==="mere"?"Mère":"Tuteur / contact"}</legend>
                <label>Nom complet<input name={`${typeContact}Nom`}/></label>
                <label>Téléphone<input name={`${typeContact}Telephone`}/></label>
                <label>E-mail<input type="email" name={`${typeContact}Email`}/></label>
                <label>Profession<input name={`${typeContact}Profession`}/></label>
                <label>Adresse<input name={`${typeContact}Adresse`}/></label>
              </fieldset>
            ))}
          </div>
          <div className={styles.champ}><label>Contact principal</label><select name="responsablePrincipal" defaultValue="tuteur"><option value="pere">Père</option><option value="mere">Mère</option><option value="tuteur">Tuteur / contact</option></select></div>
        </div>
      </section>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div className={elevesStyles.titreSection}>
          <span><HeartPulse /></span><div><h2>Informations médicales</h2><p>Données utiles en cas d’urgence concernant l’{t.personne}.</p></div>
        </div></div>
        <div className={styles.panneauCorps}><div className={styles.formGrille}>
          <div className={styles.champ}><label>Groupe sanguin</label><select name="groupeSanguin" defaultValue=""><option value="">Non renseigné</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g=><option key={g}>{g}</option>)}</select></div>
          <div className={styles.champ}><label>Contact d’urgence</label><input name="contactUrgence"/></div>
          <div className={styles.champ}><label>Téléphone d’urgence</label><input name="telephoneUrgence"/></div>
          <div className={styles.champ}><label>Allergies</label><textarea name="allergies"/></div>
          <div className={`${styles.champ} ${styles.champLarge}`}><label>Handicap ou besoin particulier</label><textarea name="handicap"/></div>
        </div></div>
      </section>

      <div className={elevesStyles.barreValidation}>
        <span>Le dossier sera enregistré comme dossier d’{t.personne}.</span>
        <BoutonSoumission texte={`Enregistrer l’${t.personne}`} icone={<Save size={18}/>}/>
      </div>
    </form>
  );
}
