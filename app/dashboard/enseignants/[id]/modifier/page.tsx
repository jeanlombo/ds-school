import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import admin from "@/components/admin/admin.module.css";
import styles from "@/components/enseignants/enseignants.module.css";
import PhotoEnseignantUpload from "@/components/enseignants/PhotoEnseignantUpload";
import { obtenirUtilisateurConnecte } from "@/lib/session";

import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { modifierEnseignant } from "../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string }> };
const d = (v: Date | null) => v ? v.toISOString().slice(0,10) : "";

export default async function ModifierEnseignant({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte(); if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole(); const { id } = await params; const { erreur } = await searchParams;
  const e = await prisma.enseignant.findFirst({ where: { id: Number(id), ecoleId: ecole.id } });
  if (!e) redirect("/dashboard/enseignants");

  return <AdminShell utilisateur={utilisateur} titre="Modifier l’enseignant" description={`${e.matricule} · ${e.nom} ${e.prenom}`}
    action={<Link href={`/dashboard/enseignants/${e.id}`} className={admin.boutonSecondaire}><ArrowLeft size={18}/> Profil</Link>}>
    {erreur && <div className={styles.alerte}>{erreur}</div>}
    <form action={modifierEnseignant} className={styles.formulaire}>
      <input type="hidden" name="id" value={e.id}/>
      <section className={admin.panneau}><div className={admin.panneauEntete}><div><h2>Photo professionnelle</h2></div></div><div className={admin.panneauCorps}><PhotoEnseignantUpload photoActuelle={e.photo} nom={`${e.prenom} ${e.nom}`}/></div></section>
      <section className={admin.panneau}><div className={admin.panneauEntete}><div><h2>Informations</h2></div></div><div className={`${admin.panneauCorps} ${styles.grilleForm}`}>
        <label>Nom *<input name="nom" defaultValue={e.nom} required/></label><label>Postnom<input name="postnom" defaultValue={e.postnom || ""}/></label><label>Prénom *<input name="prenom" defaultValue={e.prenom} required/></label>
        <label>Sexe *<select name="sexe" defaultValue={e.sexe} required><option value="M">Masculin</option><option value="F">Féminin</option></select></label>
        <label>Date de naissance<input type="date" name="dateNaissance" defaultValue={d(e.dateNaissance)}/></label><label>Lieu de naissance<input name="lieuNaissance" defaultValue={e.lieuNaissance || ""}/></label>
        <label>Nationalité<input name="nationalite" defaultValue={e.nationalite || ""}/></label><label>État civil<input name="etatCivil" defaultValue={e.etatCivil || ""}/></label>
        <label>Téléphone<input name="telephone" defaultValue={e.telephone || ""}/></label><label>Email<input type="email" name="email" defaultValue={e.email || ""}/></label>
        <label className={styles.large}>Adresse<textarea name="adresse" rows={2} defaultValue={e.adresse || ""}/></label>
        <label>Fonction<input name="fonction" defaultValue={e.fonction}/></label><label>Spécialité<input name="specialite" defaultValue={e.specialite || ""}/></label>
        <label>Grade<input name="grade" defaultValue={e.grade || ""}/></label><label>Date d’engagement<input type="date" name="dateEngagement" defaultValue={d(e.dateEngagement)}/></label>
        <label>Type de pièce<input name="typePiece" defaultValue={e.typePiece || ""}/></label><label>Numéro de pièce<input name="numeroPiece" defaultValue={e.numeroPiece || ""}/></label>
        <label>Carte RFID/NFC<input name="numeroCarteRfid" defaultValue={e.numeroCarteRfid || ""}/></label>
      </div></section>
      <div className={styles.barreActions}><Link href={`/dashboard/enseignants/${e.id}`} className={admin.boutonSecondaire}>Annuler</Link><button className={admin.boutonPrimaire}><Save size={18}/> Enregistrer</button></div>
    </form>
  </AdminShell>;
}
