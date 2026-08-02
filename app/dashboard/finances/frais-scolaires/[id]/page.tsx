import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import FormulaireFrais from "../FormulaireFrais";
import { modifierFrais, enregistrerTarif, supprimerTarif } from "../actions";
import styles from "../frais-scolaires.module.css";

export const dynamic = "force-dynamic";

type FraisDetail = {
  id: number;
  code: string;
  libelle: string;
  famille: string;
  nature: string;
  categorie: string;
  periodicite: string;
  description: string | null;
  obligatoire: number | boolean;
  actif: number | boolean;
  penalite_active: number | boolean;
  type_penalite: string | null;
  valeur_penalite: number | null;
  delai_grace_jours: number | null;
};

type Tarif = {
  id: number;
  annee_scolaire_id: number;
  classe_id: number | null;
  montant: number;
  devise: string;
  date_echeance: Date | null;
  actif: number | boolean;
  annee_libelle: string;
  classe_nom: string | null;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ succes?: string; erreur?: string }>;
};

export default async function DetailFrais({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const { id: idTexte } = await params;
  const requete = await searchParams;
  const id = Number(idTexte);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const fraisLignes = await prisma.$queryRaw<FraisDetail[]>`
    SELECT * FROM frais_scolaires
    WHERE id = ${id} AND ecole_id = ${ecole.id}
    LIMIT 1
  `;
  const frais = fraisLignes[0];
  if (!frais) notFound();

  const [annees, classes, tarifs] = await Promise.all([
    prisma.anneeScolaire.findMany({
      where: { ecoleId: ecole.id },
      orderBy: [{ active: "desc" }, { dateDebut: "desc" }],
    }),
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      orderBy: { nom: "asc" },
    }),
    prisma.$queryRaw<Tarif[]>`
      SELECT
        t.*,
        a.libelle AS annee_libelle,
        c.nom AS classe_nom
      FROM tarifs_frais_scolaires t
      INNER JOIN annees_scolaires a ON a.id = t.annee_scolaire_id
      LEFT JOIN classes c ON c.id = t.classe_id
      WHERE t.ecole_id = ${ecole.id}
        AND t.frais_id = ${id}
      ORDER BY a.active DESC, a.date_debut DESC, c.nom ASC
    `,
  ]);

  const actionModification = modifierFrais.bind(null, id);
  const actionTarif = enregistrerTarif.bind(null, id);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre={frais.libelle}
      description="Modifiez le frais et configurez ses tarifs par classe et année scolaire."
    >
      <RetourDashboard />

      <div className={styles.navigationInterne}>
        <Link href="/dashboard/finances/frais-scolaires">← Retour à la liste des frais</Link>
      </div>

      {requete.succes && <div className={styles.succes}>Les informations ont été enregistrées.</div>}
      {requete.erreur && <div className={styles.erreur}>Veuillez vérifier les informations du tarif.</div>}

      <section className={styles.carteFormulaire}>
        <FormulaireFrais
          action={actionModification}
          libelleBouton="Enregistrer les modifications"
          valeurs={{
            code: frais.code,
            libelle: frais.libelle,
            famille: frais.famille,
            nature: frais.nature,
            categorie: frais.categorie,
            periodicite: frais.periodicite,
            description: frais.description,
            obligatoire: Boolean(frais.obligatoire),
            actif: Boolean(frais.actif),
            penaliteActive: Boolean(frais.penalite_active),
            typePenalite: frais.type_penalite,
            valeurPenalite: Number(frais.valeur_penalite ?? 0),
            delaiGraceJours: Number(frais.delai_grace_jours ?? 0),
          }}
        />
      </section>

      <section className={styles.carteFormulaire}>
        <div className={styles.titreSection}>
          <div>
            <h2>Tarifs par classe</h2>
            <p>
              Utilisez « Toutes les classes » lorsqu’un même montant doit s’appliquer à tout l’établissement.
            </p>
          </div>
          <CalendarDays />
        </div>

        <form action={actionTarif} className={styles.grilleTarif}>
          <label>
            <span>Année scolaire *</span>
            <select name="annee_scolaire_id" required defaultValue={annees.find((a) => a.active)?.id ?? annees[0]?.id}>
              {annees.map((annee) => (
                <option value={annee.id} key={annee.id}>{annee.libelle}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Classe</span>
            <select name="classe_id" defaultValue="0">
              <option value="0">Toutes les classes</option>
              {classes.map((classe) => (
                <option value={classe.id} key={classe.id}>{classe.nom}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Montant *</span>
            <input type="number" name="montant" min="0" step="0.01" required />
          </label>

          <label>
            <span>Devise *</span>
            <select name="devise" defaultValue={ecole.devise || "CDF"}>
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label>
            <span>Date d’échéance</span>
            <input type="date" name="date_echeance" />
          </label>

          <label className={styles.caseTarif}>
            <input type="checkbox" name="actif" defaultChecked />
            <span>Tarif actif</span>
          </label>

          <button type="submit" className={styles.primaire}>Ajouter ou mettre à jour</button>
        </form>

        <div className={styles.tableauDefilement}>
          <table>
            <thead>
              <tr>
                <th>Année</th>
                <th>Classe</th>
                <th>Montant</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tarifs.map((tarif) => (
                <tr key={tarif.id}>
                  <td>{tarif.annee_libelle}</td>
                  <td>{tarif.classe_nom ?? "Toutes les classes"}</td>
                  <td><strong>{Number(tarif.montant).toLocaleString("fr-FR")} {tarif.devise}</strong></td>
                  <td>{tarif.date_echeance ? new Date(tarif.date_echeance).toLocaleDateString("fr-FR") : "Non définie"}</td>
                  <td>
                    <span className={Boolean(tarif.actif) ? styles.badgeVert : styles.badgeRouge}>
                      {Boolean(tarif.actif) ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <form action={supprimerTarif.bind(null, id, tarif.id)}>
                      <button type="submit" className={styles.danger} title="Supprimer ce tarif">
                        <Trash2 size={17} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {!tarifs.length && (
                <tr>
                  <td colSpan={6}>Aucun tarif n’est encore défini pour ce frais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
