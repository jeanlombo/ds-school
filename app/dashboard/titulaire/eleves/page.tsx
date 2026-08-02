import Link from "next/link";
import { MessageSquareText, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../titulaire.module.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  const contexte = await obtenirContexteTitulaire();

  const inscriptions = await prisma.inscription.findMany({
    where: {
      classeId: contexte.classeId,
      anneeScolaireId:
        contexte.anneeScolaireId,
      statut: { in: ["inscrit", "admis"] },
    },
    include: {
      eleve: true,
    },
    orderBy: [
      { eleve: { nom: "asc" } },
      { eleve: { prenom: "asc" } },
    ],
  });

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={`Mes élèves — ${contexte.classeNom}`}
      description="Liste strictement limitée à votre classe titulaire."
    >
      <section className={styles.panel}>
        <h2>
          <UsersRound size={20} />
          {inscriptions.length} élève(s)
        </h2>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Sexe</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {inscriptions.map((inscription) => (
                <tr key={inscription.id}>
                  <td>{inscription.eleve.matricule}</td>
                  <td>
                    <strong>
                      {inscription.eleve.nom}{" "}
                      {inscription.eleve.postnom ?? ""}{" "}
                      {inscription.eleve.prenom}
                    </strong>
                  </td>
                  <td>{inscription.eleve.sexe}</td>
                  <td>{inscription.statut}</td>
                  <td>
                    <Link
                      href={`/dashboard/titulaire/observations?eleveId=${inscription.eleveId}`}
                    >
                      <MessageSquareText size={16} />
                      Observation
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
