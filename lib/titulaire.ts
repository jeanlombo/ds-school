import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";

export type ContexteTitulaire = {
  utilisateur: NonNullable<
    Awaited<ReturnType<typeof obtenirUtilisateurConnecte>>
  >;
  ecoleId: number;
  affectationId: number;
  enseignantId: number;
  classeId: number;
  classeNom: string;
  anneeScolaireId: number;
  anneeLibelle: string;
};

export async function obtenirContexteTitulaire(): Promise<ContexteTitulaire> {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();

  const lignes = await prisma.$queryRaw<
    Array<{
      affectation_id: number;
      enseignant_id: number;
      classe_id: number;
      classe_nom: string;
      annee_scolaire_id: number;
      annee_libelle: string;
    }>
  >`
    SELECT
      tc.id AS affectation_id,
      tc.enseignant_id,
      tc.classe_id,
      c.nom AS classe_nom,
      tc.annee_scolaire_id,
      a.libelle AS annee_libelle
    FROM titulaires_classes tc
    INNER JOIN classes c
      ON c.id = tc.classe_id
      AND c.ecole_id = tc.ecole_id
    INNER JOIN annees_scolaires a
      ON a.id = tc.annee_scolaire_id
      AND a.ecole_id = tc.ecole_id
    LEFT JOIN utilisateurs_securite us
      ON us.id = tc.utilisateur_securite_id
    LEFT JOIN enseignants ens
      ON ens.id = tc.enseignant_id
    WHERE tc.ecole_id = ${ecole.id}
      AND tc.actif = 1
      AND (
        tc.utilisateur_securite_id = ${utilisateur.utilisateurSecuriteId}
        OR LOWER(us.email) = LOWER(${utilisateur.email})
        OR LOWER(ens.email) = LOWER(${utilisateur.email})
      )
      AND (
        tc.date_debut IS NULL
        OR tc.date_debut <= CURDATE()
      )
      AND (
        tc.date_fin IS NULL
        OR tc.date_fin >= CURDATE()
      )
    ORDER BY a.active DESC, tc.principal DESC, tc.id DESC
    LIMIT 1
  `;

  const ligne = lignes[0];

  if (!ligne) {
    redirect("/acces-refuse?permission=TITULAIRE_AFFECTATION_ACTIVE");
  }

  return {
    utilisateur,
    ecoleId: ecole.id,
    affectationId: ligne.affectation_id,
    enseignantId: ligne.enseignant_id,
    classeId: ligne.classe_id,
    classeNom: ligne.classe_nom,
    anneeScolaireId: ligne.annee_scolaire_id,
    anneeLibelle: ligne.annee_libelle,
  };
}

export async function exigerClasseTitulaire(
  classeId: number
): Promise<ContexteTitulaire> {
  const contexte = await obtenirContexteTitulaire();

  if (contexte.classeId !== classeId) {
    redirect("/acces-refuse?permission=TITULAIRE_CLASSE_ASSIGNEE");
  }

  return contexte;
}

export async function exigerEleveTitulaire(
  eleveId: number
): Promise<ContexteTitulaire> {
  const contexte = await obtenirContexteTitulaire();

  const inscription = await prisma.inscription.findFirst({
    where: {
      eleveId,
      classeId: contexte.classeId,
      anneeScolaireId: contexte.anneeScolaireId,
      statut: {
        in: ["inscrit", "admis"],
      },
    },
    select: {
      id: true,
    },
  });

  if (!inscription) {
    redirect("/acces-refuse?permission=TITULAIRE_ELEVE_CLASSE");
  }

  return contexte;
}
