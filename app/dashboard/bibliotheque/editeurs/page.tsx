import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { ajouterEditeur } from "../actions";
import styles from "../bibliotheque.module.css";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ succes?: string; erreur?: string }> };

export default async function Page({ searchParams }: Props) {
  await exigerPermission("BIBLIOTHEQUE_EDITEURS_GERER");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const lignes = await prisma.$queryRaw<Array<{
    id: number; nom: string; pays: string | null; site_web: string | null;
  }>>`
    SELECT id, nom, pays, site_web
    FROM bibliotheque_editeurs
    WHERE ecole_id = ${ecole.id}
    ORDER BY nom
  `;

  return (
    <AdminShell utilisateur={utilisateur} titre="Éditeurs"
      description="Maisons d’édition et organismes producteurs.">
      {params.succes && <div className={`${styles.messages} ${styles.succes}`}>Éditeur enregistré.</div>}
      {params.erreur && <div className={`${styles.messages} ${styles.erreur}`}>Le nom est obligatoire.</div>}

      <section className={styles.panel}>
        <h2>Nouvel éditeur</h2>
        <form action={ajouterEditeur} className={styles.formulaire}>
          <label><span>Nom *</span><input name="nom" required /></label>
          <label><span>Pays</span><input name="pays" placeholder="RDC" /></label>
          <label className={styles.large}><span>Site web</span><input type="url" name="site_web" placeholder="https://..." /></label>
          <button type="submit">Enregistrer</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table><thead><tr><th>Éditeur</th><th>Pays</th><th>Site web</th></tr></thead>
          <tbody>{lignes.map(ligne => <tr key={ligne.id}>
            <td><strong>{ligne.nom}</strong></td><td>{ligne.pays ?? "—"}</td>
            <td>{ligne.site_web ? <a href={ligne.site_web} target="_blank" rel="noreferrer">{ligne.site_web}</a> : "—"}</td>
          </tr>)}</tbody></table>
        </div>
      </section>
    </AdminShell>
  );
}
