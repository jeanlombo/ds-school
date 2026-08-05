import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigerEnfantDuParent } from "@/lib/parent-portail";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../../parent.module.css";

export const dynamic = "force-dynamic";
type Props = {
  searchParams: Promise<{
    eleveId?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const params = await searchParams;
  const eleveId = Number(params.eleveId ?? 0);

  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_communication"
  );

  const lignes = await prisma.$queryRaw<
    Array<{
      id: number;
      type_evenement: string;
      titre: string;
      description: string;
      niveau: string;
      date_evenement: Date;
      date_echeance: Date | null;
      statut: string;
      lu: bigint | number;
      reponse_requise: number;
    }>
  >`
    SELECT
      s.id,
      s.type_evenement,
      s.titre,
      s.description,
      s.niveau,
      s.date_evenement,
      s.date_echeance,
      s.statut,
      s.reponse_requise,
      (
        SELECT COUNT(*)
        FROM suivi_parent_lectures l
        WHERE l.evenement_id = s.id
          AND l.parent_id = ${contexte.parentId}
      ) AS lu
    FROM suivi_parent_evenements s
    WHERE s.ecole_id = ${contexte.ecoleId}
      AND s.eleve_id = ${eleveId}
      AND s.visible_parent = 1
    ORDER BY
      CASE s.niveau
        WHEN 'URGENT' THEN 1
        WHEN 'IMPORTANT' THEN 2
        ELSE 3
      END,
      s.created_at DESC
  `;

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre="Alertes et communications"
      description="Informations importantes concernant votre enfant."
    >
      <section className={styles.panel}>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>État</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Date</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((item) => (
                <tr key={item.id}>
                  <td>
                    {Number(item.lu)
                      ? "Lu"
                      : "Nouveau"}
                  </td>
                  <td>{item.type_evenement}</td>
                  <td>
                    <strong>{item.titre}</strong>
                    <small>
                      {item.description.slice(0, 90)}
                      {item.description.length > 90
                        ? "..."
                        : ""}
                    </small>
                  </td>
                  <td>
                    {new Date(
                      item.date_evenement
                    ).toLocaleDateString("fr-FR")}
                  </td>
                  <td>{item.niveau}</td>
                  <td>{item.statut}</td>
                  <td>
                    <Link
                      href={`/dashboard/parent/alertes/${item.id}?eleveId=${eleveId}`}
                      className={styles.action}
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!lignes.length && (
          <div className={styles.vide}>
            <Bell size={42} />
            Aucune alerte pour cet enfant.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
