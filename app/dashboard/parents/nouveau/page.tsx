import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { creerParent } from "../actions";
import styles from "../parents.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ erreur?: string }>;
};

export default async function NouveauParent({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const params = await searchParams;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouveau compte parent"
      description="Créez la fiche du parent et générez immédiatement son accès sécurisé."
    >
      <RetourDashboard />

      {params.erreur && (
        <div className={styles.erreur}>
          Veuillez compléter le nom, le prénom et le téléphone principal.
        </div>
      )}

      <section className={styles.heroMini}>
        <div>
          <span>Relation école-famille</span>
          <h2>Créer un parent et son compte d’accès</h2>
          <p>
            Le mot de passe temporaire devra être modifié lors de la première
            connexion au futur Portail Parents.
          </p>
        </div>
        <UserPlus size={68} />
      </section>

      <form action={creerParent} className={styles.formulaire}>
        <section className={styles.panel}>
          <h2>Informations personnelles</h2>

          <div className={styles.grilleFormulaire}>
            <label>
              <span>Nom *</span>
              <input name="nom" required />
            </label>

            <label>
              <span>Postnom</span>
              <input name="postnom" />
            </label>

            <label>
              <span>Prénom *</span>
              <input name="prenom" required />
            </label>

            <label>
              <span>Sexe</span>
              <select name="sexe" defaultValue="">
                <option value="">Non précisé</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </label>

            <label>
              <span>Date de naissance</span>
              <input type="date" name="date_naissance" />
            </label>

            <label>
              <span>Nationalité</span>
              <input name="nationalite" defaultValue="Congolaise" />
            </label>

            <label>
              <span>Profession</span>
              <input name="profession" />
            </label>

            <label>
              <span>Employeur</span>
              <input name="employeur" />
            </label>

            <label>
              <span>Fonction</span>
              <input name="fonction" />
            </label>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Coordonnées</h2>

          <div className={styles.grilleFormulaire}>
            <label>
              <span>Téléphone principal *</span>
              <input name="telephone_principal" required placeholder="+243..." />
            </label>

            <label>
              <span>Téléphone secondaire</span>
              <input name="telephone_secondaire" />
            </label>

            <label>
              <span>WhatsApp</span>
              <input name="whatsapp" placeholder="+243..." />
            </label>

            <label>
              <span>Email</span>
              <input type="email" name="email" />
            </label>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Adresse</h2>

          <div className={styles.grilleFormulaire}>
            <label>
              <span>Province</span>
              <input name="province" />
            </label>

            <label>
              <span>Ville</span>
              <input name="ville" />
            </label>

            <label>
              <span>Commune</span>
              <input name="commune" />
            </label>

            <label>
              <span>Quartier</span>
              <input name="quartier" />
            </label>

            <label>
              <span>Avenue</span>
              <input name="avenue" />
            </label>

            <label>
              <span>Numéro</span>
              <input name="numero_adresse" />
            </label>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Identité et accès</h2>

          <div className={styles.grilleFormulaire}>
            <label>
              <span>Type de pièce</span>
              <select name="piece_identite_type" defaultValue="">
                <option value="">Non précisé</option>
                <option value="CARTE_ELECTEUR">Carte d’électeur</option>
                <option value="PASSEPORT">Passeport</option>
                <option value="PERMIS">Permis de conduire</option>
                <option value="AUTRE">Autre</option>
              </select>
            </label>

            <label>
              <span>Numéro de pièce</span>
              <input name="piece_identite_numero" />
            </label>

            <label>
              <span>Identifiant souhaité</span>
              <input name="identifiant" placeholder="Généré automatiquement si vide" />
            </label>

            <label>
              <span>Mot de passe temporaire</span>
              <input
                name="mot_de_passe_temporaire"
                placeholder="Généré automatiquement si vide"
              />
            </label>
          </div>

          <label className={styles.case}>
            <input type="checkbox" name="actif" defaultChecked />
            <span>Activer immédiatement le compte parent</span>
          </label>
        </section>

        <div className={styles.actionsFinales}>
          <button type="submit" className={styles.primaire}>
            Créer le parent et le compte
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
