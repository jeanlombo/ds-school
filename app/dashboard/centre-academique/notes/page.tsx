import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck, Filter, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import CarnetNotesClient from "./CarnetNotesClient";
import { enregistrerCarnetNotes } from "./actions";
import styles from "./carnet-notes.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    evaluationId?: string;
    classeId?: string;
    periodeId?: string;
    succes?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const classeId = Number(params.classeId || 0);
  const periodeId = Number(params.periodeId || 0);
  const evaluationId = Number(params.evaluationId || 0);

  const [classes, periodes, evaluations] = await Promise.all([
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      orderBy: { nom: "asc" },
    }),
    prisma.periodeAcademique.findMany({
      where: { anneeScolaire: { ecoleId: ecole.id } },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.evaluation.findMany({
      where: {
        ecoleId: ecole.id,
        ...(classeId ? { classeId } : {}),
        ...(periodeId ? { periodeAcademiqueId: periodeId } : {}),
      },
      include: {
        classe: true,
        matiere: true,
        periodeAcademique: true,
        typeEvaluation: true,
      },
      orderBy: [{ dateEvaluation: "desc" }, { titre: "asc" }],
      take: 150,
    }),
  ]);

  const evaluation = evaluationId
    ? await prisma.evaluation.findFirst({
        where: { id: evaluationId, ecoleId: ecole.id },
        include: {
          classe: true,
          matiere: true,
          periodeAcademique: true,
          typeEvaluation: true,
          notes: true,
        },
      })
    : null;

  const inscriptions = evaluation
    ? await prisma.inscription.findMany({
        where: {
          classeId: evaluation.classeId,
          anneeScolaireId: evaluation.anneeScolaireId,
          statut: "inscrit",
        },
        include: { eleve: true },
        orderBy: [{ eleve: { nom: "asc" } }, { eleve: { prenom: "asc" } }],
      })
    : [];

  const notesParEleve = new Map(
    evaluation?.notes.map((note) => [note.eleveId, note]) ?? [],
  );

  const lignes = inscriptions.map((inscription) => {
    const note = notesParEleve.get(inscription.eleveId);
    return {
      eleveId: inscription.eleveId,
      matricule: inscription.eleve.matricule,
      nomComplet: [
        inscription.eleve.nom,
        inscription.eleve.postnom,
        inscription.eleve.prenom,
      ].filter(Boolean).join(" "),
      valeur: note?.valeur === null || note?.valeur === undefined
        ? null
        : Number(note.valeur),
      absent: note?.absent ?? false,
      appreciation: note?.appreciation ?? "",
    };
  });

  const action = evaluation
    ? enregistrerCarnetNotes.bind(null, evaluation.id)
    : async () => {};

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Carnet de notes Premium"
      description="Saisissez rapidement les notes, contrôlez le barème et suivez les statistiques en direct."
      action={
        <Link
          href="/dashboard/centre-academique/evaluations/nouvelle"
          className={styles.boutonNouveau}
        >
          <PlusCircle size={18} />
          Nouvelle évaluation
        </Link>
      }
    >
      <div className={styles.page}>
        <RetourDashboard />

        {params.succes && (
          <div className={styles.succes}>
            Les notes ont été enregistrées avec succès.
          </div>
        )}

        <section className={styles.filtresCarte}>
          <div className={styles.enteteFiltres}>
            <div>
              <span><Filter size={17} /> Sélection académique</span>
              <h2>Choisir une évaluation</h2>
            </div>
            <small>Utilisez Entrée ou ↓ pour passer rapidement à l’élève suivant.</small>
          </div>

          <form className={styles.filtres}>
            <select name="classeId" defaultValue={classeId || ""}>
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.nom}</option>
              ))}
            </select>

            <select name="periodeId" defaultValue={periodeId || ""}>
              <option value="">Toutes les périodes</option>
              {periodes.map((periode) => (
                <option key={periode.id} value={periode.id}>{periode.nom}</option>
              ))}
            </select>

            <select name="evaluationId" defaultValue={evaluationId || ""} required>
              <option value="">Sélectionner une évaluation</option>
              {evaluations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.classe.nom} · {item.matiere.nom} · {item.titre} · {item.periodeAcademique.nom}
                </option>
              ))}
            </select>

            <button type="submit">Afficher le carnet</button>
          </form>
        </section>

        {!evaluation ? (
          <section className={styles.vide}>
            <BookOpenCheck size={48} />
            <h2>Aucune évaluation sélectionnée</h2>
            <p>Choisissez une évaluation pour afficher les élèves et commencer la saisie.</p>
          </section>
        ) : (
          <section className={styles.carnetCarte}>
            <header className={styles.enteteCarnet}>
              <div>
                <span>{evaluation.typeEvaluation.nom}</span>
                <h2>{evaluation.titre}</h2>
                <p>
                  {evaluation.classe.nom} · {evaluation.matiere.nom} · {evaluation.periodeAcademique.nom}
                </p>
              </div>
              <div className={styles.bareme}>
                <small>Barème</small>
                <strong>/{Number(evaluation.bareme)}</strong>
              </div>
            </header>

            {lignes.length ? (
              <CarnetNotesClient
                evaluationId={evaluation.id}
                bareme={Number(evaluation.bareme)}
                lignes={lignes}
                action={action}
              />
            ) : (
              <div className={styles.videCompact}>
                Aucun élève inscrit dans cette classe pour cette année scolaire.
              </div>
            )}
          </section>
        )}
      </div>
    </AdminShell>
  );
}
