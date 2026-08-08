import { redirect } from "next/navigation";
import { Building2, GraduationCap, School } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import styles from "@/components/admin/admin.module.css";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { modifierTypeEtablissement } from "./actions";

export const dynamic = "force-dynamic";

export default async function TypeEtablissement({
  searchParams,
}: {
  searchParams: Promise<{ succes?: string; erreur?: string }>;
}) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const query = await searchParams;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Type d’établissement"
      description="Choisissez le modèle académique chargé par DS School pour cet établissement."
    >
      {query.succes && (
        <div className={styles.message}>Configuration enregistrée avec succès.</div>
      )}
      {query.erreur && (
        <div className={styles.message}>Type d’établissement invalide.</div>
      )}

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}>
          <div>
            <h2>{ecole.nom}</h2>
            <p>Mode actuel : {ecole.typeEtablissement}</p>
          </div>
          <Building2 size={24} />
        </div>

        <form action={modifierTypeEtablissement} className={styles.panneauCorps}>
          <div className={styles.formGrille}>
            <div className={`${styles.champ} ${styles.champLarge}`}>
              <label>Type d’établissement *</label>
              <select name="typeEtablissement" defaultValue={ecole.typeEtablissement} required>
                <option value="SECONDAIRE">École secondaire</option>
                <option value="UNIVERSITE">Université / Institut supérieur</option>
                <option value="MIXTE">Structure mixte</option>
              </select>
            </div>
          </div>

          <div className={styles.deuxColonnes}>
            <article className={styles.panneau}>
              <div className={styles.panneauEntete}>
                <div><h2>Secondaire</h2><p>Classes, sections, périodes, bulletins et promotions.</p></div>
                <School size={22} />
              </div>
            </article>
            <article className={styles.panneau}>
              <div className={styles.panneauEntete}>
                <div><h2>Université</h2><p>Facultés, filières, promotions, semestres, UE, crédits et cours.</p></div>
                <GraduationCap size={22} />
              </div>
            </article>
          </div>

          <div className={styles.actions}>
            <BoutonSoumission texte="Enregistrer le type" />
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
