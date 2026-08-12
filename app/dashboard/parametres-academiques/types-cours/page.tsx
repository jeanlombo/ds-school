import { obtenirOuCreerEcole } from "@/lib/ecole";
import prisma from "@/lib/prisma";
import RetourDashboard from "../RetourDashboard";
import styles from "../parametres-academiques.module.css";
import { ajouterTypeCours, supprimerTypeCours } from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ succes?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const ecole = await obtenirOuCreerEcole();
  const { succes } = await searchParams;

  const items = await prisma.typeCours.findMany({
    where: { ecoleId: ecole.id },
    orderBy: { nom: "asc" },
  });

  return (
    <div className={styles.page}>
      <RetourDashboard />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Types de cours</h2>
            <p>Catégories réutilisables dans l&apos;emploi du temps de l&apos;école active.</p>
          </div>
        </div>

        {succes === "1" && (
          <div style={{marginBottom:18,padding:"12px 14px",borderRadius:12,background:"#e8f8ef",color:"#13733d",fontWeight:800,border:"1px solid #bfe8cf"}}>
            Type de cours ajouté avec succès.
          </div>
        )}

        <form action={ajouterTypeCours} className={styles.form}>
          <label>Code<input name="code" required /></label>
          <label>Nom<input name="nom" required /></label>
          <label>Couleur<input type="color" name="couleur" defaultValue="#1761A8" /></label>

          <label className={styles.full}>
            Description
            <textarea name="description" rows={2} />
          </label>

          <div className={styles.actions}>
            <button type="submit" className={styles.primary}>Ajouter</button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>{x.code}</td>
                  <td><strong>{x.nom}</strong></td>
                  <td>{x.description || "—"}</td>
                  <td>
                    <span className={x.actif ? styles.statusOn : styles.statusOff}>
                      {x.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <form action={supprimerTypeCours}>
                      <input type="hidden" name="id" value={x.id} />
                      <button type="submit" className={styles.danger}>Supprimer</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
