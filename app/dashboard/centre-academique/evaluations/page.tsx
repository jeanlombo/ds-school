import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Filter,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import { cloturerEtPublierEvaluation } from "./actions";
import styles from "./evaluations.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    classe?: string;
    succes?: string;
  }>;
};

export default async function EvaluationsPage({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const statut = String(params.statut ?? "").trim();
  const classeId = Number(params.classe) || 0;

  const where = {
    ecoleId: ecole.id,
    ...(q
      ? {
          OR: [
            { titre: { contains: q } },
            { matiere: { nom: { contains: q } } },
          ],
        }
      : {}),
    ...(statut ? { statut } : {}),
    ...(classeId ? { classeId } : {}),
  };

  const [evaluations, classes, total, publiees, terminees, notes] =
    await Promise.all([
      prisma.evaluation.findMany({
        where,
        include: {
          classe: true,
          matiere: true,
          enseignant: true,
          typeEvaluation: true,
          periodeAcademique: true,
          _count: { select: { notes: true } },
        },
        orderBy: [{ dateEvaluation: "desc" }, { id: "desc" }],
      }),
      prisma.classe.findMany({
        where: { ecoleId: ecole.id, statut: "active" },
        orderBy: { nom: "asc" },
      }),
      prisma.evaluation.count({ where: { ecoleId: ecole.id } }),
      prisma.evaluation.count({
        where: { ecoleId: ecole.id, statut: "PUBLIEE", publiee: true },
      }),
      prisma.evaluation.count({
        where: { ecoleId: ecole.id, statut: "TERMINEE" },
      }),
      prisma.noteEvaluation.count({
        where: { evaluation: { ecoleId: ecole.id } },
      }),
    ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Évaluations Premium"
      description="Saisissez les notes, puis clôturez et publiez les évaluations."
      action={
        <Link
          href="/dashboard/centre-academique/evaluations/nouvelle"
          className={styles.boutonPrimaire}
        >
          <Plus size={18} />
          Nouvelle évaluation
        </Link>
      }
    >
      <RetourDashboard />

      {params.succes === "publication" && (
        <div className={styles.succes}>
          <CheckCircle2 size={18} />
          L’évaluation a été publiée.
        </div>
      )}

      <section className={styles.raccourcis}>
        <Link href="/dashboard/centre-academique/evaluations/types">
          <BookOpenCheck size={18} />
          Types d’évaluations
        </Link>
        <Link href="/dashboard/centre-academique">
          <BarChart3 size={18} />
          Centre académique
        </Link>
      </section>

      <section className={styles.stats}>
        <article><ClipboardList /><div><small>Total évaluations</small><strong>{total}</strong></div></article>
        <article><CalendarDays /><div><small>Publiées</small><strong>{publiees}</strong></div></article>
        <article><BookOpenCheck /><div><small>Terminées</small><strong>{terminees}</strong></div></article>
        <article><BarChart3 /><div><small>Notes enregistrées</small><strong>{notes}</strong></div></article>
      </section>

      <form className={styles.filtres}>
        <label>
          <Search size={18} />
          <input name="q" defaultValue={q} placeholder="Titre ou matière…" />
        </label>

        <select name="classe" defaultValue={String(classeId)}>
          <option value="0">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nom}
            </option>
          ))}
        </select>

        <select name="statut" defaultValue={statut}>
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="PROGRAMMEE">Programmée</option>
          <option value="PUBLIEE">Publiée</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINEE">Terminée</option>
          <option value="ARCHIVEE">Archivée</option>
        </select>

        <button type="submit">
          <Filter size={17} />
          Filtrer
        </button>
      </form>

      <section className={styles.tableCarte}>
        <div className={styles.tableEntete}>
          <div>
            <h2>Liste des évaluations</h2>
            <p>{evaluations.length} résultat(s)</p>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <div className={styles.vide}>
            <ClipboardList size={48} />
            <h3>Aucune évaluation</h3>
            <p>Créez la première évaluation.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table>
              <thead>
                <tr>
                  <th>Évaluation</th>
                  <th>Classe / période</th>
                  <th>Date</th>
                  <th>Barème</th>
                  <th>Statut</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation) => {
                  const publier = cloturerEtPublierEvaluation.bind(null, evaluation.id);

                  return (
                    <tr key={evaluation.id}>
                      <td>
                        <strong>{evaluation.titre}</strong>
                        <small>
                          {evaluation.typeEvaluation.nom} · {evaluation.matiere.nom}
                        </small>
                      </td>
                      <td>
                        {evaluation.classe.nom}
                        <small>{evaluation.periodeAcademique.nom}</small>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("fr-FR").format(evaluation.dateEvaluation)}
                      </td>
                      <td>
                        {Number(evaluation.bareme).toFixed(2)}
                        <small>Coeff. {Number(evaluation.coefficient).toFixed(2)}</small>
                      </td>
                      <td>
                        <span className={styles.statut}>
                          {evaluation.statut.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{evaluation._count.notes}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Link
                            className={styles.actionLien}
                            href={`/dashboard/centre-academique/evaluations/${evaluation.id}/notes`}
                          >
                            {evaluation.statut === "PUBLIEE" ? "Voir les notes" : "Saisir les notes"}
                          </Link>

                          {evaluation.statut === "TERMINEE" &&
                            evaluation._count.notes > 0 && (
                              <form action={publier}>
                                <button type="submit" className={styles.boutonPrimaire}>
                                  <Send size={16} />
                                  Clôturer et publier
                                </button>
                              </form>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
