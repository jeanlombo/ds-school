import { redirect } from "next/navigation";
import {
  Building2,
  ImageIcon,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import LogoEcoleUpload from "./LogoEcoleUpload";
import { enregistrerParametres } from "./actions";
import styles from "./parametres.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

function messageErreur(code?: string): string | null {
  switch (code) {
    case "champs":
      return "Le nom et le code de l’établissement sont obligatoires.";
    case "logo_format":
      return "Le logo doit être au format JPG, JPEG, PNG ou WEBP.";
    case "logo_taille":
      return "Le logo ne doit pas dépasser 5 Mo.";
    case "logo_upload":
      return "Le logo n’a pas pu être enregistré. Réessayez.";
    default:
      return code ? "Une erreur a empêché l’enregistrement." : null;
  }
}

export default async function Parametres({
  searchParams,
}: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const query = await searchParams;
  const erreur = messageErreur(query.erreur);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Paramètres de l’établissement"
      description="Configurez l’identité officielle et les coordonnées de votre école."
    >
      {query.succes === "1" && (
        <div className={styles.succes}>
          <ShieldCheck size={19} />
          Les informations de l’établissement ont été enregistrées avec succès.
        </div>
      )}

      {erreur && (
        <div className={styles.erreur}>
          {erreur}
        </div>
      )}

      <div className={styles.deuxColonnes}>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}>
            <div>
              <span>IDENTITÉ OFFICIELLE</span>
              <h2>Identité de l’école</h2>
              <p>
                Ces informations apparaîtront sur les documents officiels.
              </p>
            </div>

            <Building2 size={24} />
          </div>

          <form
            action={enregistrerParametres}
            className={styles.panneauCorps}
          >
            <div className={styles.formGrille}>
              <div className={styles.champ}>
                <label>Nom de l’établissement *</label>
                <input
                  name="nom"
                  defaultValue={ecole.nom}
                  required
                />
              </div>

              <div className={styles.champ}>
                <label>Code *</label>
                <input
                  name="code"
                  defaultValue={ecole.code}
                  required
                />
              </div>

              <div
                className={`${styles.champ} ${styles.champLarge}`}
              >
                <label>Slogan</label>
                <input
                  name="slogan"
                  defaultValue={ecole.slogan || ""}
                />
              </div>

              <div className={styles.champLarge}>
                <LogoEcoleUpload
                  logoActuel={ecole.logo || null}
                  nomEcole={ecole.nom}
                />
              </div>

              <div
                className={`${styles.champ} ${styles.champLarge}`}
              >
                <label>Adresse</label>
                <textarea
                  name="adresse"
                  defaultValue={ecole.adresse || ""}
                />
              </div>

              <div className={styles.champ}>
                <label>Ville</label>
                <input
                  name="ville"
                  defaultValue={ecole.ville || ""}
                />
              </div>

              <div className={styles.champ}>
                <label>Pays</label>
                <input
                  name="pays"
                  defaultValue={ecole.pays || ""}
                />
              </div>

              <div className={styles.champ}>
                <label>Téléphone</label>
                <input
                  name="telephone"
                  defaultValue={ecole.telephone || ""}
                />
              </div>

              <div className={styles.champ}>
                <label>E-mail</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={ecole.email || ""}
                />
              </div>

              <div className={styles.champ}>
                <label>Site Web</label>
                <input
                  name="siteWeb"
                  defaultValue={ecole.siteWeb || ""}
                  placeholder="https://..."
                />
              </div>

              <div className={styles.champ}>
                <label>Devise principale</label>
                <select
                  name="devise"
                  defaultValue={ecole.devise}
                >
                  <option value="CDF">
                    CDF — Franc congolais
                  </option>
                  <option value="USD">
                    USD — Dollar américain
                  </option>
                  <option value="EUR">
                    EUR — Euro
                  </option>
                </select>
              </div>

              <div className={styles.champ}>
                <label>Directeur / Responsable</label>
                <input
                  name="directeur"
                  defaultValue={ecole.directeur || ""}
                />
              </div>

              <div className={styles.champ}>
                <label>Boîte postale</label>
                <input
                  name="boitePostale"
                  defaultValue={ecole.boitePostale || ""}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <BoutonSoumission texte="Enregistrer les paramètres" />
            </div>
          </form>
        </section>

        <aside className={styles.panneau}>
          <div className={styles.panneauEntete}>
            <div>
              <span>APERÇU</span>
              <h2>Aperçu institutionnel</h2>
              <p>Identité visible dans le système.</p>
            </div>

            <ImageIcon size={24} />
          </div>

          <div className={styles.apercu}>
            <div className={styles.logoApercu}>
              {ecole.logo ? (
                <img
                  src={ecole.logo}
                  alt={`Logo de ${ecole.nom}`}
                />
              ) : (
                <Building2 size={50} />
              )}
            </div>

            <h2>{ecole.nom}</h2>
            <p className={styles.slogan}>
              {ecole.slogan ||
                "Votre slogan apparaîtra ici."}
            </p>

            <div className={styles.infoBandeau}>
              <MapPin size={17} />
              <span>
                {ecole.adresse || "Adresse non renseignée"}
                {ecole.ville ? `, ${ecole.ville}` : ""}
              </span>
            </div>

            <dl className={styles.details}>
              <div>
                <dt>Code</dt>
                <dd>{ecole.code}</dd>
              </div>
              <div>
                <dt>Devise</dt>
                <dd>{ecole.devise}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  {ecole.telephone || "Non renseigné"}
                </dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>
                  {ecole.directeur || "Non renseigné"}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
