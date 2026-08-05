import Link from "next/link";
import {
  CalendarClock,
  Clock3,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import { prisma } from "@/lib/prisma";
import {
  basculerPlageHoraire,
  creerPlageHoraire,
  supprimerPlageHoraire,
} from "./actions";
import styles from "./horaires.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

type Plage = {
  id: number;
  nom: string;
  type_passage: "ENTREE" | "SORTIE";
  heure_debut: string;
  heure_fin: string;
  jours_semaine: string;
  classe_id: number | null;
  classe_nom: string | null;
  tolerance_doublon_secondes: number;
  fuseau_horaire: string;
  actif: number;
};

const JOURS = [
  { valeur: "1", libelle: "Lundi" },
  { valeur: "2", libelle: "Mardi" },
  { valeur: "3", libelle: "Mercredi" },
  { valeur: "4", libelle: "Jeudi" },
  { valeur: "5", libelle: "Vendredi" },
  { valeur: "6", libelle: "Samedi" },
  { valeur: "0", libelle: "Dimanche" },
];

export default async function Page({
  searchParams,
}: Props) {
  await exigerPermission(
    "SAFE_CAMPUS_VOIR",
    "Configuration plages horaires Safe Campus"
  );

  const utilisateur =
    await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const query = await searchParams;

  const [classes, plages] = await Promise.all([
    prisma.classe.findMany({
      where: {
        ecoleId: ecole.id,
      },
      select: {
        id: true,
        nom: true,
      },
      orderBy: {
        nom: "asc",
      },
    }),
    prisma.$queryRaw<Plage[]>`
      SELECT
        p.id,
        p.nom,
        p.type_passage,
        TIME_FORMAT(
          p.heure_debut,
          '%H:%i'
        ) AS heure_debut,
        TIME_FORMAT(
          p.heure_fin,
          '%H:%i'
        ) AS heure_fin,
        p.jours_semaine,
        p.classe_id,
        c.nom AS classe_nom,
        p.tolerance_doublon_secondes,
        p.fuseau_horaire,
        p.actif
      FROM safe_campus_plages_horaires p
      LEFT JOIN classes c
        ON c.id = p.classe_id
      WHERE p.ecole_id = ${ecole.id}
      ORDER BY
        p.actif DESC,
        p.heure_debut ASC,
        p.nom ASC
    `,
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Horaires Safe Campus"
      description="Configurez les heures d’entrée et de sortie par classe, vacation ou niveau d’étude."
    >
      <div className={styles.retour}>
        <Link href="/dashboard/safe-campus">
          ← Retour à Safe Campus
        </Link>
      </div>

      {query.succes && (
        <div className={styles.succes}>
          Plage horaire enregistrée.
        </div>
      )}

      {query.erreur && (
        <div className={styles.erreur}>
          Complétez le nom, le type, les heures et au moins un jour.
        </div>
      )}

      <section className={styles.grille}>
        <article className={styles.panel}>
          <header>
            <div>
              <span>NOUVELLE CONFIGURATION</span>
              <h2>
                <Plus size={20} />
                Ajouter une plage
              </h2>
            </div>
            <CalendarClock size={25} />
          </header>

          <form
            action={creerPlageHoraire}
            className={styles.formulaire}
          >
            <label className={styles.large}>
              <span>Nom de la plage *</span>
              <input
                name="nom"
                required
                placeholder="Ex. Primaire matin — Entrée"
              />
            </label>

            <label>
              <span>Type *</span>
              <select
                name="type_passage"
                required
                defaultValue="ENTREE"
              >
                <option value="ENTREE">
                  Entrée
                </option>
                <option value="SORTIE">
                  Sortie
                </option>
              </select>
            </label>

            <label>
              <span>Classe concernée</span>
              <select
                name="classe_id"
                defaultValue=""
              >
                <option value="">
                  Toutes les classes
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
              <span>Heure de début *</span>
              <input
                type="time"
                name="heure_debut"
                required
              />
            </label>

            <label>
              <span>Heure de fin *</span>
              <input
                type="time"
                name="heure_fin"
                required
              />
            </label>

            <label>
              <span>Anti-double scan</span>
              <input
                type="number"
                name="tolerance_doublon_secondes"
                min="10"
                max="3600"
                defaultValue="120"
              />
              <small>Durée en secondes.</small>
            </label>

            <label>
              <span>Fuseau horaire</span>
              <select
                name="fuseau_horaire"
                defaultValue="Africa/Kinshasa"
              >
                <option value="Africa/Kinshasa">
                  Kinshasa
                </option>
                <option value="Africa/Lubumbashi">
                  Lubumbashi / Kisangani
                </option>
              </select>
            </label>

            <fieldset className={styles.large}>
              <legend>Jours d’application *</legend>

              <div className={styles.jours}>
                {JOURS.map((jour) => (
                  <label key={jour.valeur}>
                    <input
                      type="checkbox"
                      name="jours"
                      value={jour.valeur}
                      defaultChecked={[
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                      ].includes(jour.valeur)}
                    />
                    <span>{jour.libelle}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              className={styles.primaire}
            >
              <Clock3 size={18} />
              Enregistrer la plage
            </button>
          </form>
        </article>

        <article className={styles.panel}>
          <header>
            <div>
              <span>CONFIGURATIONS ACTIVES</span>
              <h2>Plages enregistrées</h2>
            </div>
            <Clock3 size={25} />
          </header>

          <div className={styles.liste}>
            {plages.map((plage) => (
              <div
                key={plage.id}
                className={`${styles.plage} ${
                  plage.actif
                    ? ""
                    : styles.inactive
                }`}
              >
                <div className={styles.plageTitre}>
                  <div>
                    <strong>{plage.nom}</strong>
                    <span>
                      {plage.classe_nom ||
                        "Toutes les classes"}
                    </span>
                  </div>

                  <b
                    className={
                      plage.type_passage ===
                      "ENTREE"
                        ? styles.entree
                        : styles.sortie
                    }
                  >
                    {plage.type_passage}
                  </b>
                </div>

                <div className={styles.heure}>
                  {plage.heure_debut} →{" "}
                  {plage.heure_fin}
                </div>

                <small>
                  Jours : {plage.jours_semaine} •
                  Anti-double scan :{" "}
                  {
                    plage.tolerance_doublon_secondes
                  }{" "}
                  s
                </small>

                <div className={styles.actions}>
                  <form
                    action={basculerPlageHoraire}
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={plage.id}
                    />
                    <button type="submit">
                      <Power size={16} />
                      {plage.actif
                        ? "Désactiver"
                        : "Activer"}
                    </button>
                  </form>

                  <form
                    action={supprimerPlageHoraire}
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={plage.id}
                    />
                    <button
                      type="submit"
                      className={styles.danger}
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {!plages.length && (
              <div className={styles.vide}>
                Aucune plage horaire configurée.
              </div>
            )}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
