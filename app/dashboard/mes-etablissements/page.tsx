import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { listerEcolesAccessibles, obtenirEcoleActive } from "@/lib/multi-etablissement";
import { choisirEtablissement } from "./actions";
import styles from "./styles.module.css";

export default async function MesEtablissementsPage() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const [ecoles, active] = await Promise.all([
    listerEcolesAccessibles(),
    obtenirEcoleActive(),
  ]);

  return (
    <AdminShell utilisateur={utilisateur} titre="Mes établissements"
      description="Choisissez l'établissement sur lequel vous souhaitez travailler.">
      <div className={styles.grille}>
        {ecoles.map((ecole) => (
          <form action={choisirEtablissement} className={styles.carte} key={ecole.id}>
            <input type="hidden" name="ecole_id" value={ecole.id}/>
            <div>
              <span className={styles.code}>{ecole.code}</span>
              <h2>{ecole.nom}</h2>
              <p>{ecole.ville || "Ville non renseignée"}</p>
            </div>
            {active?.id === ecole.id ? (
              <button className={styles.actif} disabled>Établissement actif</button>
            ) : (
              <button type="submit">Travailler sur cet établissement</button>
            )}
          </form>
        ))}
      </div>
    </AdminShell>
  );
}
