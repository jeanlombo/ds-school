import { redirect } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";

import RetourDashboard from "../RetourDashboard";
import {
  creerTypeEvaluation,
  supprimerTypeEvaluation,
} from "../actions";

import styles from "../centre-academique.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const parametres = await searchParams;

  const types = await prisma.typeEvaluation.findMany({
    where: {
      ecoleId: ecole.id,
    },
    orderBy: {
      nom: "asc",
    },
    include: {
      _count: {
        select: {
          evaluations: true,
        },
      },
    },
  });

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Types d’évaluations"
      description="Configurez les catégories et les coefficients par défaut."
    >
      <div className={styles.page}>
        <RetourDashboard />

        {parametres.succes && (
          <div className={styles.message}>
            Opération effectuée avec succès.
          </div>
        )}

        {parametres.erreur && (
          <div className={styles.erreur}>
            Code déjà utilisé ou champs incomplets.
          </div>
        )}

        <div className={styles.two}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h3>Nouveau type</h3>
                <p>Ex. Interrogation, Devoir, Examen.</p>
              </div>
            </div>

            <form action={creerTypeEvaluation} className={styles.form}>
              <label>
                Nom
                <input name="nom" required />
              </label>

              <label>
                Code
                <input name="code" required />
              </label>

              <label>
                Coefficient
                <input
                  name="coefficient"
                  type="number"
                  step="0.25"
                  min="0.25"
                  defaultValue="1"
                  required
                />
              </label>

              <label className={styles.full}>
                Couleur
                <input
                  name="couleur"
                  type="color"
                  defaultValue="#1761A8"
                />
              </label>

              <div className={styles.formActions}>
                <button type="submit" className={styles.btn}>
                  <Plus size={17} />
                  Ajouter
                </button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>Types configurés</h3>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Coefficient</th>
                    <th>Utilisations</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {types.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        Aucun type d’évaluation configuré.
                      </td>
                    </tr>
                  ) : (
                    types.map((typeEvaluation) => (
                      <tr key={typeEvaluation.id}>
                        <td>
                          <b
                            style={{
                              borderLeft: `5px solid ${typeEvaluation.couleur}`,
                              paddingLeft: 9,
                            }}
                          >
                            {typeEvaluation.nom}
                          </b>
                          <br />
                          <small>{typeEvaluation.code}</small>
                        </td>

                        <td>{Number(typeEvaluation.coefficient)}</td>

                        <td>{typeEvaluation._count.evaluations}</td>

                        <td>
                          <form action={supprimerTypeEvaluation}>
                            <input
                              type="hidden"
                              name="id"
                              value={typeEvaluation.id}
                            />

                            <button
                              type="submit"
                              className={styles.btnDanger}
                              title="Supprimer"
                              aria-label={`Supprimer ${typeEvaluation.nom}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}