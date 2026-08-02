import { redirect } from "next/navigation";
import { GraduationCap, Link2, Power } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import {
  affecterTitulaire,
  desactiverTitulaire,
} from "./actions";
import styles from "../titulaire/titulaire.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  await exigerPermission("TITULAIRES_GERER");

  const utilisateur =
    await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [comptes, enseignants, classes, annees, affectations] =
    await Promise.all([
      prisma.$queryRaw<
        Array<{ id: number; nom: string; email: string }>
      >`
        SELECT id, nom, email
        FROM utilisateurs_securite
        WHERE ecole_id = ${ecole.id}
          AND statut = 'ACTIF'
        ORDER BY nom ASC
      `,
      prisma.enseignant.findMany({
        where: {
          ecoleId: ecole.id,
          statut: "actif",
        },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.classe.findMany({
        where: {
          ecoleId: ecole.id,
          statut: "active",
        },
        include: { section: true },
        orderBy: { nom: "asc" },
      }),
      prisma.anneeScolaire.findMany({
        where: { ecoleId: ecole.id },
        orderBy: [
          { active: "desc" },
          { dateDebut: "desc" },
        ],
      }),
      prisma.$queryRaw<
        Array<{
          id: number;
          utilisateur_nom: string;
          utilisateur_email: string;
          enseignant_nom: string;
          classe_nom: string;
          annee_libelle: string;
          actif: number;
        }>
      >`
        SELECT
          tc.id,
          us.nom AS utilisateur_nom,
          us.email AS utilisateur_email,
          CONCAT_WS(' ', ens.nom, ens.postnom, ens.prenom)
            AS enseignant_nom,
          c.nom AS classe_nom,
          a.libelle AS annee_libelle,
          tc.actif
        FROM titulaires_classes tc
        INNER JOIN utilisateurs_securite us
          ON us.id = tc.utilisateur_securite_id
        INNER JOIN enseignants ens
          ON ens.id = tc.enseignant_id
        INNER JOIN classes c
          ON c.id = tc.classe_id
        INNER JOIN annees_scolaires a
          ON a.id = tc.annee_scolaire_id
        WHERE tc.ecole_id = ${ecole.id}
        ORDER BY tc.actif DESC, a.active DESC, c.nom ASC
      `,
    ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Affectation des titulaires"
      description="Reliez un compte utilisateur, un enseignant et une classe."
    >
      {params.succes && (
        <div className={styles.succes}>
          Affectation enregistrée avec succès.
        </div>
      )}

      {params.erreur && (
        <div className={styles.erreur}>
          Vérifiez tous les champs sélectionnés.
        </div>
      )}

      <section className={styles.panel}>
        <h2>
          <Link2 size={20} />
          Nouvelle affectation
        </h2>

        <form
          action={affecterTitulaire}
          className={styles.formulaire}
        >
          <label>
            <span>Compte de connexion *</span>
            <select
              name="utilisateur_securite_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner le compte
              </option>
              {comptes.map((compte) => (
                <option
                  key={compte.id}
                  value={compte.id}
                >
                  {compte.nom} — {compte.email}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Dossier enseignant *</span>
            <select
              name="enseignant_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner l’enseignant
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
          </label>

          <label>
            <span>Classe titulaire *</span>
            <select
              name="classe_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Sélectionner la classe
              </option>
              {classes.map((classe) => (
                <option
                  key={classe.id}
                  value={classe.id}
                >
                  {classe.nom} — {classe.section.nom}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Année scolaire *</span>
            <select
              name="annee_scolaire_id"
              required
              defaultValue={
                annees.find((annee) => annee.active)
                  ?.id ?? ""
              }
            >
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.libelle}
                  {annee.active ? " — Active" : ""}
                </option>
              ))}
            </select>
          </label>

          <button type="submit">
            <GraduationCap size={18} />
            Affecter comme titulaire
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Affectations enregistrées</h2>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Compte</th>
                <th>Enseignant</th>
                <th>Classe</th>
                <th>Année</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {affectations.map((affectation) => (
                <tr key={affectation.id}>
                  <td>
                    <strong>
                      {affectation.utilisateur_nom}
                    </strong>
                    <small>
                      {affectation.utilisateur_email}
                    </small>
                  </td>
                  <td>{affectation.enseignant_nom}</td>
                  <td>{affectation.classe_nom}</td>
                  <td>{affectation.annee_libelle}</td>
                  <td>
                    {affectation.actif
                      ? "ACTIF"
                      : "INACTIF"}
                  </td>
                  <td>
                    {Boolean(affectation.actif) && (
                      <form action={desactiverTitulaire}>
                        <input
                          type="hidden"
                          name="id"
                          value={affectation.id}
                        />
                        <button type="submit">
                          <Power size={16} />
                          Désactiver
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
