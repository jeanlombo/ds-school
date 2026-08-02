import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  Clock3,
  Filter,
  Plus,
  BrainCircuit,
  Building2,
  UserRoundCheck,
  School,
  Trash2,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import { supprimerSeance } from "./actions";
import styles from "./emploi-du-temps.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    classe?: string;
    enseignant?: string;
    annee?: string;
    succes?: string;
  }>;
};

const joursDefaut = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
];

export default async function EmploiDuTemps({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [annees, classes, enseignants, joursConfig, creneaux] =
    await Promise.all([
      prisma.anneeScolaire.findMany({
        where: { ecoleId: ecole.id },
        orderBy: [{ active: "desc" }, { dateDebut: "desc" }],
      }),
      prisma.classe.findMany({
        where: { ecoleId: ecole.id, statut: "active" },
        orderBy: { nom: "asc" },
      }),
      prisma.enseignant.findMany({
        where: { ecoleId: ecole.id, statut: "actif" },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.jourOuvrable.findMany({
        where: { ecoleId: ecole.id, actif: true },
        orderBy: { ordre: "asc" },
      }),
      prisma.creneauHoraire.findMany({
        where: { ecoleId: ecole.id, actif: true },
        orderBy: { ordre: "asc" },
      }),
    ]);

  const anneeId =
    Number(params.annee) ||
    annees.find((annee) => annee.active)?.id ||
    annees[0]?.id ||
    0;

  const classeId = Number(params.classe) || 0;
  const enseignantId = Number(params.enseignant) || 0;

  const jours =
    joursConfig.length > 0
      ? joursConfig.map((configuration) => configuration.jour)
      : joursDefaut;

  const seances = anneeId
    ? await prisma.seanceEmploiTemps.findMany({
        where: {
          ecoleId: ecole.id,
          anneeScolaireId: anneeId,
          statut: "ACTIVE",
          ...(classeId > 0 ? { classeId } : {}),
          ...(enseignantId > 0 ? { enseignantId } : {}),
        },
        include: {
          classe: true,
          matiere: true,
          enseignant: true,
          salle: true,
          typeCours: true,
          creneauHoraire: true,
        },
        orderBy: [
          { jour: "asc" },
          { creneauHoraire: { ordre: "asc" } },
        ],
      })
    : [];

  const parCase = new Map(
    seances.map((seance) => [
      `${seance.jour}-${seance.creneauHoraireId}`,
      seance,
    ]),
  );

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Emploi du temps intelligent"
      description="Planifiez les cours et bloquez automatiquement les conflits de classe, d’enseignant et de salle."
      action={
        <Link
          href="/dashboard/emploi-du-temps/nouveau"
          className={styles.primaire}
        >
          <Plus size={18} />
          Nouvelle séance
        </Link>
      }
    >
      <RetourDashboard />

      <section className={styles.raccourcis}>
        <Link href="/dashboard/emploi-du-temps/generation">
          <BrainCircuit size={18} />
          Générer automatiquement
        </Link>
        <Link href="/dashboard/salles">
          <Building2 size={18} />
          Gérer les salles
        </Link>
        <Link href="/dashboard/disponibilites-enseignants">
          <UserRoundCheck size={18} />
          Disponibilités enseignants
        </Link>
      </section>

      {params.succes && (
        <div className={styles.succes}>
          {params.succes === "suppression"
            ? "La séance a été supprimée."
            : "La séance a été ajoutée avec succès."}
        </div>
      )}

      <section className={styles.stats}>
        <article>
          <CalendarClock />
          <div>
            <small>Séances planifiées</small>
            <strong>{seances.length}</strong>
          </div>
        </article>

        <article>
          <School />
          <div>
            <small>Classes disponibles</small>
            <strong>{classes.length}</strong>
          </div>
        </article>

        <article>
          <Users />
          <div>
            <small>Enseignants actifs</small>
            <strong>{enseignants.length}</strong>
          </div>
        </article>

        <article>
          <Clock3 />
          <div>
            <small>Créneaux actifs</small>
            <strong>{creneaux.length}</strong>
          </div>
        </article>
      </section>

      <form className={styles.filtres}>
        <Filter size={18} />

        <select name="annee" defaultValue={String(anneeId)}>
          {annees.map((annee) => (
            <option key={annee.id} value={annee.id}>
              {annee.libelle}
              {annee.active ? " — active" : ""}
            </option>
          ))}
        </select>

        <select name="classe" defaultValue={String(classeId)}>
          <option value="0">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nom}
            </option>
          ))}
        </select>

        <select name="enseignant" defaultValue={String(enseignantId)}>
          <option value="0">Tous les enseignants</option>
          {enseignants.map((enseignant) => (
            <option key={enseignant.id} value={enseignant.id}>
              {enseignant.nom} {enseignant.prenom}
            </option>
          ))}
        </select>

        <button type="submit">Afficher</button>
      </form>

      {!anneeId || creneaux.length === 0 ? (
        <section className={styles.vide}>
          <CalendarClock size={48} />
          <h2>Configuration académique incomplète</h2>
          <p>
            Créez une année scolaire active, les jours ouvrables et les
            créneaux horaires avant de planifier les cours.
          </p>
          <Link href="/dashboard/parametres-academiques">
            Ouvrir les paramètres académiques
          </Link>
        </section>
      ) : (
        <section className={styles.tableCarte}>
          <div className={styles.tableScroll}>
            <table className={styles.grille}>
              <thead>
                <tr>
                  <th>Créneau</th>
                  {jours.map((jour) => (
                    <th key={jour}>
                      {jour.charAt(0) + jour.slice(1).toLowerCase()}
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
                        {creneau.heureDebut} – {creneau.heureFin}
                      </small>
                    </th>

                    {jours.map((jour) => {
                      const seance = parCase.get(
                        `${jour}-${creneau.id}`,
                      );

                      return (
                        <td key={jour}>
                          {seance ? (
                            <article
                              className={styles.seance}
                              style={{
                                borderLeftColor:
                                  seance.matiere.couleur || undefined,
                              }}
                            >
                              <strong>{seance.matiere.nom}</strong>
                              <span>{seance.classe.nom}</span>
                              <small>
                                {seance.enseignant.nom}{" "}
                                {seance.enseignant.prenom}
                              </small>
                              <small>
                                {seance.salle?.nom || "Salle non définie"}
                              </small>

                              <form action={supprimerSeance}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={seance.id}
                                />
                                <button
                                  title="Supprimer la séance"
                                  type="submit"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </form>
                            </article>
                          ) : (
                            <span className={styles.libre}>Libre</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminShell>
  );
}