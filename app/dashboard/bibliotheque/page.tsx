import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  BookOpenCheck,
  Building2,
  FileText,
  LibraryBig,
  Globe2,
  Plus,
  Tags,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import styles from "./bibliotheque.module.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  await exigerPermission("BIBLIOTHEQUE_VOIR");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const [
    total,
    numeriques,
    physiques,
    disponibles,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM bibliotheque_ressources
      WHERE ecole_id = ${ecole.id}
        AND statut = 'PUBLIE'
    `.catch(() => [{ total: 0 }]),

    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM bibliotheque_ressources
      WHERE ecole_id = ${ecole.id}
        AND statut = 'PUBLIE'
        AND type_ressource <> 'LIVRE_PHYSIQUE'
    `.catch(() => [{ total: 0 }]),

    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM bibliotheque_ressources
      WHERE ecole_id = ${ecole.id}
        AND statut = 'PUBLIE'
        AND type_ressource = 'LIVRE_PHYSIQUE'
    `.catch(() => [{ total: 0 }]),

    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COALESCE(SUM(exemplaires_disponibles), 0) AS total
      FROM bibliotheque_ressources
      WHERE ecole_id = ${ecole.id}
        AND statut = 'PUBLIE'
        AND type_ressource = 'LIVRE_PHYSIQUE'
    `.catch(() => [{ total: 0 }]),
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Bibliothèque numérique"
      description="Livres, ressources pédagogiques et documents de l’établissement."
      action={
        <Link
          href="/dashboard/bibliotheque/ressources/nouveau"
          className={styles.bouton}
        >
          <Plus size={18} />
          Nouvelle ressource
        </Link>
      }
    >
      <section className={styles.hero}>
        <div>
          <span>CENTRE DE RESSOURCES PÉDAGOGIQUES</span>
          <h2>Le savoir accessible à toute l’école</h2>
          <p>
            Centralisez les livres physiques, PDF, cours, exercices,
            examens, corrigés, vidéos et documents officiels.
          </p>
        </div>
        <LibraryBig size={74} />
      </section>

      <section className={styles.stats}>
        <article>
          <span><BookOpen size={22} /></span>
          <div>
            <small>Ressources publiées</small>
            <strong>{Number(total[0]?.total ?? 0)}</strong>
          </div>
        </article>
        <article>
          <span><FileText size={22} /></span>
          <div>
            <small>Ressources numériques</small>
            <strong>{Number(numeriques[0]?.total ?? 0)}</strong>
          </div>
        </article>
        <article>
          <span><BookOpenCheck size={22} /></span>
          <div>
            <small>Livres physiques</small>
            <strong>{Number(physiques[0]?.total ?? 0)}</strong>
          </div>
        </article>
        <article>
          <span><LibraryBig size={22} /></span>
          <div>
            <small>Exemplaires disponibles</small>
            <strong>{Number(disponibles[0]?.total ?? 0)}</strong>
          </div>
        </article>
      </section>

      <section className={styles.grille}>
        <Link href="/dashboard/bibliotheque/ressources" className={styles.carte}>
          <span><LibraryBig /></span>
          <h3>Catalogue des ressources</h3>
          <p>Rechercher et consulter toutes les ressources de l’école.</p>
        </Link>
        <Link href="/dashboard/bibliotheque/recherche-mondiale" className={styles.carte}>
          <span><Globe2 /></span>
          <h3>Recherche mondiale</h3>
          <p>Rechercher dans l’école, Open Library et Project Gutenberg.</p>
        </Link>
        <Link href="/dashboard/bibliotheque/categories" className={styles.carte}>
          <span><Tags /></span>
          <h3>Catégories</h3>
          <p>Organiser les ouvrages par domaine, cycle et usage.</p>
        </Link>
        <Link href="/dashboard/bibliotheque/auteurs" className={styles.carte}>
          <span><UserRound /></span>
          <h3>Auteurs</h3>
          <p>Gérer les auteurs des livres et ressources pédagogiques.</p>
        </Link>
        <Link href="/dashboard/bibliotheque/editeurs" className={styles.carte}>
          <span><Building2 /></span>
          <h3>Éditeurs</h3>
          <p>Référencer les maisons d’édition et organismes producteurs.</p>
        </Link>
        <Link href="/dashboard/bibliotheque/ressources/nouveau" className={styles.carte}>
          <span><Plus /></span>
          <h3>Ajouter une ressource</h3>
          <p>Publier un livre, cours, examen, corrigé, vidéo ou audio.</p>
        </Link>
      </section>
    </AdminShell>
  );
}
