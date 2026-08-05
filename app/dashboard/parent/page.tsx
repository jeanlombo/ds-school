import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  CircleDollarSign,
  FileText,
  GraduationCap,
  MessageSquareText,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirContexteParent } from "@/lib/parent-portail";
import AdminShell from "@/components/admin/AdminShell";
import styles from "./parent.module.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  const contexte = await obtenirContexteParent();

  const enfants = await prisma.$queryRaw<
    Array<{
      eleve_id: number;
      matricule: string;
      nom_complet: string;
      classe_nom: string | null;
      autorise_finances: number;
      autorise_academique: number;
      autorise_communication: number;
    }>
  >`
    SELECT
      e.id AS eleve_id,
      e.matricule,
      CONCAT_WS(' ', e.nom, e.postnom, e.prenom)
        AS nom_complet,
      c.nom AS classe_nom,
      pe.autorise_finances,
      pe.autorise_academique,
      pe.autorise_communication
    FROM parents_eleves pe
    INNER JOIN eleves e ON e.id = pe.eleve_id
    LEFT JOIN inscriptions i
      ON i.eleve_id = e.id
      AND i.statut IN ('inscrit','admis','promu','redouble')
    LEFT JOIN classes c ON c.id = i.classe_id
    WHERE pe.ecole_id = ${contexte.ecoleId}
      AND pe.parent_id = ${contexte.parentId}
    ORDER BY pe.principal DESC, e.nom ASC
  `;

  const alertesNonLues = await prisma.$queryRaw<
    Array<{ total: bigint | number }>
  >`
    SELECT COUNT(*) AS total
    FROM suivi_parent_evenements s
    INNER JOIN parents_eleves pe
      ON pe.eleve_id = s.eleve_id
      AND pe.parent_id = ${contexte.parentId}
      AND pe.ecole_id = ${contexte.ecoleId}
      AND pe.autorise_communication = 1
    LEFT JOIN suivi_parent_lectures l
      ON l.evenement_id = s.id
      AND l.parent_id = ${contexte.parentId}
    WHERE s.ecole_id = ${contexte.ecoleId}
      AND s.visible_parent = 1
      AND l.id IS NULL
  `.catch(() => [{ total: 0 }]);

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre="Espace Parent"
      description="Suivi scolaire et financier sécurisé de vos enfants."
    >
      <section className={styles.hero}>
        <div>
          <span>PORTAIL PARENTS V2</span>
          <h2>Bienvenue dans votre espace famille</h2>
          <p>
            Consultez les résultats, présences, observations,
            paiements, reçus et bulletins de vos enfants.
          </p>
        </div>
        <GraduationCap size={72} />
      </section>

      <section className={styles.stats}>
        <article>
          <UsersRound />
          <div>
            <small>Enfants liés</small>
            <strong>{enfants.length}</strong>
          </div>
        </article>
        <article>
          <CircleDollarSign />
          <div>
            <small>Finances</small>
            <strong>Suivi</strong>
          </div>
        </article>
        <article>
          <CalendarCheck />
          <div>
            <small>Présences</small>
            <strong>Temps réel</strong>
          </div>
        </article>
        <article>
          <Bell />
          <div>
            <small>Alertes non lues</small>
            <strong>{Number(alertesNonLues[0]?.total ?? 0)}</strong>
          </div>
        </article>
      </section>

      <section className={styles.enfants}>
        {enfants.map((enfant) => (
          <article key={enfant.eleve_id}>
            <div className={styles.avatar}>
              {enfant.nom_complet
                .split(" ")
                .slice(0, 2)
                .map((mot) => mot[0])
                .join("")}
            </div>
            <div>
              <small>{enfant.matricule}</small>
              <h3>{enfant.nom_complet}</h3>
              <p>{enfant.classe_nom ?? "Classe non définie"}</p>
            </div>

            <div className={styles.actionsCarte}>
              <Link
                href={`/dashboard/parent/enfants/${enfant.eleve_id}`}
              >
                <GraduationCap size={16} />
                Vue complète
              </Link>

              {Boolean(enfant.autorise_finances) && (
                <>
                  <Link
                    href={`/dashboard/parent/paiements?eleveId=${enfant.eleve_id}`}
                  >
                    <CircleDollarSign size={16} />
                    Paiements
                  </Link>
                  <Link
                    href={`/dashboard/parent/recus?eleveId=${enfant.eleve_id}`}
                  >
                    <ReceiptText size={16} />
                    Reçus
                  </Link>
                </>
              )}

              {Boolean(enfant.autorise_academique) && (
                <>
                  <Link
                    href={`/dashboard/parent/bulletins?eleveId=${enfant.eleve_id}`}
                  >
                    <FileText size={16} />
                    Bulletins
                  </Link>
                  <Link
                    href={`/dashboard/parent/presences?eleveId=${enfant.eleve_id}`}
                  >
                    <CalendarCheck size={16} />
                    Présences
                  </Link>
                </>
              )}

              {Boolean(enfant.autorise_communication) && (
                <>
                  <Link
                    href={`/dashboard/parent/observations?eleveId=${enfant.eleve_id}`}
                  >
                    <MessageSquareText size={16} />
                    Observations
                  </Link>
                  <Link
                    href={`/dashboard/parent/alertes?eleveId=${enfant.eleve_id}`}
                  >
                    <Bell size={16} />
                    Alertes et convocations
                  </Link>
                </>
              )}
            </div>
          </article>
        ))}

        {!enfants.length && (
          <div className={styles.vide}>
            Aucun enfant n’est lié à ce compte.
          </div>
        )}
      </section>
    </AdminShell>
  );
}
