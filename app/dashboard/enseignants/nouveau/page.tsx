import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import admin from "@/components/admin/admin.module.css";
import styles from "@/components/enseignants/enseignants.module.css";
import PhotoEnseignantUpload from "@/components/enseignants/PhotoEnseignantUpload";
import { obtenirUtilisateurConnecte } from "@/lib/session";

import { creerEnseignant } from "../actions";

type Props = { searchParams: Promise<{ erreur?: string }> };

export default async function NouvelEnseignant({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const { erreur } = await searchParams;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouvel enseignant"
      description="Création du dossier administratif et de la carte professionnelle."
      action={
        <Link href="/dashboard/enseignants" className={admin.boutonSecondaire}>
          <ArrowLeft size={18} /> Retour
        </Link>
      }
    >
      {erreur && <div className={styles.alerte}>{erreur}</div>}

      <form action={creerEnseignant} className={styles.formulaire}>
        <section className={admin.panneau}>
          <div className={admin.panneauEntete}>
            <div>
              <h2>Photo professionnelle</h2>
              <p>Elle sera utilisée sur le profil et la carte.</p>
            </div>
          </div>
          <div className={admin.panneauCorps}>
            <PhotoEnseignantUpload />
          </div>
        </section>

        <BlocFormulaire />

        <div className={styles.barreActions}>
          <Link href="/dashboard/enseignants" className={admin.boutonSecondaire}>
            Annuler
          </Link>
          <button type="submit" className={admin.boutonPrimaire}>
            <Save size={18} /> Enregistrer
          </button>
        </div>
      </form>
    </AdminShell>
  );
}

function BlocFormulaire() {
  return (
    <section className={admin.panneau}>
      <div className={admin.panneauEntete}>
        <div>
          <h2>Informations de l’enseignant</h2>
          <p>Les champs marqués * sont obligatoires.</p>
        </div>
      </div>

      <div className={`${admin.panneauCorps} ${styles.grilleForm}`}>
        <label>Matricule<input name="matricule" placeholder="Automatique si vide" /></label>
        <label>Nom *<input name="nom" required /></label>
        <label>Postnom<input name="postnom" /></label>
        <label>Prénom *<input name="prenom" required /></label>

        <label>Sexe *
          <select name="sexe" required>
            <option value="">Choisir</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </label>

        <label>Date de naissance<input type="date" name="dateNaissance" /></label>
        <label>Lieu de naissance<input name="lieuNaissance" /></label>
        <label>Nationalité<input name="nationalite" defaultValue="Congolaise" /></label>

        <label>État civil
          <select name="etatCivil">
            <option value="">Non précisé</option>
            <option>Célibataire</option>
            <option>Marié(e)</option>
            <option>Veuf/Veuve</option>
            <option>Divorcé(e)</option>
          </select>
        </label>

        <label>Téléphone<input name="telephone" /></label>
        <label>Email<input type="email" name="email" /></label>
        <label className={styles.large}>Adresse<textarea name="adresse" rows={2} /></label>
        <label>Fonction<input name="fonction" defaultValue="Enseignant" /></label>
        <label>Spécialité<input name="specialite" placeholder="Mathématiques, Français..." /></label>
        <label>Grade<input name="grade" /></label>
        <label>Date d’engagement<input type="date" name="dateEngagement" /></label>

        <label>Type de pièce
          <select name="typePiece">
            <option value="">Choisir</option>
            <option>Carte d’identité</option>
            <option>Passeport</option>
            <option>Permis de conduire</option>
          </select>
        </label>

        <label>Numéro de pièce<input name="numeroPiece" /></label>

        <label>Carte RFID/NFC
          <input
            name="numeroCarteRfid"
            placeholder="Optionnel — laisser vide si aucune carte"
            autoComplete="off"
          />
        </label>
      </div>
    </section>
  );
}
