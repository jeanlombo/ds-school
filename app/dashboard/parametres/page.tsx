import { redirect } from "next/navigation";
import { Building2, ImageIcon, MapPin } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import { enregistrerParametres } from "./actions";
import styles from "@/components/admin/admin.module.css";

export default async function Parametres({ searchParams }: { searchParams: Promise<{ succes?: string; erreur?: string }> }) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const query = await searchParams;

  return <AdminShell utilisateur={utilisateur} titre="Paramètres de l’établissement" description="Configurez l’identité officielle, le type d’établissement et la terminologie académique.">
    {query.succes && <div className={styles.message}>Les informations de l’établissement ont été enregistrées avec succès.</div>}
    {query.erreur && <div className={styles.message}>Le nom et le code de l’établissement sont obligatoires.</div>}
    <div className={styles.deuxColonnes}>
      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div><h2>Identité de l’établissement</h2><p>Ces informations apparaîtront sur les documents officiels.</p></div><Building2 size={22}/></div>
        <form action={enregistrerParametres} className={styles.panneauCorps}>
          <div className={styles.formGrille}>
            <div className={styles.champ}><label>Nom de l’établissement *</label><input name="nom" defaultValue={ecole.nom} required /></div>
            <div className={styles.champ}><label>Code *</label><input name="code" defaultValue={ecole.code} required /></div><div className={styles.champ}><label>Type d’établissement *</label><select name="typeEtablissement" defaultValue={ecole.typeEtablissement || "MIXTE"}><option value="PRIMAIRE">Primaire</option><option value="SECONDAIRE">Secondaire</option><option value="HUMANITES">Humanités</option><option value="UNIVERSITE">Université</option><option value="INSTITUT_SUPERIEUR">Institut supérieur</option><option value="MIXTE">Mixte — plusieurs sections</option></select></div>
<div className={styles.champ}><label>Terminologie des apprenants</label><select name="terminologieApprenant" defaultValue={ecole.terminologieApprenant || "AUTOMATIQUE"}><option value="AUTOMATIQUE">Automatique selon la section</option><option value="ELEVE">Toujours « Élève »</option><option value="ETUDIANT">Toujours « Étudiant »</option></select></div>
            <div className={`${styles.champ} ${styles.champLarge}`}><label>Slogan</label><input name="slogan" defaultValue={ecole.slogan || ""}/></div>
            <div className={`${styles.champ} ${styles.champLarge}`}><label>URL du logo</label><input name="logo" type="url" defaultValue={ecole.logo || ""} placeholder="https://..."/></div>
            <div className={`${styles.champ} ${styles.champLarge}`}><label>Adresse</label><textarea name="adresse" defaultValue={ecole.adresse || ""}/></div>
            <div className={styles.champ}><label>Ville</label><input name="ville" defaultValue={ecole.ville || ""}/></div>
            <div className={styles.champ}><label>Pays</label><input name="pays" defaultValue={ecole.pays || ""}/></div>
            <div className={styles.champ}><label>Téléphone</label><input name="telephone" defaultValue={ecole.telephone || ""}/></div>
            <div className={styles.champ}><label>E-mail</label><input name="email" type="email" defaultValue={ecole.email || ""}/></div>
            <div className={styles.champ}><label>Site Web</label><input name="siteWeb" defaultValue={ecole.siteWeb || ""}/></div>
            <div className={styles.champ}><label>Devise principale</label><select name="devise" defaultValue={ecole.devise}><option value="CDF">CDF — Franc congolais</option><option value="USD">USD — Dollar américain</option><option value="EUR">EUR — Euro</option></select></div>
            <div className={styles.champ}><label>Directeur / Responsable</label><input name="directeur" defaultValue={ecole.directeur || ""}/></div>
            <div className={styles.champ}><label>Boîte postale</label><input name="boitePostale" defaultValue={ecole.boitePostale || ""}/></div>
          </div>
          <div className={styles.actions}><BoutonSoumission texte="Enregistrer les paramètres"/></div>
        </form>
      </section>
      <aside className={styles.panneau}>
        <div className={styles.panneauEntete}><div><h2>Aperçu institutionnel</h2><p>Identité visible dans le système.</p></div><ImageIcon size={22}/></div>
        <div className={styles.panneauCorps}>
          <div className={styles.logoApercu}>{ecole.logo ? <img src={ecole.logo} alt="Logo de l’établissement"/> : <Building2 size={43}/>}</div>
          <h2>{ecole.nom}</h2><p>{ecole.slogan || "Votre slogan apparaîtra ici."}</p>
          <div className={styles.infoBandeau}><MapPin size={16}/> {ecole.adresse || "Adresse non renseignée"}{ecole.ville ? `, ${ecole.ville}` : ""}</div>
          <p><strong>Code :</strong> {ecole.code}</p><p><strong>Devise :</strong> {ecole.devise}</p><p><strong>Contact :</strong> {ecole.telephone || "Non renseigné"}</p>
        </div>
      </aside>
    </div>
  </AdminShell>;
}
