import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, HeartPulse, Save, School, UserRound, UsersRound } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import PhotoEleveUpload from "@/components/eleves/PhotoEleveUpload";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import { creerEleve } from "../actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NouvelEleve({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte(); if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const erreur = typeof params.erreur === "string" ? params.erreur : "";
  const [classes, annees, compteur] = await Promise.all([
    prisma.classe.findMany({ where: { ecoleId: ecole.id, statut: "active" }, include: { section: true }, orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }] }),
    prisma.anneeScolaire.findMany({ where: { ecoleId: ecole.id, statut: { not: "cloturee" } }, orderBy: { dateDebut: "desc" } }),
    prisma.eleve.count({ where: { ecoleId: ecole.id } }),
  ]);
  if (!classes.length || !annees.length) return <AdminShell utilisateur={utilisateur} titre="Nouvelle inscription" description="Le socle académique doit être prêt avant l’inscription."><div className={styles.infoBandeau}>Créez au moins une classe et une année scolaire ouverte avant d’inscrire un élève.</div><Link className={styles.boutonPrimaire} href="/dashboard/classes">Configurer les classes</Link></AdminShell>;
  const matricule = `${ecole.code}-${new Date().getFullYear()}-${String(compteur + 1).padStart(5, "0")}`;
  const aujourdHui = new Date().toISOString().slice(0,10);

  return <AdminShell utilisateur={utilisateur} titre="Nouvelle inscription" description="Créez le dossier scolaire, familial et médical de l’élève." action={<Link href="/dashboard/eleves" className={styles.boutonSecondaire}><ArrowLeft size={18}/> Retour à la liste</Link>}>
    {erreur && <div className={elevesStyles.erreur}>{erreur}</div>}
    <form action={creerEleve} className={elevesStyles.formulaireLong} encType="multipart/form-data">
      <section className={styles.panneau}><div className={styles.panneauEntete}><div className={elevesStyles.titreSection}><span><UserRound/></span><div><h2>Informations personnelles</h2><p>Identité officielle de l’élève et photo utilisée sur la carte scolaire.</p></div></div></div><div className={styles.panneauCorps}>
        <PhotoEleveUpload />
        <div className={styles.formGrille}>
        <div className={styles.champ}><label>Matricule</label><input name="matricule" defaultValue={matricule}/></div>
        <div className={styles.champ}><label>Numéro permanent</label><input name="numeroPermanent" placeholder="Facultatif"/></div>
        <div className={styles.champ}><label>Nom *</label><input name="nom" required/></div>
        <div className={styles.champ}><label>Postnom</label><input name="postnom"/></div>
        <div className={styles.champ}><label>Prénom *</label><input name="prenom" required/></div>
        <div className={styles.champ}><label>Sexe *</label><select name="sexe" required><option value="">Sélectionner</option><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
        <div className={styles.champ}><label>Date de naissance *</label><input type="date" name="dateNaissance" required/></div>
        <div className={styles.champ}><label>Lieu de naissance</label><input name="lieuNaissance"/></div>
        <div className={styles.champ}><label>Nationalité</label><input name="nationalite" defaultValue="Congolaise"/></div>
        <div className={`${styles.champ} ${styles.champLarge}`}><label>Adresse</label><textarea name="adresse"/></div>
      </div></div></section>

      <section className={styles.panneau}><div className={styles.panneauEntete}><div className={elevesStyles.titreSection}><span><School/></span><div><h2>Informations scolaires</h2><p>Affectation à la classe et à l’année scolaire.</p></div></div></div><div className={styles.panneauCorps}><div className={styles.formGrille}>
        <div className={styles.champ}><label>Année scolaire *</label><select name="anneeScolaireId" required defaultValue={annees.find(a=>a.active)?.id || annees[0].id}>{annees.map(a=><option key={a.id} value={a.id}>{a.libelle}{a.active ? " — active" : ""}</option>)}</select></div>
        <div className={styles.champ}><label>Classe *</label><select name="classeId" required defaultValue=""><option value="">Sélectionner une classe</option>{classes.map(c=><option key={c.id} value={c.id}>{c.section.nom} — {c.nom}</option>)}</select></div>
        <div className={styles.champ}><label>Date d’inscription</label><input type="date" name="dateInscription" defaultValue={aujourdHui}/></div>
        <div className={styles.champ}><label>Type d’admission</label><select name="typeAdmission" defaultValue="nouveau"><option value="nouveau">Nouveau / débutant</option><option value="ancien">Ancien élève</option><option value="transfert">Transfert</option></select></div>
        <div className={`${styles.champ} ${styles.champLarge}`}><label>École de provenance</label><input name="ancienneEcole" placeholder="Nom de l’établissement précédent"/></div>
      </div></div></section>

      <section className={styles.panneau}><div className={styles.panneauEntete}><div className={elevesStyles.titreSection}><span><UsersRound/></span><div><h2>Parents et tuteur</h2><p>Enregistrez au moins un responsable joignable.</p></div></div></div><div className={styles.panneauCorps}>
        <div className={elevesStyles.responsablesGrille}>{["pere","mere","tuteur"].map((type)=><fieldset key={type} className={elevesStyles.responsable}><legend>{type === "pere" ? "Père" : type === "mere" ? "Mère" : "Tuteur"}</legend><label>Nom complet<input name={`${type}Nom`}/></label><label>Téléphone<input name={`${type}Telephone`}/></label><label>E-mail<input type="email" name={`${type}Email`}/></label><label>Profession<input name={`${type}Profession`}/></label><label>Adresse<input name={`${type}Adresse`}/></label></fieldset>)}</div>
        <div className={styles.champ}><label>Responsable principal</label><select name="responsablePrincipal" defaultValue="tuteur"><option value="pere">Père</option><option value="mere">Mère</option><option value="tuteur">Tuteur</option></select></div>
      </div></section>

      <section className={styles.panneau}><div className={styles.panneauEntete}><div className={elevesStyles.titreSection}><span><HeartPulse/></span><div><h2>Informations médicales</h2><p>Données utiles en cas d’urgence.</p></div></div></div><div className={styles.panneauCorps}><div className={styles.formGrille}>
        <div className={styles.champ}><label>Groupe sanguin</label><select name="groupeSanguin" defaultValue=""><option value="">Non renseigné</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g=><option key={g}>{g}</option>)}</select></div>
        <div className={styles.champ}><label>Contact d’urgence</label><input name="contactUrgence"/></div>
        <div className={styles.champ}><label>Téléphone d’urgence</label><input name="telephoneUrgence"/></div>
        <div className={styles.champ}><label>Allergies</label><textarea name="allergies"/></div>
        <div className={`${styles.champ} ${styles.champLarge}`}><label>Handicap ou besoin particulier</label><textarea name="handicap"/></div>
      </div></div></section>
      <div className={elevesStyles.barreValidation}><span>Les champs marqués d’un astérisque sont obligatoires.</span><BoutonSoumission texte="Enregistrer l’élève" icone={<Save size={18}/>}/></div>
    </form>
  </AdminShell>;
}
