import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { ajouterCategorie } from "../actions";
import styles from "../bibliotheque.module.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ succes?: string; erreur?: string }> };

export default async function Page({ searchParams }: Props) {
  await exigerPermission("BIBLIOTHEQUE_CATEGORIES_GERER");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const lignes = await prisma.$queryRaw<Array<{
    id: number; nom: string; description: string | null; actif: number;
  }>>`
    SELECT id, nom, description, actif
    FROM bibliotheque_categories
    WHERE ecole_id = ${ecole.id}
    ORDER BY nom ASC
  `;

  return (
    <AdminShell utilisateur={utilisateur} titre="Catégories de la bibliothèque"
      description="Classez les ressources par domaine ou usage.">
      {params.succes && <div className={`${styles.messages} ${styles.succes}`}>Catégorie enregistrée.</div>}
      {params.erreur && <div className={`${styles.messages} ${styles.erreur}`}>Le nom est obligatoire.</div>}

      <section className={styles.panel}>
        <h2>Nouvelle catégorie</h2>
        <form action={ajouterCategorie} className={styles.formulaire}>
          <label><span>Nom *</span><input name="nom" required placeholder="Mathématiques" /></label>
          <label><span>Description</span><input name="description" placeholder="Livres et ressources de mathématiques" /></label>
          <button type="submit">Enregistrer</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table><thead><tr><th>Nom</th><th>Description</th><th>Statut</th></tr></thead>
          <tbody>{lignes.map(ligne => <tr key={ligne.id}>
            <td><strong>{ligne.nom}</strong></td>
            <td>{ligne.description ?? "—"}</td>
            <td><span className={styles.badge}>{ligne.actif ? "ACTIF" : "INACTIF"}</span></td>
          </tr>)}</tbody></table>
        </div>
      </section>
    </AdminShell>
  );
}
