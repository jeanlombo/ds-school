import Link from "next/link";
import {
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  FileText,
  MessageSquareText,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import AdminShell from "@/components/admin/AdminShell";
import styles from "./titulaire.module.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  const contexte = await obtenirContexteTitulaire();

  const [eleves, evaluations, presencesJour, observations] =
    await Promise.all([
      prisma.inscription.count({
        where: {
          classeId: contexte.classeId,
          anneeScolaireId:
            contexte.anneeScolaireId,
          statut: { in: ["inscrit", "admis"] },
        },
      }),
      prisma.evaluation.count({
        where: {
          classeId: contexte.classeId,
          anneeScolaireId:
            contexte.anneeScolaireId,
        },
      }),
      prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COUNT(*) AS total
        FROM presences_titulaires
        WHERE ecole_id = ${contexte.ecoleId}
          AND classe_id = ${contexte.classeId}
          AND date_presence = CURDATE()
      `,
      prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COUNT(*) AS total
        FROM observations_eleves oe
        INNER JOIN inscriptions i
          ON i.eleve_id = oe.eleve_id
        WHERE i.classe_id = ${contexte.classeId}
          AND i.annee_scolaire_id =
            ${contexte.anneeScolaireId}
      `,
    ]);

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={`Espace titulaire — ${contexte.classeNom}`}
      description={`Année scolaire ${contexte.anneeLibelle}. Vous voyez uniquement votre classe.`}
    >
      <section className={styles.hero}>
        <div>
          <span>TABLEAU DE BORD TITULAIRE</span>
          <h2>{contexte.classeNom}</h2>
          <p>
            Gérez les élèves, présences, notes,
            observations et bulletins de votre classe.
          </p>
        </div>
        <BookOpenCheck size={68} />
      </section>

      <section className={styles.stats}>
        <article>
          <UsersRound />
          <div>
            <small>Élèves</small>
            <strong>{eleves}</strong>
          </div>
        </article>
        <article>
          <ClipboardList />
          <div>
            <small>Évaluations</small>
            <strong>{evaluations}</strong>
          </div>
        </article>
        <article>
          <CalendarCheck />
          <div>
            <small>Présences aujourd’hui</small>
            <strong>
              {Number(presencesJour[0]?.total ?? 0)}
            </strong>
          </div>
        </article>
        <article>
          <MessageSquareText />
          <div>
            <small>Observations</small>
            <strong>
              {Number(observations[0]?.total ?? 0)}
            </strong>
          </div>
        </article>
      </section>

      <section className={styles.grilleModules}>
        <Link href="/dashboard/titulaire/eleves">
          <UsersRound />
          <h3>Mes élèves</h3>
          <p>Consulter uniquement les élèves de la classe.</p>
        </Link>

        <Link href="/dashboard/titulaire/presences">
          <CalendarCheck />
          <h3>Présences</h3>
          <p>Prendre les présences quotidiennes.</p>
        </Link>

        <Link href="/dashboard/titulaire/notes">
          <ClipboardList />
          <h3>Notes</h3>
          <p>Saisir les notes des évaluations de la classe.</p>
        </Link>

        <Link href="/dashboard/titulaire/observations">
          <MessageSquareText />
          <h3>Observations</h3>
          <p>Ajouter des observations pédagogiques.</p>
        </Link>

        <Link href="/dashboard/titulaire/bulletins">
          <FileText />
          <h3>Bulletins</h3>
          <p>Consulter et ouvrir les bulletins de la classe.</p>
        </Link>
      </section>
    </AdminShell>
  );
}
