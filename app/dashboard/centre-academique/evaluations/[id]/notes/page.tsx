import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  Save,
  Send,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import {
  cloturerEtPublierEvaluation,
  enregistrerNotes,
} from "../../actions";
import styles from "../../evaluations.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ succes?: string; erreur?: string }>;
};

export default async function SaisieNotesPage({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const { id } = await params;
  const query = await searchParams;
  const evaluationId = Number(id);
  if (!Number.isInteger(evaluationId)) notFound();

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      classe: true,
      matiere: true,
      typeEvaluation: true,
      periodeAcademique: true,
      notes: true,
    },
  });

  if (!evaluation) notFound();

  const inscriptions = await prisma.inscription.findMany({
    where: {
      classeId: evaluation.classeId,
      anneeScolaireId: evaluation.anneeScolaireId,
      statut: { in: ["inscrit", "admis"] },
    },
    include: { eleve: true },
    orderBy: [{ eleve: { nom: "asc" } }, { eleve: { prenom: "asc" } }],
  });

  const notesMap = new Map(evaluation.notes.map((note) => [note.eleveId, note]));
  const enregistrer = enregistrerNotes.bind(null, evaluation.id);
  const publier = cloturerEtPublierEvaluation.bind(null, evaluation.id);
  const estPubliee = evaluation.statut === "PUBLIEE" || evaluation.publiee === true;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre={`Saisie des notes — ${evaluation.titre}`}
      description={`${evaluation.classe.nom} · ${evaluation.matiere.nom} · Barème ${Number(evaluation.bareme).toFixed(2)}`}
    >
      <Link
        href="/dashboard/centre-academique/evaluations"
        className={styles.retourDashboard}
      >
        <ArrowLeft size={17} />
        Retour aux évaluations
      </Link>

      {query.succes && (
        <div className={styles.succes}>
          <CheckCircle2 size={18} />
          {query.succes === "notes"
            ? "Les notes sont enregistrées. Vous pouvez maintenant clôturer et publier."
            : query.succes === "publication"
              ? "L’évaluation est publiée et prise en compte dans les résultats."
              : "L’évaluation a été créée."}
        </div>
      )}

      {query.erreur === "aucune_note" && (
        <div className={styles.erreur}>
          Enregistrez d’abord les notes avant de publier.
        </div>
      )}

      {estPubliee && (
        <div className={styles.succes}>
          <LockKeyhole size={18} />
          Évaluation publiée : notes verrouillées.
        </div>
      )}

      <section className={styles.resumeEvaluation}>
        <div><small>Type</small><strong>{evaluation.typeEvaluation.nom}</strong></div>
        <div><small>Période</small><strong>{evaluation.periodeAcademique.nom}</strong></div>
        <div><small>Date</small><strong>{new Intl.DateTimeFormat("fr-FR").format(evaluation.dateEvaluation)}</strong></div>
        <div><small>Statut</small><strong>{evaluation.statut}</strong></div>
      </section>

      <form action={enregistrer} className={styles.tableCarte}>
        {inscriptions.length === 0 ? (
          <div className={styles.vide}>
            <h3>Aucun apprenant inscrit</h3>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Apprenant</th>
                  <th>Matricule</th>
                  <th>Note / {Number(evaluation.bareme).toFixed(2)}</th>
                  <th>Absent</th>
                  <th>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {inscriptions.map((inscription, index) => {
                  const note = notesMap.get(inscription.eleveId);

                  return (
                    <tr key={inscription.id}>
                      <td>
                        {index + 1}
                        <input type="hidden" name="eleveId" value={inscription.eleveId} />
                      </td>
                      <td>
                        <strong>
                          {inscription.eleve.nom} {inscription.eleve.postnom || ""} {inscription.eleve.prenom}
                        </strong>
                      </td>
                      <td>{inscription.eleve.matricule}</td>
                      <td>
                        <input
                          className={styles.noteInput}
                          type="number"
                          name={`note_${inscription.eleveId}`}
                          min="0"
                          max={Number(evaluation.bareme)}
                          step="0.01"
                          disabled={estPubliee}
                          defaultValue={
                            note?.valeur === null || note?.valeur === undefined
                              ? ""
                              : Number(note.valeur)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          name={`absent_${inscription.eleveId}`}
                          disabled={estPubliee}
                          defaultChecked={note?.absent || false}
                        />
                      </td>
                      <td>
                        <input
                          name={`appreciation_${inscription.eleveId}`}
                          disabled={estPubliee}
                          defaultValue={note?.appreciation || ""}
                          placeholder="Appréciation facultative"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {inscriptions.length > 0 && !estPubliee && (
          <div className={styles.actionsForm}>
            <button type="submit">
              <Save size={18} />
              Enregistrer toutes les notes
            </button>
          </div>
        )}
      </form>

      {evaluation.statut === "TERMINEE" &&
        evaluation.notes.length > 0 &&
        !estPubliee && (
          <section className={styles.tableCarte} style={{ marginTop: 18, padding: 20 }}>
            <h2>Publication des résultats</h2>
            <p>
              Après publication, l’évaluation sera incluse dans les moyennes,
              classements et bulletins.
            </p>
            <form action={publier}>
              <button type="submit" className={styles.boutonPrimaire}>
                <Send size={18} />
                Clôturer et publier
              </button>
            </form>
          </section>
        )}
    </AdminShell>
  );
}
