import { redirect } from "next/navigation";
import { Activity, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import { fermerSession } from "../actions";
import styles from "../securite.module.css";

export const dynamic = "force-dynamic";

type Session = {
  id: number;
  utilisateur_nom: string;
  adresse_ip: string | null;
  appareil: string | null;
  navigateur: string | null;
  date_debut: Date;
  statut: string;
};

export default async function PageSessions() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const sessions = await prisma.$queryRaw<Session[]>`
    SELECT
      id,
      utilisateur_nom,
      adresse_ip,
      appareil,
      navigateur,
      date_debut,
      statut
    FROM sessions_securite
    WHERE ecole_id = ${ecole.id}
    ORDER BY date_debut DESC
    LIMIT 200
  `;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Sessions"
      description="Visualisez les connexions et fermez les sessions à distance."
    >
      <RetourDashboard />

      <section className={styles.panel}>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Adresse IP</th>
                <th>Appareil</th>
                <th>Navigateur</th>
                <th>Début</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td><strong>{session.utilisateur_nom}</strong></td>
                  <td>{session.adresse_ip ?? "—"}</td>
                  <td>{session.appareil ?? "—"}</td>
                  <td>{session.navigateur ?? "—"}</td>
                  <td>{new Date(session.date_debut).toLocaleString("fr-FR")}</td>
                  <td><span className={session.statut === "ACTIVE" ? styles.vert : styles.rouge}>{session.statut}</span></td>
                  <td>
                    {session.statut === "ACTIVE" && (
                      <form action={fermerSession.bind(null, session.id)}>
                        <button className={styles.actionSecondaire} type="submit">
                          <LogOut size={15}/> Fermer
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}

              {!sessions.length && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.vide}>
                      <Activity size={44}/>
                      <p>Aucune session enregistrée.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
