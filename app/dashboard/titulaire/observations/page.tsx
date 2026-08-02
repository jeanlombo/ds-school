import { MessageSquareText, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import AdminShell from "@/components/admin/AdminShell";
import { ajouterObservationTitulaire } from "./actions";
import styles from "../titulaire.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    eleveId?: string;
    succes?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const contexte = await obtenirContexteTitulaire();
  const params = await searchParams;
  const eleveId = Number(params.eleveId ?? 0);

  const inscriptions =
    await prisma.inscription.findMany({
      where: {
        classeId: contexte.classeId,
        anneeScolaireId:
          contexte.anneeScolaireId,
        statut: { in: ["inscrit", "admis"] },
      },
      include: { eleve: true },
      orderBy: [
        { eleve: { nom: "asc" } },
        { eleve: { prenom: "asc" } },
      ],
    });

  const eleve = inscriptions.find(
    (ligne) => ligne.eleveId === eleveId
  )?.eleve;

  const observations = eleve
    ? await prisma.observationEleve.findMany({
        where: { eleveId: eleve.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={`Observations — ${contexte.classeNom}`}
      description="Ajoutez des observations uniquement pour les élèves de votre classe."
    >
      {params.succes && (
        <div className={styles.succes}>
          Observation ajoutée.
        </div>
      )}

      <section className={styles.panel}>
        <form method="get" className={styles.filtres}>
          <label>
            <span>Élève</span>
            <select
              name="eleveId"
              required
              defaultValue={eleveId || ""}
            >
              <option value="">
                Sélectionner un élève
              </option>
              {inscriptions.map((inscription) => (
                <option
                  key={inscription.id}
                  value={inscription.eleveId}
                >
                  {inscription.eleve.nom}{" "}
                  {inscription.eleve.postnom ?? ""}{" "}
                  {inscription.eleve.prenom}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">
            <MessageSquareText size={17} />
            Afficher
          </button>
        </form>
      </section>

      {eleve && (
        <>
          <section className={styles.panel}>
            <h2>Nouvelle observation</h2>
            <form
              action={ajouterObservationTitulaire}
              className={styles.formulaire}
            >
              <input
                type="hidden"
                name="eleve_id"
                value={eleve.id}
              />
              <label className={styles.large}>
                <span>Contenu *</span>
                <textarea
                  name="contenu"
                  rows={4}
                  required
                />
              </label>
              <button type="submit">
                <Save size={18} />
                Enregistrer
              </button>
            </form>
          </section>

          <section className={styles.panel}>
            <h2>Historique</h2>
            <div className={styles.listeObservations}>
              {observations.map((observation) => (
                <article key={observation.id}>
                  <p>{observation.contenu}</p>
                  <small>
                    {observation.auteur ?? "—"} ·{" "}
                    {observation.createdAt.toLocaleString(
                      "fr-FR"
                    )}
                  </small>
                </article>
              ))}

              {!observations.length && (
                <p>Aucune observation.</p>
              )}
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}
