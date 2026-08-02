import { CalendarCheck, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import AdminShell from "@/components/admin/AdminShell";
import { enregistrerPresences } from "./actions";
import styles from "../titulaire.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    date?: string;
    succes?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const contexte = await obtenirContexteTitulaire();
  const params = await searchParams;
  const date =
    params.date ??
    new Date().toISOString().slice(0, 10);

  const [inscriptions, existantes] =
    await Promise.all([
      prisma.inscription.findMany({
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
      }),
      prisma.$queryRaw<
        Array<{
          eleve_id: number;
          statut: string;
          observation: string | null;
        }>
      >`
        SELECT eleve_id, statut, observation
        FROM presences_titulaires
        WHERE ecole_id = ${contexte.ecoleId}
          AND classe_id = ${contexte.classeId}
          AND date_presence = ${date}
      `,
    ]);

  const presenceMap = new Map(
    existantes.map((ligne) => [
      ligne.eleve_id,
      ligne,
    ])
  );

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={`Présences — ${contexte.classeNom}`}
      description="Saisie quotidienne limitée aux élèves de votre classe."
    >
      {params.succes && (
        <div className={styles.succes}>
          Présences enregistrées.
        </div>
      )}

      <section className={styles.panel}>
        <form method="get" className={styles.filtres}>
          <label>
            <span>Date</span>
            <input
              type="date"
              name="date"
              defaultValue={date}
            />
          </label>
          <button type="submit">
            <CalendarCheck size={17} />
            Afficher
          </button>
        </form>
      </section>

      <form
        action={enregistrerPresences}
        className={styles.panel}
      >
        <input
          type="hidden"
          name="date_presence"
          value={date}
        />

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Élève</th>
                <th>Matricule</th>
                <th>Statut</th>
                <th>Observation</th>
              </tr>
            </thead>

            <tbody>
              {inscriptions.map((inscription) => {
                const presence = presenceMap.get(
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
                      <select
                        name={`statut_${inscription.eleveId}`}
                        defaultValue={
                          presence?.statut ?? "PRESENT"
                        }
                      >
                        <option value="PRESENT">
                          Présent
                        </option>
                        <option value="ABSENT">
                          Absent
                        </option>
                        <option value="RETARD">
                          Retard
                        </option>
                        <option value="EXCUSE">
                          Excusé
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        name={`observation_${inscription.eleveId}`}
                        defaultValue={
                          presence?.observation ?? ""
                        }
                        placeholder="Facultatif"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.actions}>
          <button type="submit">
            <Save size={18} />
            Enregistrer les présences
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
