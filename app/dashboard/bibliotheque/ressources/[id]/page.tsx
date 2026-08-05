import { notFound, redirect } from "next/navigation";
import { Archive, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { archiverRessource } from "../../actions";
import styles from "../../bibliotheque.module.css";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ succes?: string }> };

export default async function Page({ params, searchParams }: Props) {
  await exigerPermission("BIBLIOTHEQUE_RESSOURCES_VOIR");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const query = await searchParams;
  const ressourceId = Number(id);
  if (!Number.isInteger(ressourceId)) notFound();

  const lignes = await prisma.$queryRaw<Array<{
    id: number; code_ressource: string; titre: string; type_ressource: string;
    isbn: string | null; resume: string | null; mots_cles: string | null;
    url_fichier: string | null; url_couverture: string | null;
    annee_publication: number | null; nombre_pages: number | null;
    nombre_exemplaires: number; exemplaires_disponibles: number; statut: string;
    categorie: string | null; auteur: string | null; editeur: string | null;
    matiere: string | null; classe: string | null; cree_par: string;
  }>>`
    SELECT r.*,
      c.nom AS categorie,
      CONCAT_WS(' ', a.nom, a.prenom) AS auteur,
      e.nom AS editeur,
      m.nom AS matiere,
      cl.nom AS classe
    FROM bibliotheque_ressources r
    LEFT JOIN bibliotheque_categories c ON c.id = r.categorie_id
    LEFT JOIN bibliotheque_auteurs a ON a.id = r.auteur_id
    LEFT JOIN bibliotheque_editeurs e ON e.id = r.editeur_id
    LEFT JOIN matieres m ON m.id = r.matiere_id
    LEFT JOIN classes cl ON cl.id = r.classe_id
    WHERE r.id = ${ressourceId} AND r.ecole_id = ${ecole.id}
    LIMIT 1
  `;
  const ressource = lignes[0];
  if (!ressource) notFound();
  const actionArchive = archiverRessource.bind(null, ressource.id);

  return (
    <AdminShell utilisateur={utilisateur} titre={ressource.titre}
      description={`Ressource ${ressource.code_ressource}`}>
      {query.succes && <div className={`${styles.messages} ${styles.succes}`}>Ressource enregistrée.</div>}
      <section className={styles.panel}>
        <div className={styles.detail}>
          <div>{ressource.url_couverture
            ? <img src={ressource.url_couverture} alt={`Couverture de ${ressource.titre}`} />
            : <div className={styles.vide}>Aucune couverture</div>}</div>
          <div>
            <div className={styles.infos}>
              <div><small>Code</small><strong>{ressource.code_ressource}</strong></div>
              <div><small>Type</small><strong>{ressource.type_ressource}</strong></div>
              <div><small>Auteur</small><strong>{ressource.auteur ?? "—"}</strong></div>
              <div><small>Éditeur</small><strong>{ressource.editeur ?? "—"}</strong></div>
              <div><small>Catégorie</small><strong>{ressource.categorie ?? "—"}</strong></div>
              <div><small>Matière</small><strong>{ressource.matiere ?? "Toutes"}</strong></div>
              <div><small>Classe</small><strong>{ressource.classe ?? "Toutes"}</strong></div>
              <div><small>Statut</small><strong>{ressource.statut}</strong></div>
              <div><small>Exemplaires</small><strong>{ressource.exemplaires_disponibles} / {ressource.nombre_exemplaires}</strong></div>
              <div><small>ISBN</small><strong>{ressource.isbn ?? "—"}</strong></div>
            </div>
            {ressource.resume && <p>{ressource.resume}</p>}
            <div className={styles.liens}>
              {ressource.url_fichier && <a href={ressource.url_fichier} target="_blank" rel="noreferrer" className={styles.bouton}><ExternalLink size={17}/>Ouvrir la ressource</a>}
              {ressource.statut !== "ARCHIVE" && <form action={actionArchive}><button type="submit" className={styles.danger}><Archive size={17}/>Archiver</button></form>}
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
