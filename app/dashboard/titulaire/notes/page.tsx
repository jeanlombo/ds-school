import { ClipboardList, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import AdminShell from "@/components/admin/AdminShell";
import { enregistrerNotesTitulaire } from "./actions";
import styles from "../titulaire.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    evaluationId?: string;
    succes?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const contexte = await obtenirContexteTitulaire();
  const params = await searchParams;
  const evaluationId = Number(
    params.evaluationId ?? 0
  );

  const evaluations =
    await prisma.evaluation.findMany({
      where: {
        classeId: contexte.classeId,
        anneeScolaireId:
          contexte.anneeScolaireId,
      },
      include: {
        matiere: true,
        periodeAcademique: true,
        typeEvaluation: true,
      },
      orderBy: [
        { dateEvaluation: "desc" },
        { titre: "asc" },
      ],
    });

  const evaluation = evaluationId
    ? await prisma.evaluation.findFirst({
        where: {
          id: evaluationId,
          classeId: contexte.classeId,
          anneeScolaireId:
            contexte.anneeScolaireId,
        },
        include: {
          notes: true,
          matiere: true,
          periodeAcademique: true,
        },
      })
    : null;

  const inscriptions = evaluation
    ? await prisma.inscription.findMany({
        where: {
          classeId: contexte.classeId,
          anneeScolaireId:
            contexte.anneeScolaireId,
          statut: { in: ["inscrit", "admis"] },
        },
        include: { eleve: true },
        orderBy: [
          { eleve: { nom: "asc" } },
          { eleve: { prenom: "asc" } },
        ],
      })
    : [];

  const notesMap = new Map(
    evaluation?.notes.map((note) => [
      note.eleveId,
      note,
    ]) ?? []
  );

  const action = evaluation
    ? enregistrerNotesTitulaire.bind(
        null,
        evaluation.id
      )
    : undefined;

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={`Notes — ${contexte.classeNom}`}
      description="Seules les évaluations de votre classe sont accessibles."
    >
      {params.succes && (
        <div className={styles.succes}>
          Notes enregistrées.
        </div>
      )}

      <section className={styles.panel}>
        <form method="get" className={styles.filtres}>
          <label>
            <span>Évaluation</span>
            <select
              name="evaluationId"
              required
              defaultValue={evaluationId || ""}
            >
              <option value="">
                Sélectionner une évaluation
              </option>
              {evaluations.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.matiere.nom} · {item.titre} ·{" "}
                  {item.periodeAcademique.nom}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">
            <ClipboardList size={17} />
            Afficher
          </button>
        </form>
      </section>

      {evaluation && action ? (
        <form action={action} className={styles.panel}>
          <h2>
            {evaluation.matiere.nom} —{" "}
            {evaluation.titre} /{" "}
            {Number(evaluation.bareme)}
          </h2>

          {evaluation.statut === "PUBLIEE" && (
            <div className={styles.erreur}>
              Évaluation publiée : les notes sont verrouillées.
            </div>
          )}

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Matricule</th>
                  <th>Note</th>
                  <th>Absent</th>
                  <th>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {inscriptions.map((inscription) => {
                  const note = notesMap.get(
                    inscription.eleveId
                  );
                  return (
                    <tr key={inscription.id}>
                      <td>
                        <input
                          type="hidden"
                          name="eleve_id"
                          value={inscription.eleveId}
                        />
                        <strong>
                          {inscription.eleve.nom}{" "}
                          {inscription.eleve.postnom ?? ""}{" "}
                          {inscription.eleve.prenom}
                        </strong>
                      </td>
                      <td>
                        {inscription.eleve.matricule}
                      </td>
                      <td>
                        <input
                          type="number"
                          name={`note_${inscription.eleveId}`}
                          min="0"
                          max={Number(
                            evaluation.bareme
                          )}
                          step="0.01"
                          disabled={
                            evaluation.statut ===
                            "PUBLIEE"
                          }
                          defaultValue={
                            note?.valeur == null
                              ? ""
                              : Number(note.valeur)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          name={`absent_${inscription.eleveId}`}
                          disabled={
                            evaluation.statut ===
                            "PUBLIEE"
                          }
                          defaultChecked={
                            note?.absent ?? false
                          }
                        />
                      </td>
                      <td>
                        <input
                          name={`appreciation_${inscription.eleveId}`}
                          disabled={
                            evaluation.statut ===
                            "PUBLIEE"
                          }
                          defaultValue={
                            note?.appreciation ?? ""
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {evaluation.statut !== "PUBLIEE" && (
            <div className={styles.actions}>
              <button type="submit">
                <Save size={18} />
                Enregistrer les notes
              </button>
            </div>
          )}
        </form>
      ) : (
        <section className={styles.vide}>
          Sélectionnez une évaluation de votre classe.
        </section>
      )}
    </AdminShell>
  );
}
