import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import FormulaireNouvelApprenant from "./FormulaireNouvelApprenant";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NouvelApprenant({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const erreur = typeof params.erreur === "string" ? params.erreur : "";

  const [classes, promotions, annees, compteur] = await Promise.all([
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      include: { section: true },
      orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }],
    }),
    prisma.promotionUniversitaire.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      include: {
        departement: { include: { faculte: true } },
        cycle: true,
      },
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    }),
    prisma.anneeScolaire.findMany({
      where: { ecoleId: ecole.id, statut: { not: "cloturee" } },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.eleve.count({ where: { ecoleId: ecole.id } }),
  ]);

  if ((!classes.length && !promotions.length) || !annees.length) {
    return (
      <AdminShell
        utilisateur={utilisateur}
        titre="Nouvelle inscription"
        description="Le socle académique doit être prêt avant l’inscription."
      >
        <div className={styles.infoBandeau}>
          Créez au moins une classe / promotion et une année scolaire / académique ouverte.
        </div>
        <Link className={styles.boutonPrimaire} href="/dashboard/classes">
          Configurer les classes / promotions
        </Link>
      </AdminShell>
    );
  }

  const matricule = `${ecole.code}-${new Date().getFullYear()}-${String(
    compteur + 1
  ).padStart(5, "0")}`;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouvelle inscription"
      description="Le formulaire s’adapte automatiquement à la section : élève au scolaire, étudiant au supérieur."
      action={
        <Link href="/dashboard/eleves" className={styles.boutonSecondaire}>
          <ArrowLeft size={18} /> Retour aux apprenants
        </Link>
      }
    >
      {erreur && <div className={elevesStyles.erreur}>{erreur}</div>}

      <FormulaireNouvelApprenant
        classes={classes.map((c) => ({
          id: c.id,
          nom: c.nom,
          sectionNom: c.section.nom,
        }))}
        promotions={promotions.map((p) => ({
          id: p.id,
          nom: p.nom,
          code: p.code,
          cycleNom: p.cycle.nom,
          departementNom: p.departement.nom,
          faculteNom: p.departement.faculte.nom,
        }))}
        typeEtablissement={ecole.typeEtablissement}
        annees={annees.map((a) => ({
          id: a.id,
          libelle: a.libelle,
          active: a.active,
        }))}
        matricule={matricule}
        aujourdHui={new Date().toISOString().slice(0, 10)}
      />
    </AdminShell>
  );
}
