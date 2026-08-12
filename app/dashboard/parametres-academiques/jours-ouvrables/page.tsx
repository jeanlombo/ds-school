import { obtenirOuCreerEcole } from "@/lib/ecole";
import prisma from "@/lib/prisma";
import RetourDashboard from "../RetourDashboard";
import styles from "../parametres-academiques.module.css";
import { enregistrerJours } from "../actions";

export const dynamic = "force-dynamic";

const libelles = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
} as const;

type Props = {
  searchParams: Promise<{ succes?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const ecole = await obtenirOuCreerEcole();
  const { succes } = await searchParams;

  const existants = await prisma.jourOuvrable.findMany({
    where: { ecoleId: ecole.id },
    orderBy: { ordre: "asc" },
  });

  const actifs = new Map(existants.map((j) => [j.jour, j.actif]));

  return (
    <div className={styles.page}>
      <RetourDashboard />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Jours ouvrables</h2>
            <p>
              Sélectionnez les jours utilisés par l&apos;emploi du temps de
              l&apos;école active.
            </p>
          </div>
        </div>

        {succes === "1" && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#e8f8ef",
              color: "#13733d",
              fontWeight: 800,
              border: "1px solid #bfe8cf",
            }}
          >
            Jours ouvrables enregistrés avec succès.
          </div>
        )}

        <form action={enregistrerJours}>
          <div className={styles.switchGrid}>
            {Object.entries(libelles).map(([jour, label]) => {
              const dejaConfigure = actifs.has(jour);
              const actif = dejaConfigure
                ? Boolean(actifs.get(jour))
                : !["SAMEDI", "DIMANCHE"].includes(jour);

              return (
                <label className={styles.switchCard} key={jour}>
                  <strong>{label}</strong>
                  <input
                    type="checkbox"
                    name={jour}
                    defaultChecked={actif}
                  />
                </label>
              );
            })}
          </div>

          <div className={styles.actions} style={{ marginTop: 18 }}>
            <button type="submit" className={styles.primary}>
              Enregistrer les jours
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
