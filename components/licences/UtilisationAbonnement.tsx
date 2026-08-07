import { AlertTriangle, HardDrive, Users, UserRoundCheck, UsersRound } from "lucide-react";
import type { UtilisationAbonnement as Donnees } from "@/lib/licence";
import styles from "./licences.module.css";

function Ligne({ label, utilise, maximum, pourcentage, illimite, icone: Icone }: {
  label: string; utilise: number | string; maximum: number | string; pourcentage: number; illimite?: boolean; icone: typeof UsersRound;
}) {
  const niveau = pourcentage >= 100 ? styles.rouge : pourcentage >= 90 ? styles.orange : styles.bleu;
  return <div className={styles.ligne}>
    <div className={styles.ligneEntete}><span><Icone size={17}/>{label}</span><strong>{utilise} / {illimite ? "Illimité" : maximum}</strong></div>
    {!illimite && <div className={styles.barre}><i className={niveau} style={{width:`${Math.min(100,pourcentage)}%`}}/></div>}
    <small>{illimite ? "Quota illimité" : `${pourcentage}% utilisé`}</small>
  </div>;
}

export default function UtilisationAbonnement({ donnees }: { donnees: Donnees }) {
  const alerte = donnees.eleves.avertissement || donnees.enseignants.avertissement || donnees.utilisateurs.avertissement || donnees.stockage.avertissement;
  return <section className={styles.carte}>
    <div className={styles.titre}><div><span>ABONNEMENT</span><h2>Utilisation de l'abonnement</h2></div><b>{donnees.licence.formule || "Standard"}</b></div>
    <div className={styles.grille}>
      <Ligne label="Élèves" utilise={donnees.eleves.utilise} maximum={donnees.eleves.maximum} pourcentage={donnees.eleves.pourcentage} illimite={donnees.eleves.illimite} icone={UsersRound}/>
      <Ligne label="Enseignants" utilise={donnees.enseignants.utilise} maximum={donnees.enseignants.maximum} pourcentage={donnees.enseignants.pourcentage} illimite={donnees.enseignants.illimite} icone={UserRoundCheck}/>
      <Ligne label="Utilisateurs" utilise={donnees.utilisateurs.utilise} maximum={donnees.utilisateurs.maximum} pourcentage={donnees.utilisateurs.pourcentage} illimite={donnees.utilisateurs.illimite} icone={Users}/>
      <Ligne label="Stockage" utilise={`${donnees.stockage.utiliseGo} Go`} maximum={`${donnees.stockage.maximumGo} Go`} pourcentage={donnees.stockage.pourcentage} illimite={donnees.stockage.illimite} icone={HardDrive}/>
    </div>
    {alerte && <div className={styles.alerte}><AlertTriangle size={17}/> Attention : votre établissement approche ou a atteint une limite de son abonnement. Contactez DIGIGROUPE pour augmenter la capacité.</div>}
  </section>;
}
