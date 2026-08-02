import { redirect } from "next/navigation";
import { Banknote, CircleDollarSign, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import { fermerCaisse, ouvrirCaisse } from "./actions";
import styles from "./module.module.css";

export const dynamic = "force-dynamic";

type Session = {
  id: number;
  utilisateur_nom: string;
  date_ouverture: Date;
  date_fermeture: Date | null;
  solde_initial: number;
  solde_theorique: number | null;
  solde_compte: number | null;
  ecart: number | null;
  devise: string;
  statut: string;
  total_entrees: number;
  total_sorties: number;
};

type Props = {
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
  }>;
};

export default async function PageCaisse({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const sessions = await prisma.$queryRaw<Session[]>`
    SELECT
      s.*,
      COALESCE(SUM(CASE WHEN m.type_mouvement = 'ENTREE' THEN m.montant ELSE 0 END), 0) AS total_entrees,
      COALESCE(SUM(CASE WHEN m.type_mouvement = 'SORTIE' THEN m.montant ELSE 0 END), 0) AS total_sorties
    FROM sessions_caisse_scolaire s
    LEFT JOIN mouvements_caisse_scolaire m ON m.session_caisse_id = s.id
    WHERE s.ecole_id = ${ecole.id}
    GROUP BY s.id
    ORDER BY s.date_ouverture DESC
    LIMIT 100
  `;

  const sessionOuverte = sessions.find(
    (s) => s.statut === "OUVERTE" && s.utilisateur_nom === utilisateur.nom
  );

  const totalEntrees = sessions.reduce((s, item) => s + Number(item.total_entrees), 0);
  const totalSorties = sessions.reduce((s, item) => s + Number(item.total_sorties), 0);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Caisse scolaire"
      description="Ouvrez, contrôlez et fermez les sessions de caisse de l’établissement."
    >
      <RetourDashboard />

      {params.succes && <div className={styles.succes}>L’opération de caisse a été enregistrée.</div>}
      {params.erreur && <div className={styles.erreur}>L’opération n’a pas pu être exécutée.</div>}

      <section className={styles.stats}>
        <article><UnlockKeyhole /><div><small>Session actuelle</small><strong>{sessionOuverte ? "OUVERTE" : "FERMÉE"}</strong></div></article>
        <article><CircleDollarSign /><div><small>Total entrées</small><strong>{totalEntrees.toLocaleString("fr-FR")}</strong></div></article>
        <article><Banknote /><div><small>Total sorties</small><strong>{totalSorties.toLocaleString("fr-FR")}</strong></div></article>
        <article><LockKeyhole /><div><small>Sessions</small><strong>{sessions.length}</strong></div></article>
      </section>

      {!sessionOuverte ? (
        <section className={styles.panel}>
          <h2>Ouvrir une nouvelle caisse</h2>
          <form action={ouvrirCaisse} className={styles.formulaire}>
            <label>
              <span>Solde initial</span>
              <input type="number" name="solde_initial" min="0" step="0.01" defaultValue="0" required />
            </label>

            <label>
              <span>Devise</span>
              <select name="devise" defaultValue={ecole.devise || "CDF"}>
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <button type="submit">Ouvrir la caisse</button>
          </form>
        </section>
      ) : (
        <section className={styles.panel}>
          <h2>Fermer la caisse actuelle</h2>
          <p>
            Ouverte le {new Date(sessionOuverte.date_ouverture).toLocaleString("fr-FR")} avec{" "}
            {Number(sessionOuverte.solde_initial).toLocaleString("fr-FR")} {sessionOuverte.devise}.
          </p>

          <div className={styles.resumeCaisse}>
            <div><small>Entrées</small><strong>{Number(sessionOuverte.total_entrees).toLocaleString("fr-FR")}</strong></div>
            <div><small>Sorties</small><strong>{Number(sessionOuverte.total_sorties).toLocaleString("fr-FR")}</strong></div>
            <div>
              <small>Solde théorique</small>
              <strong>
                {(
                  Number(sessionOuverte.solde_initial) +
                  Number(sessionOuverte.total_entrees) -
                  Number(sessionOuverte.total_sorties)
                ).toLocaleString("fr-FR")}
              </strong>
            </div>
          </div>

          <form action={fermerCaisse} className={styles.formulaire}>
            <input type="hidden" name="session_id" value={sessionOuverte.id} />

            <label>
              <span>Solde réellement compté *</span>
              <input type="number" name="solde_compte" min="0" step="0.01" required />
            </label>

            <label className={styles.large}>
              <span>Observation</span>
              <textarea name="observation" rows={3} />
            </label>

            <button type="submit">Fermer la caisse</button>
          </form>
        </section>
      )}

      <section className={styles.panel}>
        <h2>Historique des sessions</h2>

        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Caissier</th>
                <th>Ouverture</th>
                <th>Fermeture</th>
                <th>Solde initial</th>
                <th>Entrées</th>
                <th>Sorties</th>
                <th>Solde compté</th>
                <th>Écart</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.utilisateur_nom}</td>
                  <td>{new Date(session.date_ouverture).toLocaleString("fr-FR")}</td>
                  <td>{session.date_fermeture ? new Date(session.date_fermeture).toLocaleString("fr-FR") : "—"}</td>
                  <td>{Number(session.solde_initial).toLocaleString("fr-FR")} {session.devise}</td>
                  <td>{Number(session.total_entrees).toLocaleString("fr-FR")}</td>
                  <td>{Number(session.total_sorties).toLocaleString("fr-FR")}</td>
                  <td>{session.solde_compte === null ? "—" : Number(session.solde_compte).toLocaleString("fr-FR")}</td>
                  <td>{session.ecart === null ? "—" : Number(session.ecart).toLocaleString("fr-FR")}</td>
                  <td><span className={session.statut === "OUVERTE" ? styles.vert : styles.gris}>{session.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
