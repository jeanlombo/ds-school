import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  School,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { calculerResultats } from "../resultats/calculs";
import BarreActions from "./BarreActions";
import styles from "./tableau-analytique.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    periodeId?: string;
    classeId?: string;
  }>;
};

type Performance = {
  id: number;
  nom: string;
  moyenne: number;
  notes: number;
};

function arrondir(valeur: number, decimales = 1) {
  const facteur = 10 ** decimales;
  return Math.round((valeur + Number.EPSILON) * facteur) / facteur;
}

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [classes, periodes, enseignantsActifs, totalEleves] = await Promise.all([
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      include: { section: true },
      orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }],
    }),
    prisma.periodeAcademique.findMany({
      where: { anneeScolaire: { ecoleId: ecole.id } },
      include: { anneeScolaire: true },
      orderBy: [{ anneeScolaire: { dateDebut: "desc" } }, { ordre: "asc" }],
    }),
    prisma.enseignant.count({
      where: { ecoleId: ecole.id, statut: "actif" },
    }),
    prisma.inscription.count({
      where: {
        statut: "inscrit",
        anneeScolaire: { ecoleId: ecole.id },
      },
    }),
  ]);

  const periodeId =
    Number(params.periodeId ?? 0) || periodes[0]?.id || 0;
  const classeId = Number(params.classeId ?? 0);

  const classesAnalysees = classeId
    ? classes.filter((classe) => classe.id === classeId)
    : classes;

  const resultatsClasses = await Promise.all(
    classesAnalysees.map(async (classe) => ({
      classe,
      synthese: await calculerResultats(ecole.id, classe.id, periodeId),
    })),
  );

  const evaluations = periodeId
    ? await prisma.evaluation.findMany({
        where: {
          ecoleId: ecole.id,
          periodeAcademiqueId: periodeId,
          ...(classeId ? { classeId } : {}),
          publiee: true,
        },
        include: {
          matiere: true,
          enseignant: true,
          notes: true,
          classe: true,
        },
        orderBy: { dateEvaluation: "asc" },
      })
    : [];

  const lignesGlobales = resultatsClasses.flatMap(({ classe, synthese }) =>
    synthese.lignes.map((ligne) => ({
      ...ligne,
      classeNom: classe.nom,
    })),
  );

  const elevesAvecResultats = lignesGlobales.length;
  const moyenneEcole =
    elevesAvecResultats > 0
      ? arrondir(
          lignesGlobales.reduce((somme, ligne) => somme + ligne.moyenne, 0) /
            elevesAvecResultats,
        )
      : 0;

  const admis = lignesGlobales.filter(
    (ligne) => ligne.decision === "Admis",
  ).length;
  const tauxReussite =
    elevesAvecResultats > 0
      ? arrondir((admis / elevesAvecResultats) * 100)
      : 0;

  const notesEnregistrees = evaluations.reduce(
    (somme, evaluation) =>
      somme +
      evaluation.notes.filter(
        (note) => !note.absent && note.valeur !== null,
      ).length,
    0,
  );

  const absences = evaluations.reduce(
    (somme, evaluation) =>
      somme + evaluation.notes.filter((note) => note.absent).length,
    0,
  );

  const performancesMatieres = new Map<
    number,
    { nom: string; total: number; poids: number; notes: number }
  >();
  const performancesEnseignants = new Map<
    number,
    { nom: string; total: number; poids: number; notes: number }
  >();

  for (const evaluation of evaluations) {
    const bareme = Number(evaluation.bareme);
    const coefficient = Number(evaluation.coefficient);
    if (bareme <= 0 || coefficient <= 0) continue;

    for (const note of evaluation.notes) {
      if (note.absent || note.valeur === null) continue;

      const pourcentage = (Number(note.valeur) / bareme) * 100;

      const matiere = performancesMatieres.get(evaluation.matiereId) ?? {
        nom: evaluation.matiere.nom,
        total: 0,
        poids: 0,
        notes: 0,
      };
      matiere.total += pourcentage * coefficient;
      matiere.poids += coefficient;
      matiere.notes += 1;
      performancesMatieres.set(evaluation.matiereId, matiere);

      const enseignant =
        performancesEnseignants.get(evaluation.enseignantId) ?? {
          nom: `${evaluation.enseignant.nom} ${evaluation.enseignant.prenom}`.trim(),
          total: 0,
          poids: 0,
          notes: 0,
        };
      enseignant.total += pourcentage * coefficient;
      enseignant.poids += coefficient;
      enseignant.notes += 1;
      performancesEnseignants.set(evaluation.enseignantId, enseignant);
    }
  }

  const matieres: Performance[] = Array.from(
    performancesMatieres.entries(),
  )
    .map(([id, valeur]) => ({
      id,
      nom: valeur.nom,
      moyenne:
        valeur.poids > 0 ? arrondir(valeur.total / valeur.poids) : 0,
      notes: valeur.notes,
    }))
    .sort((a, b) => b.moyenne - a.moyenne);

  const enseignants: Performance[] = Array.from(
    performancesEnseignants.entries(),
  )
    .map(([id, valeur]) => ({
      id,
      nom: valeur.nom,
      moyenne:
        valeur.poids > 0 ? arrondir(valeur.total / valeur.poids) : 0,
      notes: valeur.notes,
    }))
    .sort((a, b) => b.moyenne - a.moyenne);

  const performancesClasses = resultatsClasses
    .map(({ classe, synthese }) => ({
      id: classe.id,
      nom: classe.nom,
      section: classe.section.nom,
      moyenne: synthese.moyenneClasse,
      reussite: synthese.tauxReussite,
      eleves: synthese.lignes.length,
      evaluations: synthese.evaluationsPubliees,
    }))
    .sort((a, b) => b.moyenne - a.moyenne);

  const topEleves = [...lignesGlobales]
    .sort((a, b) => b.moyenne - a.moyenne)
    .slice(0, 10);

  const elevesEnDifficulte = [...lignesGlobales]
    .filter((ligne) => ligne.moyenne < 50)
    .sort((a, b) => a.moyenne - b.moyenne)
    .slice(0, 10);

  const notesIncompletes = lignesGlobales.filter(
    (ligne) => ligne.tauxCompletion < 100,
  ).length;

  const repartition = [
    {
      libelle: "Excellent (80–100)",
      valeur: lignesGlobales.filter((ligne) => ligne.moyenne >= 80).length,
    },
    {
      libelle: "Très bien (70–79)",
      valeur: lignesGlobales.filter(
        (ligne) => ligne.moyenne >= 70 && ligne.moyenne < 80,
      ).length,
    },
    {
      libelle: "Bien (60–69)",
      valeur: lignesGlobales.filter(
        (ligne) => ligne.moyenne >= 60 && ligne.moyenne < 70,
      ).length,
    },
    {
      libelle: "Assez bien (50–59)",
      valeur: lignesGlobales.filter(
        (ligne) => ligne.moyenne >= 50 && ligne.moyenne < 60,
      ).length,
    },
    {
      libelle: "Insuffisant (< 50)",
      valeur: lignesGlobales.filter((ligne) => ligne.moyenne < 50).length,
    },
  ];

  const maxRepartition = Math.max(
    1,
    ...repartition.map((element) => element.valeur),
  );
  const maxClasse = Math.max(
    1,
    ...performancesClasses.map((element) => element.moyenne),
  );
  const periode = periodes.find((element) => element.id === periodeId);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Tableau de bord analytique"
      description="Cockpit décisionnel des performances académiques de l’établissement."
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>
              Business Intelligence académique
            </span>
            <h2>Pilotez la réussite scolaire avec des données fiables</h2>
            <p>
              Analyse consolidée des classes, matières, enseignants et élèves
              pour {periode?.nom ?? "la période sélectionnée"}.
            </p>
          </div>
          <BrainCircuit size={82} />
        </section>

        <section className={styles.filtresCarte}>
          <form className={styles.filtres}>
            <label>
              <span>Période académique</span>
              <select name="periodeId" defaultValue={periodeId || ""}>
                {periodes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom} — {element.anneeScolaire.libelle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Classe</span>
              <select name="classeId" defaultValue={classeId || 0}>
                <option value="0">Toutes les classes</option>
                {classes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom} — {element.section.nom}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">
              <BarChart3 size={18} />
              Actualiser l’analyse
            </button>
          </form>

          <BarreActions
            nomPeriode={periode?.nom ?? "Période"}
            lignes={performancesClasses.map((element) => ({
              classe: element.nom,
              section: element.section,
              eleves: element.eleves,
              moyenne: element.moyenne,
              tauxReussite: element.reussite,
              evaluations: element.evaluations,
            }))}
          />
        </section>

        <section className={styles.kpis}>
          <article>
            <span className={styles.iconeBleue}>
              <Users size={23} />
            </span>
            <div>
              <small>Élèves inscrits</small>
              <strong>{totalEleves}</strong>
              <em>{elevesAvecResultats} avec résultats</em>
            </div>
          </article>

          <article>
            <span className={styles.iconeViolette}>
              <GraduationCap size={23} />
            </span>
            <div>
              <small>Enseignants actifs</small>
              <strong>{enseignantsActifs}</strong>
              <em>{enseignants.length} analysé(s)</em>
            </div>
          </article>

          <article>
            <span className={styles.iconeVerte}>
              <TrendingUp size={23} />
            </span>
            <div>
              <small>Moyenne de l’école</small>
              <strong>{moyenneEcole.toFixed(1)}%</strong>
              <em>{performancesClasses.length} classe(s)</em>
            </div>
          </article>

          <article>
            <span className={styles.iconeOrange}>
              <CheckCircle2 size={23} />
            </span>
            <div>
              <small>Taux de réussite</small>
              <strong>{tauxReussite.toFixed(1)}%</strong>
              <em>{admis} élève(s) admis</em>
            </div>
          </article>

          <article>
            <span className={styles.iconeCyan}>
              <ClipboardList size={23} />
            </span>
            <div>
              <small>Évaluations publiées</small>
              <strong>{evaluations.length}</strong>
              <em>{notesEnregistrees} notes saisies</em>
            </div>
          </article>

          <article>
            <span className={styles.iconeRouge}>
              <AlertTriangle size={23} />
            </span>
            <div>
              <small>Alertes pédagogiques</small>
              <strong>{elevesEnDifficulte.length + notesIncompletes}</strong>
              <em>{absences} absence(s) notée(s)</em>
            </div>
          </article>
        </section>

        <section className={styles.grillePrincipale}>
          <article className={styles.panel}>
            <div className={styles.panelEntete}>
              <div>
                <span className={styles.eyebrow}>Comparaison</span>
                <h3>Performance par classe</h3>
              </div>
              <School size={22} />
            </div>

            <div className={styles.barres}>
              {performancesClasses.map((element, index) => (
                <div className={styles.ligneBarre} key={element.id}>
                  <div className={styles.libelleBarre}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{element.nom}</strong>
                      <small>
                        {element.eleves} élève(s) · réussite{" "}
                        {element.reussite.toFixed(1)}%
                      </small>
                    </div>
                  </div>
                  <div className={styles.barre}>
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          (element.moyenne / maxClasse) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <b>{element.moyenne.toFixed(1)}%</b>
                </div>
              ))}

              {performancesClasses.length === 0 && (
                <div className={styles.vide}>Aucune classe à analyser.</div>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelEntete}>
              <div>
                <span className={styles.eyebrow}>Distribution</span>
                <h3>Répartition des moyennes</h3>
              </div>
              <BarChart3 size={22} />
            </div>

            <div className={styles.histogramme}>
              {repartition.map((element) => (
                <div key={element.libelle}>
                  <span>{element.valeur}</span>
                  <i
                    style={{
                      height: `${Math.max(
                        8,
                        (element.valeur / maxRepartition) * 155,
                      )}px`,
                    }}
                  />
                  <small>{element.libelle}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.grilleSecondaire}>
          <article className={styles.panel}>
            <div className={styles.panelEntete}>
              <div>
                <span className={styles.eyebrow}>Matières</span>
                <h3>Performance académique</h3>
              </div>
              <BookOpen size={22} />
            </div>
            <div className={styles.classementCompact}>
              {matieres.slice(0, 8).map((element, index) => (
                <div key={element.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{element.nom}</strong>
                    <small>{element.notes} note(s)</small>
                  </div>
                  <b>{element.moyenne.toFixed(1)}%</b>
                </div>
              ))}
              {matieres.length === 0 && (
                <div className={styles.vide}>Aucune donnée par matière.</div>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelEntete}>
              <div>
                <span className={styles.eyebrow}>Enseignants</span>
                <h3>Résultats des évaluations</h3>
              </div>
              <GraduationCap size={22} />
            </div>
            <div className={styles.classementCompact}>
              {enseignants.slice(0, 8).map((element, index) => (
                <div key={element.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{element.nom}</strong>
                    <small>{element.notes} note(s)</small>
                  </div>
                  <b>{element.moyenne.toFixed(1)}%</b>
                </div>
              ))}
              {enseignants.length === 0 && (
                <div className={styles.vide}>Aucune donnée enseignant.</div>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelEntete}>
              <div>
                <span className={styles.eyebrow}>Top 10</span>
                <h3>Meilleurs élèves</h3>
              </div>
              <Trophy size={22} />
            </div>
            <div className={styles.classementCompact}>
              {topEleves.map((element, index) => (
                <div key={`${element.inscriptionId}-${element.classeNom}`}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{element.nomComplet}</strong>
                    <small>
                      {element.classeNom} · {element.matricule}
                    </small>
                  </div>
                  <b>{element.moyenne.toFixed(1)}%</b>
                </div>
              ))}
              {topEleves.length === 0 && (
                <div className={styles.vide}>Aucun résultat disponible.</div>
              )}
            </div>
          </article>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelEntete}>
            <div>
              <span className={styles.eyebrow}>Prévention</span>
              <h3>Alertes pédagogiques prioritaires</h3>
            </div>
            <AlertTriangle size={22} />
          </div>

          <div className={styles.alertes}>
            <article>
              <strong>{elevesEnDifficulte.length}</strong>
              <span>Élèves sous le seuil de 50 %</span>
              <p>
                Les élèves les plus fragiles sont affichés dans le tableau
                ci-dessous.
              </p>
            </article>
            <article>
              <strong>{notesIncompletes}</strong>
              <span>Dossiers de notes incomplets</span>
              <p>
                Élèves dont toutes les évaluations publiées ne sont pas encore
                renseignées.
              </p>
            </article>
            <article>
              <strong>{absences}</strong>
              <span>Absences aux évaluations</span>
              <p>
                Total des notes signalées comme absentes pour le filtre actuel.
              </p>
            </article>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Classe</th>
                  <th>Moyenne</th>
                  <th>Complétude</th>
                  <th>Priorité</th>
                </tr>
              </thead>
              <tbody>
                {elevesEnDifficulte.map((element) => (
                  <tr
                    key={`${element.inscriptionId}-${element.classeNom}-alerte`}
                  >
                    <td>
                      <strong>{element.nomComplet}</strong>
                      <small>{element.matricule}</small>
                    </td>
                    <td>{element.classeNom}</td>
                    <td>{element.moyenne.toFixed(1)}%</td>
                    <td>{element.tauxCompletion.toFixed(0)}%</td>
                    <td>
                      <span className={styles.priorite}>
                        {element.moyenne < 35 ? "Critique" : "À suivre"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {elevesEnDifficulte.length === 0 && (
              <div className={styles.vide}>
                Aucun élève en difficulté pour la sélection actuelle.
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
