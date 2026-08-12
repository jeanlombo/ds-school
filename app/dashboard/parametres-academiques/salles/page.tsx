import { obtenirOuCreerEcole } from "@/lib/ecole";
import prisma from "@/lib/prisma";
import RetourDashboard from "../RetourDashboard";
import styles from "../parametres-academiques.module.css";
import { ajouterSalle, supprimerSalle } from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ succes?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const ecole = await obtenirOuCreerEcole();
  const { succes } = await searchParams;

  const items = await prisma.salle.findMany({
    where: { ecoleId: ecole.id },
    orderBy: { nom: "asc" },
  });

  return (
    <div className={styles.page}>
      <RetourDashboard />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Salles de cours</h2>
            <p>Locaux disponibles pour les cours et examens de l&apos;école active.</p>
          </div>
        </div>

        {succes === "1" && (
          <div style={{marginBottom:18,padding:"12px 14px",borderRadius:12,background:"#e8f8ef",color:"#13733d",fontWeight:800,border:"1px solid #bfe8cf"}}>
            Salle ajoutée avec succès.
          </div>
        )}

        <form action={ajouterSalle} className={styles.form}>
          <label>Code<input name="code" required /></label>
          <label>Nom<input name="nom" required /></label>

          <label>
            Type
            <select name="type">
              <option>CLASSE</option>
              <option>LABORATOIRE</option>
              <option>INFORMATIQUE</option>
              <option>BIBLIOTHEQUE</option>
              <option>POLYVALENTE</option>
              <option>SPORT</option>
            </select>
          </label>

          <label>Capacité<input type="number" name="capacite" min="1" defaultValue="40" /></label>
          <label>Bâtiment<input name="batiment" /></label>
          <label>Étage<input name="etage" /></label>
          <label>Responsable<input name="responsable" /></label>

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
                <th>Salle</th>
                <th>Type</th>
                <th>Capacité</th>
                <th>Localisation</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>{x.code}</td>
                  <td>{x.nom}</td>
                  <td>{x.type}</td>
                  <td>{x.capacite}</td>
                  <td>{[x.batiment, x.etage].filter(Boolean).join(" / ") || "—"}</td>
                  <td>{x.statut}</td>
                  <td>
                    <form action={supprimerSalle}>
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
