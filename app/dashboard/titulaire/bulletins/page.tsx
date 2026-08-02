import Link from "next/link";
import { FileText, Printer, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import { calculerResultats } from "@/app/dashboard/centre-academique/resultats/calculs";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../titulaire.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    periodeId?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const contexte = await obtenirContexteTitulaire();
  const params = await searchParams;
  const periodeId = Number(
    params.periodeId ?? 0
  );

  const periodes =
    await prisma.periodeAcademique.findMany({
      where: {
        anneeScolaireId:
          contexte.anneeScolaireId,
      },
      include: { anneeScolaire: true },
      orderBy: { ordre: "asc" },
    });

  const synthese = await calculerResultats(
    contexte.ecoleId,
    contexte.classeId,
    periodeId
  );

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={`Bulletins — ${contexte.classeNom}`}
      description="Bulletins limités à votre classe titulaire."
    >
      <section className={styles.panel}>
        <form method="get" className={styles.filtres}>
          <label>
            <span>Période</span>
            <select
              name="periodeId"
              required
              defaultValue={periodeId || ""}
            >
              <option value="">
                Sélectionner une période
              </option>
              {periodes.map((periode) => (
                <option
                  key={periode.id}
                  value={periode.id}
                >
                  {periode.nom}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">
            <Search size={17} />
            Afficher
          </button>
        </form>
      </section>

      {periodeId ? (
        <section className={styles.panel}>
          <h2>
            <FileText size={20} />
            {synthese.lignes.length} bulletin(s)
          </h2>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Matricule</th>
                  <th>Élève</th>
                  <th>Moyenne</th>
                  <th>Mention</th>
                  <th>Bulletin</th>
                </tr>
              </thead>
              <tbody>
                {synthese.lignes.map((ligne) => (
                  <tr key={ligne.inscriptionId}>
                    <td>#{ligne.rang}</td>
                    <td>{ligne.matricule}</td>
                    <td>
                      <strong>
                        {ligne.nomComplet}
                      </strong>
                    </td>
                    <td>
                      {ligne.moyenne.toFixed(2)} %
                    </td>
                    <td>{ligne.mention}</td>
                    <td>
                      <Link
                        href={`/dashboard/centre-academique/bulletins/${ligne.inscriptionId}?classeId=${contexte.classeId}&periodeId=${periodeId}`}
                      >
                        <Printer size={16} />
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className={styles.vide}>
          Sélectionnez une période académique.
        </section>
      )}
    </AdminShell>
  );
}
