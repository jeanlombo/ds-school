import { redirect } from "next/navigation";
import {
  CalendarCheck,
  Save,
  UserRoundCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { enregistrerDisponibilites } from "./actions";
import styles from "../emploi-du-temps/emploi-du-temps.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    enseignant?: string;
    succes?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  await exigerPermission(
    "DISPONIBILITES_ENSEIGNANTS_VOIR"
  );

  const utilisateur =
    await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const enseignantId = Number(
    params.enseignant ?? 0
  );

  const [enseignants, jours, creneaux] =
    await Promise.all([
      prisma.enseignant.findMany({
        where: {
          ecoleId: ecole.id,
          statut: "actif",
        },
        orderBy: [
          { nom: "asc" },
          { prenom: "asc" },
        ],
      }),
      prisma.jourOuvrable.findMany({
        where: {
          ecoleId: ecole.id,
          actif: true,
        },
        orderBy: { ordre: "asc" },
      }),
      prisma.creneauHoraire.findMany({
        where: {
          ecoleId: ecole.id,
          actif: true,
        },
        orderBy: { ordre: "asc" },
      }),
    ]);

  const lignes = enseignantId
    ? await prisma.$queryRaw<
        Array<{
          jour: string;
          creneau_horaire_id: number;
        }>
      >`
        SELECT jour, creneau_horaire_id
        FROM disponibilites_enseignants
        WHERE ecole_id = ${ecole.id}
          AND enseignant_id = ${enseignantId}
          AND disponible = 1
      `
    : [];

  const disponibles = new Set(
    lignes.map(
      (ligne) =>
        `${ligne.jour}:${ligne.creneau_horaire_id}`
    )
  );

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Disponibilités des enseignants"
      description="Définissez les jours et créneaux où chaque enseignant peut être planifié."
    >
      {params.succes && (
        <div className={styles.succes}>
          Disponibilités enregistrées.
        </div>
      )}

      <section className={styles.tableCarte}>
        <form method="get" className={styles.filtres}>
          <select
            name="enseignant"
            required
            defaultValue={enseignantId || ""}
          >
            <option value="">
              Sélectionner un enseignant
            </option>
            {enseignants.map((enseignant) => (
              <option
                key={enseignant.id}
                value={enseignant.id}
              >
                {enseignant.nom}{" "}
                {enseignant.postnom ?? ""}{" "}
                {enseignant.prenom}
              </option>
            ))}
          </select>

          <button type="submit">
            <UserRoundCheck size={17} />
            Afficher
          </button>
        </form>
      </section>

      {enseignantId > 0 && (
        <form
          action={enregistrerDisponibilites}
          className={styles.tableCarte}
        >
          <input
            type="hidden"
            name="enseignant_id"
            value={enseignantId}
          />

          <div className={styles.tableScroll}>
            <table className={styles.grille}>
              <thead>
                <tr>
                  <th>Créneau</th>
                  {jours.map((jour) => (
                    <th key={jour.id}>
                      {jour.jour}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {creneaux.map((creneau) => (
                  <tr key={creneau.id}>
                    <th>
                      <strong>{creneau.nom}</strong>
                      <small>
                        {creneau.heureDebut} –{" "}
                        {creneau.heureFin}
                      </small>
                    </th>

                    {jours.map((jour) => {
                      const valeur =
                        `${jour.jour}:${creneau.id}`;

                      return (
                        <td key={jour.id}>
                          <label>
                            <input
                              type="checkbox"
                              name="disponibilites"
                              value={valeur}
                              defaultChecked={disponibles.has(
                                valeur
                              )}
                            />
                            Disponible
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit">
            <Save size={18} />
            Enregistrer les disponibilités
          </button>
        </form>
      )}

      {!enseignantId && (
        <section className={styles.vide}>
          <CalendarCheck size={46} />
          Sélectionnez un enseignant.
        </section>
      )}
    </AdminShell>
  );
}
