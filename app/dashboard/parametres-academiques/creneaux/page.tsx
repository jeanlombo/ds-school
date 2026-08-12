import { obtenirOuCreerEcole } from "@/lib/ecole";
import prisma from "@/lib/prisma";
import RetourDashboard from "../RetourDashboard";
import styles from "../parametres-academiques.module.css";
import { ajouterCreneau, supprimerCreneau } from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ succes?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const ecole = await obtenirOuCreerEcole();
  const { succes } = await searchParams;

  const items = await prisma.creneauHoraire.findMany({
    where: { ecoleId: ecole.id },
    orderBy: { ordre: "asc" },
  });

  return (
    <div className={styles.page}>
      <RetourDashboard />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Créneaux horaires</h2>
            <p>Périodes de cours ordonnées de l&apos;école active.</p>
          </div>
        </div>

        {succes === "1" && (
          <div style={{marginBottom:18,padding:"12px 14px",borderRadius:12,background:"#e8f8ef",color:"#13733d",fontWeight:800,border:"1px solid #bfe8cf"}}>
            Créneau ajouté avec succès.
          </div>
        )}

        <form action={ajouterCreneau} className={styles.form}>
          <label>
            Nom
            <input name="nom" placeholder="1re période" required />
          </label>

          <label>
            Ordre
            <input type="number" min="1" name="ordre" required />
          </label>

          <label>
            Heure début
            <input type="time" name="heureDebut" required />
          </label>

          <label>
            Heure fin
            <input type="time" name="heureFin" required />
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
                <th>Ordre</th>
                <th>Nom</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>{x.ordre}</td>
                  <td>{x.nom}</td>
                  <td>{x.heureDebut}</td>
                  <td>{x.heureFin}</td>
                  <td>
                    <span className={x.actif ? styles.statusOn : styles.statusOff}>
                      {x.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <form action={supprimerCreneau}>
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
