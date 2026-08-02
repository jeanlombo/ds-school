import Link from "next/link";
import { Eye, Printer, ReceiptText } from "lucide-react";
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
    "autorise_finances"
  );

  const recus = await prisma.$queryRaw<
    Array<{
      id: number;
      numero_recu: string;
      date_paiement: Date;
      montant_total: number;
      devise: string;
      statut: string;
    }>
  >`
    SELECT
      r.id,
      r.numero_recu,
      p.date_paiement,
      p.montant_total,
      p.devise,
      r.statut
    FROM recus_scolaires r
    INNER JOIN paiements_scolaires p
      ON p.id = r.paiement_id
    INNER JOIN inscriptions i
      ON i.id = p.inscription_id
    WHERE r.ecole_id = ${contexte.ecoleId}
      AND i.eleve_id = ${eleveId}
    ORDER BY p.date_paiement DESC
  `;

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre="Reçus scolaires"
      description="Consultez et réimprimez les reçus autorisés."
    >
      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Reçu</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recus.map((recu) => (
                <tr key={recu.id}>
                  <td>{recu.numero_recu}</td>
                  <td>{new Date(recu.date_paiement).toLocaleString("fr-FR")}</td>
                  <td>{Number(recu.montant_total).toLocaleString("fr-FR")} {recu.devise}</td>
                  <td>{recu.statut}</td>
                  <td>
                    <div className={styles.actionsLigne}>
                      <Link href={`/dashboard/finances/recus/${recu.id}`}>
                        <Eye size={16} /> Voir
                      </Link>
                      <Link href={`/dashboard/finances/recus/${recu.id}?format=pos80`}>
                        <Printer size={16} /> POS
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!recus.length && (
          <div className={styles.vide}>
            <ReceiptText size={42} />
            Aucun reçu disponible.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
