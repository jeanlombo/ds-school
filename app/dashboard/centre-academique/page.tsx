import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Award,
  Ban,
  BarChart3,
  BrainCircuit,
  BookOpenCheck,
  ClipboardList,
  FileBadge2,
  FileText,
  FileCheck2,
  Gavel,
  History,
  NotebookPen,
  Settings,
  Settings2,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import styles from "./centre-academique.module.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();

  const [
    evaluations,
    notes,
    eleves,
    types,
    documents,
    documentsValides,
    documentsAnnules,
    reimpressions,
  ] = await Promise.all([
    prisma.evaluation.count({
      where: {
        ecoleId: ecole.id,
      },
    }),

    prisma.noteEvaluation.count({
      where: {
        evaluation: {
          ecoleId: ecole.id,
        },
      },
    }),

    prisma.inscription.count({
      where: {
        anneeScolaire: {
          ecoleId: ecole.id,
        },
        statut: "inscrit",
      },
    }),

    prisma.typeEvaluation.count({
      where: {
        ecoleId: ecole.id,
        actif: true,
      },
    }),

    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM documents_academiques_enterprise
      WHERE ecole_id = ${ecole.id}
    `.catch(() => [{ total: 0 }]),

    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM documents_academiques_enterprise
      WHERE ecole_id = ${ecole.id}
        AND statut = 'VALIDE'
    `.catch(() => [{ total: 0 }]),

    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM documents_academiques_enterprise
      WHERE ecole_id = ${ecole.id}
        AND statut = 'ANNULE'
    `.catch(() => [{ total: 0 }]),

    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM reimpressions_documents_academiques
      WHERE ecole_id = ${ecole.id}
    `.catch(() => [{ total: 0 }]),
  ]);

  const cartes = [
    {
      href: "/dashboard/centre-academique/tableau-analytique",
      titre: "Tableau analytique",
      description: "Analyser la réussite, les classes, matières et alertes pédagogiques.",
      icone: BrainCircuit,
    },
    {
      href: "/dashboard/centre-academique/evaluations",
      titre: "Évaluations",
      description: "Planifier devoirs, interrogations et examens.",
      icone: ClipboardList,
    },
    {
      href: "/dashboard/centre-academique/notes",
      titre: "Carnet de notes",
      description: "Saisir et contrôler les notes par évaluation.",
      icone: NotebookPen,
    },
    {
      href: "/dashboard/centre-academique/resultats",
      titre: "Résultats",
      description: "Calculer les moyennes, pourcentages et classements.",
      icone: BarChart3,
    },
    {
      href: "/dashboard/centre-academique/deliberations",
      titre: "Délibérations",
      description: "Valider les décisions du conseil de classe et produire le procès-verbal.",
      icone: Gavel,
    },
    {
      href: "/dashboard/centre-academique/promotions",
      titre: "Promotions automatiques",
      description: "Faire passer les apprenants vers l’année suivante sans doublon.",
      icone: ArrowUpRight,
    },
    {
      href: "/dashboard/centre-academique/bulletins",
      titre: "Bulletins",
      description: "Prévisualiser et générer les bulletins scolaires.",
      icone: FileText,
    },
    {
      href: "/dashboard/centre-academique/releves-notes",
      titre: "Relevés de notes",
      description: "Générer les relevés officiels avec numéro et vérification.",
      icone: FileCheck2,
    },
    {
      href: "/dashboard/centre-academique/diplomes-certificats",
      titre: "Diplômes & certificats",
      description: "Délivrer et vérifier les documents académiques sécurisés.",
      icone: FileBadge2,
    },
    {
      href: "/dashboard/centre-academique/documents",
      titre: "Documents sécurisés Enterprise",
      description: "Créer diplômes, certificats et attestations avec numérotation automatique.",
      icone: ShieldCheck,
    },
    {
      href: "/dashboard/centre-academique/reimpressions",
      titre: "Réimpressions",
      description: "Consulter l’historique des impressions et copies conformes.",
      icone: History,
    },
    {
      href: "/dashboard/centre-academique/verifications",
      titre: "Vérifications",
      description: "Contrôler l’authenticité et consulter le journal de vérification.",
      icone: ShieldCheck,
    },
    {
      href: "/dashboard/centre-academique/documents-annules",
      titre: "Documents annulés",
      description: "Consulter les documents annulés, suspendus ou remplacés.",
      icone: Ban,
    },
    {
      href: "/dashboard/centre-academique/parametres-documents",
      titre: "Paramètres des documents",
      description: "Configurer le préfixe, la numérotation et l’identité officielle.",
      icone: Settings,
    },
    {
      href: "/dashboard/centre-academique/types-evaluations",
      titre: "Types d’évaluations",
      description: "Configurer les catégories, coefficients et barèmes.",
      icone: Settings2,
    },
    {
      href: "/dashboard/centre-academique/regles",
      titre: "Règles académiques",
      description: "Définir les seuils, mentions et décisions.",
      icone: BookOpenCheck,
    },
    {
      href: "/dashboard/centre-academique/classements",
      titre: "Classements",
      description: "Consulter les rangs par classe et par période.",
      icone: Trophy,
    },
    {
      href: "/dashboard/centre-academique/modeles-bulletins",
      titre: "Modèles de bulletins",
      description: "Personnaliser les modèles utilisés par l’établissement.",
      icone: Award,
    },
  ];

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Centre académique"
      description="Gérez les évaluations, les notes, les résultats et les bulletins."
    >
      <RetourDashboard />

      <section className={styles.stats}>
        <article>
          <ClipboardList />
          <div>
            <small>Évaluations</small>
            <strong>{evaluations}</strong>
          </div>
        </article>

        <article>
          <NotebookPen />
          <div>
            <small>Notes enregistrées</small>
            <strong>{notes}</strong>
          </div>
        </article>

        <article>
          <BookOpenCheck />
          <div>
            <small>Apprenants inscrits</small>
            <strong>{eleves}</strong>
          </div>
        </article>

        <article>
          <Settings2 />
          <div>
            <small>Types actifs</small>
            <strong>{types}</strong>
          </div>
        </article>
      </section>


      <section className={styles.stats}>
        <article>
          <FileBadge2 />
          <div>
            <small>Documents créés</small>
            <strong>{Number(documents[0]?.total ?? 0)}</strong>
          </div>
        </article>

        <article>
          <ShieldCheck />
          <div>
            <small>Documents valides</small>
            <strong>{Number(documentsValides[0]?.total ?? 0)}</strong>
          </div>
        </article>

        <article>
          <Ban />
          <div>
            <small>Documents annulés</small>
            <strong>{Number(documentsAnnules[0]?.total ?? 0)}</strong>
          </div>
        </article>

        <article>
          <History />
          <div>
            <small>Réimpressions</small>
            <strong>{Number(reimpressions[0]?.total ?? 0)}</strong>
          </div>
        </article>
      </section>

      <section className={styles.grilleModules}>
        {cartes.map(({ href, titre, description, icone: Icone }) => (
          <Link href={href} key={href} className={styles.carteModule}>
            <span className={styles.icone}>
              <Icone size={22} />
            </span>
            <div>
              <h2>{titre}</h2>
              <p>{description}</p>
            </div>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}