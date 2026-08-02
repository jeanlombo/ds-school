import { redirect } from "next/navigation";
import {
  BrainCircuit,
  CalendarPlus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { genererPlanification } from "./actions";
import styles from "../emploi-du-temps.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
    creees?: string;
    manquantes?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  await exigerPermission(
    "EMPLOI_DU_TEMPS_GENERER"
  );

  const utilisateur =
    await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [
    annees,
    classes,
    matieres,
    enseignants,
    salles,
    typesCours,
  ] = await Promise.all([
    prisma.anneeScolaire.findMany({
      where: { ecoleId: ecole.id },
      orderBy: [
        { active: "desc" },
        { dateDebut: "desc" },
      ],
    }),
    prisma.classe.findMany({
      where: {
        ecoleId: ecole.id,
        statut: "active",
      },
      orderBy: { nom: "asc" },
    }),
    prisma.matiere.findMany({
      where: { statut: "ACTIF" },
      orderBy: { nom: "asc" },
    }),
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
    prisma.salle.findMany({
      where: {
        ecoleId: ecole.id,
        statut: "ACTIVE",
      },
      orderBy: { nom: "asc" },
    }),
    prisma.typeCours.findMany({
      where: {
        ecoleId: ecole.id,
        actif: true,
      },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Génération intelligente"
      description="DS School recherche automatiquement les créneaux sans conflit."
    >
      {params.succes && (
        <div className={styles.succes}>
          {params.creees ?? "0"} séance(s)
          créée(s).{" "}
          {params.manquantes ?? "0"} séance(s)
          non placée(s).
        </div>
      )}

      {params.erreur && (
        <div className={styles.erreur}>
          Vérifiez les champs obligatoires.
        </div>
      )}

      <section className={styles.tableCarte}>
        <div className={styles.heroMini}>
          <div>
            <span>MOTEUR DE PLANIFICATION</span>
            <h2>
              Générer sans conflits
            </h2>
            <p>
              Le moteur contrôle la classe,
              l’enseignant, la salle et les
              disponibilités.
            </p>
          </div>
          <BrainCircuit size={64} />
        </div>

        <form
          action={genererPlanification}
          className={styles.formulaire}
        >
          <label>
            <span>Année scolaire *</span>
            <select
              name="annee_scolaire_id"
              required
              defaultValue={
                annees.find((a) => a.active)
                  ?.id ?? ""
              }
            >
              {annees.map((annee) => (
                <option
                  key={annee.id}
                  value={annee.id}
                >
                  {annee.libelle}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Classe *</span>
            <select
              name="classe_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner
              </option>
              {classes.map((classe) => (
                <option
                  key={classe.id}
                  value={classe.id}
                >
                  {classe.nom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Matière *</span>
            <select
              name="matiere_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner
              </option>
              {matieres.map((matiere) => (
                <option
                  key={matiere.id}
                  value={matiere.id}
                >
                  {matiere.nom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Enseignant *</span>
            <select
              name="enseignant_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner
              </option>
              {enseignants.map((enseignant) => (
                <option
                  key={enseignant.id}
                  value={enseignant.id}
                >
                  {enseignant.nom}{" "}
                  {enseignant.prenom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Salle</span>
            <select
              name="salle_id"
              defaultValue="0"
            >
              <option value="0">
                Automatique / aucune
              </option>
              {salles.map((salle) => (
                <option
                  key={salle.id}
                  value={salle.id}
                >
                  {salle.nom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Type de cours</span>
            <select
              name="type_cours_id"
              defaultValue="0"
            >
              <option value="0">
                Non défini
              </option>
              {typesCours.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.nom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>
              Volume hebdomadaire *
            </span>
            <input
              type="number"
              min="1"
              max="20"
              name="volume_hebdomadaire"
              defaultValue="2"
              required
            />
          </label>

          <button type="submit">
            <CalendarPlus size={18} />
            Générer automatiquement
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
