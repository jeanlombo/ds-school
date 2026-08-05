import { redirect } from "next/navigation";
import { BookPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { TYPES_RESSOURCES } from "@/lib/bibliotheque/types";
import { creerRessource } from "../../actions";
import styles from "../../bibliotheque.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ erreur?: string }>;
};

export default async function Page({ searchParams }: Props) {
  await exigerPermission("BIBLIOTHEQUE_RESSOURCES_CREER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [categories, auteurs, editeurs, matieres, classes] =
    await Promise.all([
      prisma.$queryRaw<Array<{ id: number; nom: string }>>`
        SELECT id, nom
        FROM bibliotheque_categories
        WHERE ecole_id = ${ecole.id} AND actif = 1
        ORDER BY nom
      `,
      prisma.$queryRaw<Array<{ id: number; nom: string }>>`
        SELECT id, CONCAT_WS(' ', nom, prenom) AS nom
        FROM bibliotheque_auteurs
        WHERE ecole_id = ${ecole.id} AND actif = 1
        ORDER BY nom
      `,
      prisma.$queryRaw<Array<{ id: number; nom: string }>>`
        SELECT id, nom
        FROM bibliotheque_editeurs
        WHERE ecole_id = ${ecole.id} AND actif = 1
        ORDER BY nom
      `,
      prisma.matiere.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: "asc" },
      }),
      prisma.classe.findMany({
        where: { ecoleId: ecole.id },
        select: { id: true, nom: true },
        orderBy: { nom: "asc" },
      }),
    ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouvelle ressource"
      description="Ajoutez un livre physique ou une ressource numérique."
    >
      {params.erreur && (
        <div className={`${styles.messages} ${styles.erreur}`}>
          {params.erreur === "fichier"
            ? "Une URL de fichier est obligatoire pour une ressource numérique."
            : "Le titre et le type de ressource sont obligatoires."}
        </div>
      )}

      <section className={styles.panel}>
        <form action={creerRessource} className={styles.formulaire}>
          <label className={styles.large}>
            <span>Titre *</span>
            <input name="titre" required placeholder="Mathématiques 7e" />
          </label>

          <label>
            <span>Type *</span>
            <select name="type_ressource" required defaultValue="">
              <option value="" disabled>Sélectionner</option>
              {TYPES_RESSOURCES.map((type) => (
                <option key={type.valeur} value={type.valeur}>{type.libelle}</option>
              ))}
            </select>
          </label>

          <label><span>Catégorie</span><select name="categorie_id" defaultValue=""><option value="">Aucune</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
          <label><span>Auteur</span><select name="auteur_id" defaultValue=""><option value="">Non défini</option>{auteurs.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
          <label><span>Éditeur</span><select name="editeur_id" defaultValue=""><option value="">Non défini</option>{editeurs.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
          <label><span>Matière</span><select name="matiere_id" defaultValue=""><option value="">Toutes</option>{matieres.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
          <label><span>Classe</span><select name="classe_id" defaultValue=""><option value="">Toutes</option>{classes.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
          <label><span>ISBN</span><input name="isbn" /></label>
          <label><span>Année de publication</span><input type="number" name="annee_publication" min="1000" max="2200" /></label>
          <label><span>Nombre de pages</span><input type="number" name="nombre_pages" min="1" /></label>
          <label><span>Exemplaires physiques</span><input type="number" name="nombre_exemplaires" min="0" defaultValue="0" /></label>
          <label className={styles.large}><span>URL de la couverture</span><input type="url" name="url_couverture" placeholder="https://..." /></label>
          <label className={styles.large}><span>URL du fichier ou de la vidéo</span><input type="url" name="url_fichier" placeholder="https://..." /></label>
          <label className={styles.large}><span>Mots-clés</span><input name="mots_cles" placeholder="mathématiques, fractions, 7e" /></label>
          <label className={styles.large}><span>Résumé</span><textarea name="resume" /></label>
          <button type="submit"><BookPlus size={18} />Publier la ressource</button>
        </form>
      </section>
    </AdminShell>
  );
}
