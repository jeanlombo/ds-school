import { CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigerEnfantDuParent } from "@/lib/parent-portail";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../parent.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ eleveId?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const eleveId = Number(params.eleveId ?? 0);
  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_academique"
  );

  const lignes = await prisma.$queryRaw<
    Array<{
      date_presence: Date;
      statut: string;
      observation: string | null;
    }>
  >`
    SELECT date_presence, statut, observation
    FROM presences_titulaires
    WHERE ecole_id = ${contexte.ecoleId}
      AND eleve_id = ${eleveId}
    ORDER BY date_presence DESC
    LIMIT 300
  `;

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre="Présences et retards"
      description="Historique de présence de votre enfant."
    >
      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Statut</th>
                <th>Observation</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne, index) => (
                <tr key={`${ligne.date_presence}-${index}`}>
                  <td>{new Date(ligne.date_presence).toLocaleDateString("fr-FR")}</td>
                  <td>{ligne.statut}</td>
                  <td>{ligne.observation ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!lignes.length && (
          <div className={styles.vide}>
            <CalendarCheck size={42} />
            Aucun enregistrement de présence.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
