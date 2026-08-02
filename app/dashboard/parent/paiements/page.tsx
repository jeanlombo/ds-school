import Link from "next/link";
import { CircleDollarSign, Eye } from "lucide-react";
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

  const paiements = await prisma.$queryRaw<
    Array<{
      id: number;
      numero_paiement: string;
      date_paiement: Date;
      montant_total: number;
      devise: string;
      mode_paiement: string;
      statut: string;
      numero_recu: string | null;
      recu_id: number | null;
    }>
  >`
    SELECT
      p.id,
      p.numero_paiement,
      p.date_paiement,
      p.montant_total,
      p.devise,
      p.mode_paiement,
      p.statut,
      r.numero_recu,
      r.id AS recu_id
    FROM paiements_scolaires p
    INNER JOIN inscriptions i
      ON i.id = p.inscription_id
    LEFT JOIN recus_scolaires r
      ON r.paiement_id = p.id
    WHERE p.ecole_id = ${contexte.ecoleId}
      AND i.eleve_id = ${eleveId}
    ORDER BY p.date_paiement DESC
  `;

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre="Historique des paiements"
      description="Paiements enregistrés pour votre enfant."
    >
      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Paiement</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Mode</th>
                <th>Reçu</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paiements.map((paiement) => (
                <tr key={paiement.id}>
                  <td>{paiement.numero_paiement}</td>
                  <td>{new Date(paiement.date_paiement).toLocaleString("fr-FR")}</td>
                  <td>{Number(paiement.montant_total).toLocaleString("fr-FR")} {paiement.devise}</td>
                  <td>{paiement.mode_paiement}</td>
                  <td>{paiement.numero_recu ?? "—"}</td>
                  <td>{paiement.statut}</td>
                  <td>
                    {paiement.recu_id && (
                      <Link href={`/dashboard/finances/recus/${paiement.recu_id}`}>
                        <Eye size={16} />
                        Voir reçu
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!paiements.length && (
          <div className={styles.vide}>
            <CircleDollarSign size={42} />
            Aucun paiement enregistré.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
