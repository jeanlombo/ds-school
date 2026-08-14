import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { calculerResultats } from "../../resultats/calculs";
import BoutonImprimer from "./BoutonImprimer";
import styles from "../bulletins.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ inscriptionId: string }>;
  searchParams: Promise<{ classeId?: string; periodeId?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const route = await params;
  const query = await searchParams;

  const inscriptionId = Number(route.inscriptionId);
  const classeId = Number(query.classeId ?? 0);
  const periodeId = Number(query.periodeId ?? 0);

  if (!inscriptionId || !classeId || !periodeId) notFound();

  const [classe, periode, modele, synthese] = await Promise.all([
    prisma.classe.findFirst({
      where: { id: classeId, ecoleId: ecole.id },
    }),
    prisma.periodeAcademique.findFirst({
      where: { id: periodeId, anneeScolaire: { ecoleId: ecole.id } },
      include: { anneeScolaire: true },
    }),
    prisma.modeleBulletin.findFirst({
      where: { ecoleId: ecole.id, actif: true },
      orderBy: [{ parDefaut: "desc" }, { updatedAt: "desc" }],
    }),
    calculerResultats(ecole.id, classeId, periodeId),
  ]);

  const ligne = synthese.lignes.find(
    (element) => element.inscriptionId === inscriptionId,
  );

  if (!ligne || !classe || !periode) notFound();

  const couleur = modele?.couleurPrincipale || "#1d4ed8";

  return (
    <main className={styles.documentPage}>
      <div className={styles.outilsImpression}>
        <Link
          href={`/dashboard/centre-academique/bulletins?classeId=${classeId}&periodeId=${periodeId}`}
        >
          <ArrowLeft size={18} />
          Retour
        </Link>
        <BoutonImprimer />
      </div>

      <article
        className={styles.bulletin}
        style={{ "--couleur-bulletin": couleur } as React.CSSProperties}
      >
        <header className={styles.bulletinHeader}>
          <div className={styles.logoEcole}>DS</div>
          <div className={styles.identiteEcole}>
            <span>DS SCHOOL ENTERPRISE</span>
            <h1>BULLETIN SCOLAIRE</h1>
            <p>Excellence · Discipline · Innovation</p>
          </div>
          <div className={styles.anneeBloc}>
            <small>Année scolaire</small>
            <strong>{periode.anneeScolaire.libelle}</strong>
          </div>
        </header>

        <section className={styles.infosEleve}>
          <div>
            <small>Nom complet</small>
            <strong>{ligne.nomComplet}</strong>
          </div>
          <div>
            <small>Matricule</small>
            <strong>{ligne.matricule}</strong>
          </div>
          <div>
            <small>Classe</small>
            <strong>{classe.nom}</strong>
          </div>
          <div>
            <small>Période</small>
            <strong>{periode.nom}</strong>
          </div>
        </section>

        <section className={styles.sectionBulletin}>
          <div className={styles.titreSection}>
            <h2>Résultats par matière</h2>
            <span>{ligne.matieres.length} matière(s)</span>
          </div>

          <table className={styles.tableBulletin}>
            <thead>
              <tr>
                <th>Matière</th>
                <th>Évaluations</th>
                <th>Moyenne</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {ligne.matieres.map((matiere) => (
                <tr key={matiere.matiereId}>
                  <td>{matiere.nom}</td>
                  <td>{matiere.evaluations}</td>
                  <td>
                    <strong>{matiere.moyenne.toFixed(2)}%</strong>
                  </td>
                  <td>
                    {matiere.moyenne >= 80
                      ? "Excellent"
                      : matiere.moyenne >= 70
                        ? "Très bien"
                        : matiere.moyenne >= 60
                          ? "Bien"
                          : matiere.moyenne >= 50
                            ? "Assez bien"
                            : "À renforcer"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.syntheseBulletin}>
          <article>
            <small>Moyenne générale</small>
            <strong>{ligne.moyenne.toFixed(2)}%</strong>
          </article>
          <article>
            <small>Rang</small>
            <strong>
              {ligne.rang}
              <sup>e</sup> / {synthese.lignes.length}
            </strong>
          </article>
          <article>
            <small>Mention</small>
            <strong>{ligne.mention}</strong>
          </article>
          <article>
            <small>Décision</small>
            <strong>{ligne.decision}</strong>
          </article>
        </section>

        <section className={styles.observations}>
          <div>
            <h3>Observation de la direction</h3>
            <p>
              {ligne.decision === "Admis"
                ? "Résultats satisfaisants. L’apprenant est encouragé à poursuivre ses efforts."
                : "Des efforts supplémentaires et un accompagnement renforcé sont recommandés."}
            </p>
          </div>
          <div className={styles.signature}>
            <span>Signature et cachet</span>
          </div>
        </section>

        <footer className={styles.footerBulletin}>
          <span>Document généré par DS School Enterprise</span>
          <span>
            Complétude des notes : {ligne.evaluationsNotees}/
            {ligne.evaluationsAttendues}
          </span>
        </footer>
      </article>
    </main>
  );
}
