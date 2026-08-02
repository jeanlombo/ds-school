import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { exigerPermission } from "@/lib/securite/rbac";

import AdminShell from "@/components/admin/AdminShell";
import FormulaireFrais from "../FormulaireFrais";
import { creerFrais } from "../actions";
import styles from "../frais-scolaires.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    erreur?: string;
  }>;
};

function messageErreur(code?: string): string {
  switch (code) {
    case "montant":
      return "Le montant initial doit être supérieur à zéro.";

    case "annee":
      return "Veuillez sélectionner une année scolaire valide.";

    case "classe":
      return "La classe sélectionnée est invalide ou inactive.";

    case "devise":
      return "La devise sélectionnée est invalide.";

    case "doublon":
      return "Ce code de frais existe déjà pour cette école.";

    default:
      return "Veuillez compléter tous les champs obligatoires.";
  }
}

export default async function NouveauFrais({
  searchParams,
}: Props) {
  await exigerPermission("FINANCES_FRAIS_AJOUTER");

  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [annees, classes] = await Promise.all([
    prisma.anneeScolaire.findMany({
      where: {
        ecoleId: ecole.id,
      },
      orderBy: [
        {
          active: "desc",
        },
        {
          dateDebut: "desc",
        },
      ],
      select: {
        id: true,
        libelle: true,
        active: true,
      },
    }),

    prisma.classe.findMany({
      where: {
        ecoleId: ecole.id,
        statut: "active",
      },
      orderBy: {
        nom: "asc",
      },
      select: {
        id: true,
        nom: true,
      },
    }),
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouveau frais scolaire"
      description="Créez le frais et son premier tarif en une seule opération."
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <Link
          href="/dashboard"
          className={styles.actionSecondaire}
        >
          <LayoutDashboard size={17} />
          Retour au Dashboard
        </Link>

        <Link
          href="/dashboard/finances/frais-scolaires"
          className={styles.actionSecondaire}
        >
          <ArrowLeft size={17} />
          Retour à la liste des frais
        </Link>
      </div>

      {params.erreur && (
        <div className={styles.erreur}>
          {messageErreur(params.erreur)}
        </div>
      )}

      {!annees.length && (
        <div className={styles.erreur}>
          Aucune année scolaire n’est disponible. Le formulaire
          restera bloqué jusqu’à la création d’une année scolaire.
        </div>
      )}

      <section className={styles.carteFormulaire}>
        <FormulaireFrais
          action={creerFrais}
          libelleBouton="Enregistrer le frais et son montant"
          afficherTarifInitial
          annees={annees}
          classes={classes}
          deviseParDefaut={ecole.devise || "CDF"}
        />
      </section>
    </AdminShell>
  );
}