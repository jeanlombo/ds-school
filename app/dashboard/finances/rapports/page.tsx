import { redirect } from "next/navigation";
import { BarChart3, CalendarDays, CircleDollarSign, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import styles from "./module.module.css";

export const dynamic = "force-dynamic";

type Ligne = {
  date_paiement: Date;
  nombre_paiements: number | bigint;
  montant_total: number;
  devise: string;
};

type ParClasse = {
  classe_nom: string;
  nombre_paiements: number | bigint;
  montant_total: number;
  devise: string;
};

type Props = {
  searchParams: Promise<{
    date_debut?: string;
    date_fin?: string;
    devise?: string;
  }>;
};

export default async function PageRapports({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const aujourdHui = new Date();
  const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
  const dateDebut = params.date_debut ?? debutMois.toISOString().slice(0, 10);
  const dateFin = params.date_fin ?? aujourdHui.toISOString().slice(0, 10);
  const devise = params.devise ?? "";

  const lignes = await prisma.$queryRaw<Ligne[]>`
    SELECT
      DATE(date_paiement) AS date_paiement,
      COUNT(*) AS nombre_paiements,
      SUM(montant_total) AS montant_total,
      devise
    FROM paiements_scolaires
    WHERE ecole_id = ${ecole.id}
      AND statut = 'VALIDE'
      AND DATE(date_paiement) BETWEEN ${dateDebut} AND ${dateFin}
      AND (${devise} = '' OR devise = ${devise})
    GROUP BY DATE(date_paiement), devise
    ORDER BY DATE(date_paiement) DESC
  `;

  const parClasse = await prisma.$queryRaw<ParClasse[]>`
    SELECT
      COALESCE(c.nom, 'Classe non définie') AS classe_nom,
      COUNT(p.id) AS nombre_paiements,
      SUM(p.montant_total) AS montant_total,
      p.devise
    FROM paiements_scolaires p
    INNER JOIN inscriptions i ON i.id = p.inscription_id
    LEFT JOIN classes c ON c.id = i.classe_id
    WHERE p.ecole_id = ${ecole.id}
      AND p.statut = 'VALIDE'
      AND DATE(p.date_paiement) BETWEEN ${dateDebut} AND ${dateFin}
      AND (${devise} = '' OR p.devise = ${devise})
    GROUP BY c.id, c.nom, p.devise
    ORDER BY montant_total DESC
  `;

  const totalPaiements = lignes.reduce((s, l) => s + Number(l.nombre_paiements), 0);
  const totalMontant = lignes.reduce((s, l) => s + Number(l.montant_total), 0);
  const classesActives = parClasse.length;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Rapports financiers"
      description="Analysez les encaissements par période, devise, jour et classe."
    >
      <RetourDashboard />

      <section className={styles.stats}>
        <article><CircleDollarSign /><div><small>Montant encaissé</small><strong>{totalMontant.toLocaleString("fr-FR")}</strong></div></article>
        <article><BarChart3 /><div><small>Paiements</small><strong>{totalPaiements}</strong></div></article>
        <article><UsersRound /><div><small>Classes concernées</small><strong>{classesActives}</strong></div></article>
        <article><CalendarDays /><div><small>Période</small><strong>{dateDebut} → {dateFin}</strong></div></article>
      </section>

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <label>
            <span>Date de début</span>
            <input type="date" name="date_debut" defaultValue={dateDebut} />
          </label>

          <label>
            <span>Date de fin</span>
            <input type="date" name="date_fin" defaultValue={dateFin} />
          </label>

          <label>
            <span>Devise</span>
            <select name="devise" defaultValue={devise}>
              <option value="">Toutes</option>
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <button type="submit">Actualiser</button>
        </form>
      </section>

      <section className={styles.grilleRapports}>
        <article className={styles.panel}>
          <h2>Encaissements par jour</h2>
          <div className={styles.tableau}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Paiements</th>
                  <th>Montant</th>
                  <th>Devise</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, index) => (
                  <tr key={index}>
                    <td>{new Date(ligne.date_paiement).toLocaleDateString("fr-FR")}</td>
                    <td>{Number(ligne.nombre_paiements)}</td>
                    <td><strong>{Number(ligne.montant_total).toLocaleString("fr-FR")}</strong></td>
                    <td>{ligne.devise}</td>
                  </tr>
                ))}

                {!lignes.length && (
                  <tr>
                    <td colSpan={4}>Aucun paiement pour cette période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.panel}>
          <h2>Encaissements par classe</h2>
          <div className={styles.tableau}>
            <table>
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Paiements</th>
                  <th>Montant</th>
                  <th>Devise</th>
                </tr>
              </thead>
              <tbody>
                {parClasse.map((ligne, index) => (
                  <tr key={index}>
                    <td>{ligne.classe_nom}</td>
                    <td>{Number(ligne.nombre_paiements)}</td>
                    <td><strong>{Number(ligne.montant_total).toLocaleString("fr-FR")}</strong></td>
                    <td>{ligne.devise}</td>
                  </tr>
                ))}

                {!parClasse.length && (
                  <tr>
                    <td colSpan={4}>Aucune donnée disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
