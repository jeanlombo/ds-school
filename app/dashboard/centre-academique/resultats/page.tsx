import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Medal,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { calculerResultats } from "./calculs";
import styles from "./resultats.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    classeId?: string;
    periodeId?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [classes, periodes] = await Promise.all([
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      orderBy: { nom: "asc" },
    }),
    prisma.periodeAcademique.findMany({
      where: { anneeScolaire: { ecoleId: ecole.id } },
      include: { anneeScolaire: true },
      orderBy: [{ anneeScolaire: { dateDebut: "desc" } }, { ordre: "asc" }],
    }),
  ]);

  const classeId = Number(params.classeId ?? 0);
  const periodeId = Number(params.periodeId ?? 0);
  const synthese = await calculerResultats(ecole.id, classeId, periodeId);

  const classeSelectionnee = classes.find((classe) => classe.id === classeId);
  const periodeSelectionnee = periodes.find(
    (periode) => periode.id === periodeId,
  );

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Résultats académiques"
      description="Moyennes pondérées, réussite et progression par classe et période."
      action={
        classeId && periodeId ? (
          <Link
            className={styles.actionSecondaire}
            href={`/dashboard/centre-academique/classements?classeId=${classeId}&periodeId=${periodeId}`}
          >
            <Medal size={18} />
            Voir le classement
          </Link>
        ) : undefined
      }
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Analyse académique</span>
            <h2>
              {classeSelectionnee?.nom ?? "Sélectionnez une classe"}
              {periodeSelectionnee ? ` · ${periodeSelectionnee.nom}` : ""}
            </h2>
            <p>
              Les résultats utilisent uniquement les évaluations publiées et
              appliquent automatiquement les barèmes et coefficients.
            </p>
          </div>
          <BarChart3 size={72} />
        </section>

        <section className={styles.panelFiltres}>
          <form className={styles.filters}>
            <label>
              <span>Classe</span>
              <select
                name="classeId"
                defaultValue={classeId || ""}
                required
              >
                <option value="">Choisir une classe</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Période académique</span>
              <select
                name="periodeId"
                defaultValue={periodeId || ""}
                required
              >
                <option value="">Choisir une période</option>
                {periodes.map((periode) => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom} — {periode.anneeScolaire.libelle}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className={styles.btnPrimaire}>
              <Search size={18} />
              Calculer les résultats
            </button>
          </form>
        </section>

        {classeId && periodeId ? (
          <>
            <section className={styles.stats}>
              <article>
                <span className={styles.statIcone}>
                  <Users size={22} />
                </span>
                <div>
                  <small>Élèves évalués</small>
                  <strong>{synthese.lignes.length}</strong>
                </div>
              </article>

              <article>
                <span className={styles.statIcone}>
                  <TrendingUp size={22} />
                </span>
                <div>
                  <small>Moyenne de classe</small>
                  <strong>{synthese.moyenneClasse.toFixed(2)}%</strong>
                </div>
              </article>

              <article>
                <span className={styles.statIcone}>
                  <CheckCircle2 size={22} />
                </span>
                <div>
                  <small>Taux de réussite</small>
                  <strong>{synthese.tauxReussite.toFixed(1)}%</strong>
                </div>
              </article>

              <article>
                <span className={styles.statIcone}>
                  <BookOpenCheck size={22} />
                </span>
                <div>
                  <small>Évaluations publiées</small>
                  <strong>{synthese.evaluationsPubliees}</strong>
                </div>
              </article>
            </section>

            <section className={styles.panelTableau}>
              <div className={styles.enteteTableau}>
                <div>
                  <span className={styles.eyebrow}>Vue générale</span>
                  <h3>Résultats des élèves</h3>
                </div>
                <div className={styles.resumeDecision}>
                  <span>{synthese.admis} admis</span>
                  <span>{synthese.ajournes} ajourné(s)</span>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Rang</th>
                      <th>Matricule</th>
                      <th>Élève</th>
                      <th>Moyenne</th>
                      <th>Complétude</th>
                      <th>Mention</th>
                      <th>Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthese.lignes.map((ligne) => (
                      <tr key={ligne.inscriptionId}>
                        <td>
                          <span
                            className={
                              ligne.rang <= 3
                                ? styles.rangFort
                                : styles.rang
                            }
                          >
                            #{ligne.rang}
                          </span>
                        </td>
                        <td className={styles.matricule}>
                          {ligne.matricule}
                        </td>
                        <td>
                          <div className={styles.eleve}>
                            <span>
                              {ligne.nomComplet
                                .split(" ")
                                .slice(0, 2)
                                .map((partie) => partie.charAt(0))
                                .join("")}
                            </span>
                            <strong>{ligne.nomComplet}</strong>
                          </div>
                        </td>
                        <td>
                          <strong className={styles.moyenne}>
                            {ligne.moyenne.toFixed(2)}%
                          </strong>
                        </td>
                        <td>
                          <div className={styles.progressionCellule}>
                            <div className={styles.progression}>
                              <i
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ligne.tauxCompletion,
                                  )}%`,
                                }}
                              />
                            </div>
                            <small>
                              {ligne.evaluationsNotees}/
                              {ligne.evaluationsAttendues}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className={styles.mention}>
                            {ligne.mention}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              ligne.decision === "Admis"
                                ? styles.admis
                                : styles.ajourne
                            }
                          >
                            {ligne.decision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {synthese.lignes.length === 0 && (
                <div className={styles.vide}>
                  <BarChart3 size={44} />
                  <h3>Aucun résultat disponible</h3>
                  <p>
                    Publiez d’abord des évaluations et saisissez les notes pour
                    cette classe et cette période.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className={styles.vide}>
            <BarChart3 size={52} />
            <h3>Sélection nécessaire</h3>
            <p>
              Choisissez une classe et une période pour calculer les moyennes,
              mentions et décisions.
            </p>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
