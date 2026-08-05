import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../bibliotheque.module.css";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ q?: string; type?: string }> };

export default async function Page({ searchParams }: Props) {
  await exigerPermission("BIBLIOTHEQUE_RESSOURCES_VOIR");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const type = String(params.type ?? "").trim();

  const lignes = await prisma.$queryRaw<Array<{
    id: number; code_ressource: string; titre: string; type_ressource: string;
    url_couverture: string | null; categorie: string | null; auteur: string | null;
    classe: string | null; matiere: string | null; statut: string;
  }>>`
    SELECT
      r.id, r.code_ressource, r.titre, r.type_ressource, r.url_couverture,
      c.nom AS categorie,
      CONCAT_WS(' ', a.nom, a.prenom) AS auteur,
      cl.nom AS classe,
      m.nom AS matiere,
      r.statut
    FROM bibliotheque_ressources r
    LEFT JOIN bibliotheque_categories c ON c.id = r.categorie_id
    LEFT JOIN bibliotheque_auteurs a ON a.id = r.auteur_id
    LEFT JOIN classes cl ON cl.id = r.classe_id
    LEFT JOIN matieres m ON m.id = r.matiere_id
    WHERE r.ecole_id = ${ecole.id}
      AND (
        ${q} = ''
        OR r.titre LIKE CONCAT('%', ${q}, '%')
        OR r.code_ressource LIKE CONCAT('%', ${q}, '%')
        OR r.isbn LIKE CONCAT('%', ${q}, '%')
        OR r.mots_cles LIKE CONCAT('%', ${q}, '%')
      )
      AND (${type} = '' OR r.type_ressource = ${type})
    ORDER BY r.created_at DESC
    LIMIT 500
  `;

  return (
    <AdminShell utilisateur={utilisateur} titre="Catalogue de la bibliothèque"
      description="Recherchez les livres et ressources pédagogiques."
      action={<Link href="/dashboard/bibliotheque/ressources/nouveau" className={styles.bouton}><Plus size={18}/>Nouvelle ressource</Link>}>
      <section className={styles.panel}>
        <form className={styles.filtres}>
          <label><Search size={16}/><input name="q" defaultValue={q} placeholder="Titre, code, ISBN ou mot-clé..." /></label>
          <select name="type" defaultValue={type}>
            <option value="">Tous les types</option>
            <option value="LIVRE_PHYSIQUE">Livre physique</option>
            <option value="LIVRE_NUMERIQUE">Livre numérique</option>
            <option value="COURS">Cours</option>
            <option value="EXERCICE">Exercice</option>
            <option value="EXAMEN">Examen</option>
            <option value="CORRIGE">Corrigé</option>
            <option value="VIDEO">Vidéo</option>
            <option value="AUDIO">Audio</option>
            <option value="DOCUMENT_OFFICIEL">Document officiel</option>
          </select>
          <button type="submit">Rechercher</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table><thead><tr><th>Couverture</th><th>Ressource</th><th>Type</th><th>Catégorie</th><th>Classe / Matière</th><th>Statut</th><th>Action</th></tr></thead>
          <tbody>{lignes.map(ligne => <tr key={ligne.id}>
            <td>{ligne.url_couverture ? <img src={ligne.url_couverture} alt="" className={styles.couverture}/> : "—"}</td>
            <td><strong>{ligne.titre}</strong><small>{ligne.code_ressource} · {ligne.auteur || "Auteur non défini"}</small></td>
            <td>{ligne.type_ressource}</td><td>{ligne.categorie ?? "—"}</td>
            <td>{ligne.classe ?? "Toutes"}<small>{ligne.matiere ?? "Toutes les matières"}</small></td>
            <td><span className={`${styles.badge} ${ligne.statut === "ARCHIVE" ? styles.badgeArchive : ""}`}>{ligne.statut}</span></td>
            <td><Link href={`/dashboard/bibliotheque/ressources/${ligne.id}`} className="action">Ouvrir</Link></td>
          </tr>)}</tbody></table>
        </div>
        {!lignes.length && <div className={styles.vide}>Aucune ressource trouvée.</div>}
      </section>
    </AdminShell>
  );
}
