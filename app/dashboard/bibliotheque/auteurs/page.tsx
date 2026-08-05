import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { ajouterAuteur } from "../actions";
import styles from "../bibliotheque.module.css";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ succes?: string; erreur?: string }> };

export default async function Page({ searchParams }: Props) {
  await exigerPermission("BIBLIOTHEQUE_AUTEURS_GERER");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const lignes = await prisma.$queryRaw<Array<{
    id: number; nom: string; prenom: string | null; biographie: string | null;
  }>>`
    SELECT id, nom, prenom, biographie
    FROM bibliotheque_auteurs
    WHERE ecole_id = ${ecole.id}
    ORDER BY nom, prenom
  `;

  return (
    <AdminShell utilisateur={utilisateur} titre="Auteurs"
      description="Répertoire des auteurs des ressources.">
      {params.succes && <div className={`${styles.messages} ${styles.succes}`}>Auteur enregistré.</div>}
      {params.erreur && <div className={`${styles.messages} ${styles.erreur}`}>Le nom est obligatoire.</div>}

      <section className={styles.panel}>
        <h2>Nouvel auteur</h2>
        <form action={ajouterAuteur} className={styles.formulaire}>
          <label><span>Nom *</span><input name="nom" required /></label>
          <label><span>Prénom</span><input name="prenom" /></label>
          <label className={styles.large}><span>Biographie</span><textarea name="biographie" /></label>
          <button type="submit">Enregistrer</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table><thead><tr><th>Auteur</th><th>Biographie</th></tr></thead>
          <tbody>{lignes.map(ligne => <tr key={ligne.id}>
            <td><strong>{ligne.nom} {ligne.prenom ?? ""}</strong></td>
            <td>{ligne.biographie ?? "—"}</td>
          </tr>)}</tbody></table>
        </div>
      </section>
    </AdminShell>
  );
}
