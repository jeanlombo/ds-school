import Link from "next/link";
import {
  BookOpen,
  Clock3,
  Download,
  Filter,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { supprimerMatiere } from "./actions";
import styles from "./matieres.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    departement?: string;
    succes?: string;
  }>;
};

function messageSucces(code?: string) {
  if (code === "creation") return "La matière a été créée avec succès.";
  if (code === "modification") return "La matière a été modifiée avec succès.";
  return "";
}

export default async function PageMatieres({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const statut =
    params.statut === "ACTIF" || params.statut === "INACTIF"
      ? params.statut
      : "";
  const departement = (params.departement || "").trim();

  const where = {
    ...(q
      ? {
          OR: [
            { nom: { contains: q } },
            { code: { contains: q } },
            { departement: { contains: q } },
          ],
        }
      : {}),
    ...(statut ? { statut: statut as "ACTIF" | "INACTIF" } : {}),
    ...(departement ? { departement } : {}),
  };

  const [matieres, total, actifs, agregats, departements] = await Promise.all([
    prisma.matiere.findMany({
      where,
      orderBy: [{ statut: "asc" }, { nom: "asc" }],
    }),
    prisma.matiere.count(),
    prisma.matiere.count({ where: { statut: "ACTIF" } }),
    prisma.matiere.aggregate({
      _sum: { volumeHoraireHebdomadaire: true },
      _avg: { coefficient: true },
    }),
    prisma.matiere.findMany({
      where: { departement: { not: null } },
      distinct: ["departement"],
      select: { departement: true },
      orderBy: { departement: "asc" },
    }),
  ]);

  const succes = messageSucces(params.succes);

  return (
    <div className={styles.page}>
      {succes && <div className={styles.succes}>{succes}</div>}

      <section className={styles.hero}>
        <div>
          <span className={styles.badgeHero}>
            <BookOpen size={16} /> MODULE ACADÉMIQUE
          </span>
          <h1>Gestion des matières</h1>
          <p>
            Centralisez les matières, coefficients et volumes horaires qui
            alimenteront l’emploi du temps, les évaluations et les bulletins.
          </p>
        </div>
        <div className={styles.heroActions}>
          <a
            className={styles.boutonExport}
            href="/api/matieres/export"
            title="Exporter les matières"
          >
            <Download size={18} /> Exporter Excel/CSV
          </a>
          <Link className={styles.boutonPrimaire} href="/dashboard/matieres/nouveau">
            <Plus size={18} /> Nouvelle matière
          </Link>
        </div>
      </section>

      <section className={styles.statistiques}>
        <article>
          <span className={styles.iconeBleue}><BookOpen size={22} /></span>
          <div><small>Total des matières</small><strong>{total}</strong></div>
        </article>
        <article>
          <span className={styles.iconeVerte}><Layers3 size={22} /></span>
          <div><small>Matières actives</small><strong>{actifs}</strong></div>
        </article>
        <article>
          <span className={styles.iconeOrange}><Clock3 size={22} /></span>
          <div>
            <small>Heures hebdomadaires</small>
            <strong>{agregats._sum.volumeHoraireHebdomadaire || 0} h</strong>
          </div>
        </article>
        <article>
          <span className={styles.iconeViolette}><Filter size={22} /></span>
          <div>
            <small>Coefficient moyen</small>
            <strong>{Number(agregats._avg.coefficient || 0).toFixed(2)}</strong>
          </div>
        </article>
      </section>

      <form className={styles.filtres}>
        <label className={styles.recherche}>
          <Search size={18} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom, code ou département…"
          />
        </label>

        <select name="statut" defaultValue={statut}>
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actives</option>
          <option value="INACTIF">Inactives</option>
        </select>

        <select name="departement" defaultValue={departement}>
          <option value="">Tous les départements</option>
          {departements
            .filter((item) => item.departement)
            .map((item) => (
              <option key={item.departement!} value={item.departement!}>
                {item.departement}
              </option>
            ))}
        </select>

        <button type="submit" className={styles.boutonFiltrer}>
          <Filter size={17} /> Filtrer
        </button>
      </form>

      <section className={styles.tableCarte}>
        <div className={styles.tableEntete}>
          <div>
            <h2>Répertoire des matières</h2>
            <p>{matieres.length} résultat(s) affiché(s)</p>
          </div>
        </div>

        {matieres.length === 0 ? (
          <div className={styles.vide}>
            <BookOpen size={46} />
            <h3>Aucune matière trouvée</h3>
            <p>Ajoutez votre première matière ou modifiez les filtres.</p>
            <Link href="/dashboard/matieres/nouveau">
              <Plus size={17} /> Créer une matière
            </Link>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table>
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Département</th>
                  <th>Coefficient</th>
                  <th>Volume horaire</th>
                  <th>Statut</th>
                  <th className={styles.colonneActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matieres.map((matiere) => (
                  <tr key={matiere.id}>
                    <td>
                      <div className={styles.matiereIdentite}>
                        <i style={{ backgroundColor: matiere.couleur }} />
                        <div>
                          <strong>{matiere.nom}</strong>
                          <small>{matiere.code}</small>
                        </div>
                      </div>
                    </td>
                    <td>{matiere.departement || "Non classé"}</td>
                    <td><b>{Number(matiere.coefficient).toFixed(2)}</b></td>
                    <td>{matiere.volumeHoraireHebdomadaire} h/semaine</td>
                    <td>
                      <span
                        className={
                          matiere.statut === "ACTIF"
                            ? styles.statutActif
                            : styles.statutInactif
                        }
                      >
                        {matiere.statut === "ACTIF" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/dashboard/matieres/${matiere.id}/modifier`}
                          title="Modifier"
                        >
                          <Pencil size={17} />
                        </Link>
                        <form action={supprimerMatiere}>
                          <input type="hidden" name="id" value={matiere.id} />
                          <button
                            type="submit"
                            title="Supprimer"
                            className={styles.supprimer}
                          >
                            <Trash2 size={17} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
