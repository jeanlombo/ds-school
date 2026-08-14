import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CircleDollarSign,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import styles from "./suivi-parent.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    statut?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  await exigerPermission("SUIVI_PARENT_VOIR");
  const utilisateur =
    await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const type = String(params.type ?? "").trim();
  const statut = String(
    params.statut ?? ""
  ).trim();

  const evenements = await prisma.$queryRaw<
    Array<{
      id: number;
      type_evenement: string;
      titre: string;
      niveau: string;
      date_evenement: Date;
      date_echeance: Date | null;
      statut: string;
      nom_complet: string;
      matricule: string;
      classe_nom: string | null;
      reponses: bigint | number;
    }>
  >`
    SELECT
      s.id,
      s.type_evenement,
      s.titre,
      s.niveau,
      s.date_evenement,
      s.date_echeance,
      s.statut,
      CONCAT_WS(' ', e.nom, e.postnom, e.prenom)
        AS nom_complet,
      e.matricule,
      c.nom AS classe_nom,
      (
        SELECT COUNT(*)
        FROM suivi_parent_reponses r
        WHERE r.evenement_id = s.id
      ) AS reponses
    FROM suivi_parent_evenements s
    INNER JOIN eleves e
      ON e.id = s.eleve_id
    LEFT JOIN inscriptions i
      ON i.eleve_id = e.id
      AND i.statut IN
        ('inscrit','admis','promu','redouble')
    LEFT JOIN classes c
      ON c.id = i.classe_id
    WHERE s.ecole_id = ${ecole.id}
      AND (
        ${q} = ''
        OR s.titre LIKE CONCAT('%', ${q}, '%')
        OR e.matricule LIKE CONCAT('%', ${q}, '%')
        OR e.nom LIKE CONCAT('%', ${q}, '%')
        OR e.prenom LIKE CONCAT('%', ${q}, '%')
      )
      AND (
        ${type} = ''
        OR s.type_evenement = ${type}
      )
      AND (
        ${statut} = ''
        OR s.statut = ${statut}
      )
    ORDER BY s.created_at DESC
    LIMIT 500
  `;

  const stats = {
    total: evenements.length,
    dettes: evenements.filter(
      (x) => x.type_evenement === "DETTE"
    ).length,
    absences: evenements.filter((x) =>
      ["ABSENCE", "RETARD"].includes(
        x.type_evenement
      )
    ).length,
    urgents: evenements.filter(
      (x) => x.niveau === "URGENT"
    ).length,
  };

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Suivi et communication Parent"
      description="Dettes, absences, discipline, convocations et réponses des parents."
      action={
        <Link
          href="/dashboard/suivi-parent/nouveau"
          className={styles.bouton}
        >
          <Plus size={18} />
          Nouvelle information
        </Link>
      }
    >
      <section className={styles.hero}>
        <div>
          <span>CENTRE DE SUIVI FAMILLE</span>
          <h2>Une communication claire avec les parents</h2>
          <p>
            Regroupez toutes les informations importantes
            concernant l’enfant dans un historique unique et sécurisé.
          </p>
        </div>
        <Bell size={68} />
      </section>

      <section className={styles.stats}>
        <article>
          <Bell />
          <div><small>Total</small><strong>{stats.total}</strong></div>
        </article>
        <article>
          <CircleDollarSign />
          <div><small>Dettes</small><strong>{stats.dettes}</strong></div>
        </article>
        <article>
          <CalendarClock />
          <div><small>Absences / retards</small><strong>{stats.absences}</strong></div>
        </article>
        <article>
          <AlertTriangle />
          <div><small>Urgents</small><strong>{stats.urgents}</strong></div>
        </article>
      </section>

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Apprenant, matricule ou objet..."
          />
          <select name="type" defaultValue={type}>
            <option value="">Tous les types</option>
            <option value="DETTE">Dette</option>
            <option value="ABSENCE">Absence</option>
            <option value="RETARD">Retard</option>
            <option value="DISCIPLINE">Discipline</option>
            <option value="PUNITION">Punition</option>
            <option value="EXCLUSION">Exclusion</option>
            <option value="CONVOCATION">Convocation</option>
            <option value="INVITATION">Invitation</option>
            <option value="MESSAGE">Message</option>
          </select>
          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            <option value="NOUVEAU">Nouveau</option>
            <option value="EN_ATTENTE_REPONSE">En attente</option>
            <option value="CONFIRME">Confirmé</option>
            <option value="JUSTIFIE">Justifié</option>
            <option value="TRAITE">Traité</option>
            <option value="CLOTURE">Clôturé</option>
            <option value="ANNULE">Annulé</option>
          </select>
          <button type="submit">Filtrer</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Apprenant</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Date</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th>Réponses</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {evenements.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.nom_complet}</strong>
                    <small>
                      {item.matricule} · {item.classe_nom ?? "—"}
                    </small>
                  </td>
                  <td>{item.type_evenement}</td>
                  <td>{item.titre}</td>
                  <td>
                    {new Date(
                      item.date_evenement
                    ).toLocaleDateString("fr-FR")}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        item.niveau === "URGENT"
                          ? styles.urgent
                          : item.niveau === "IMPORTANT"
                            ? styles.important
                            : styles.information
                      }`}
                    >
                      {item.niveau}
                    </span>
                  </td>
                  <td>{item.statut}</td>
                  <td>{Number(item.reponses)}</td>
                  <td>
                    <Link
                      href={`/dashboard/suivi-parent/${item.id}`}
                      className="action"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!evenements.length && (
          <div className={styles.vide}>
            Aucune information trouvée.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
