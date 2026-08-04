import { prisma } from "@/lib/prisma";

export type DonneesDashboardPublic = {
  ecole: {
    nom: string;
    slogan: string;
  };
  anneeActive: string | null;
  documentVerification: {
    numero: string;
    code: string;
    type: string;
  } | null;
  statistiques: {
    anneesScolaires: number;
    sectionsActives: number;
    classesActives: number;
    elevesActifs: number;
    enseignantsActifs: number;
    parents: number;
    evaluations: number;
    notesEnregistrees: number;
  };
};

const donneesVides: DonneesDashboardPublic = {
  ecole: {
    nom: "DS School Enterprise",
    slogan: "Plateforme scolaire intelligente",
  },
  anneeActive: null,
  documentVerification: null,
  statistiques: {
    anneesScolaires: 0,
    sectionsActives: 0,
    classesActives: 0,
    elevesActifs: 0,
    enseignantsActifs: 0,
    parents: 0,
    evaluations: 0,
    notesEnregistrees: 0,
  },
};

/**
 * Retourne uniquement des données agrégées et non sensibles.
 * Aucun nom d'élève, parent, enseignant, paiement individuel ou note
 * nominative n'est exposé sur la vitrine publique.
 */
export async function obtenirDonneesDashboardPublic():
  Promise<DonneesDashboardPublic> {
  try {
    const ecole = await prisma.ecole.findFirst({
      orderBy: { id: "asc" },
      select: {
        id: true,
        nom: true,
        slogan: true,
      },
    });

    if (!ecole) {
      return donneesVides;
    }

    const [
      anneeActive,
      anneesScolaires,
      sectionsActives,
      classesActives,
      elevesActifs,
      enseignantsActifs,
      parents,
      evaluations,
      notesEnregistrees,
      documentVerification,
    ] = await Promise.all([
      prisma.anneeScolaire.findFirst({
        where: {
          ecoleId: ecole.id,
          active: true,
        },
        orderBy: { dateDebut: "desc" },
        select: { libelle: true },
      }),

      prisma.anneeScolaire.count({
        where: { ecoleId: ecole.id },
      }),

      prisma.section.count({
        where: {
          ecoleId: ecole.id,
          statut: "active",
        },
      }),

      prisma.classe.count({
        where: {
          ecoleId: ecole.id,
          statut: "active",
        },
      }),

      prisma.eleve.count({
        where: {
          ecoleId: ecole.id,
          statut: "actif",
        },
      }),

      prisma.enseignant.count({
        where: {
          ecoleId: ecole.id,
          statut: "actif",
        },
      }),

      prisma.responsableEleve.count({
        where: { ecoleId: ecole.id },
      }),

      prisma.evaluation.count({
        where: { ecoleId: ecole.id },
      }),

      prisma.noteEvaluation.count({
        where: {
          evaluation: {
            ecoleId: ecole.id,
          },
        },
      }),

      prisma.documentAcademique.findFirst({
        where: {
          ecoleId: ecole.id,
          statut: "VALIDE",
        },
        orderBy: { dateDelivrance: "desc" },
        select: {
          numero: true,
          codeVerification: true,
          type: true,
        },
      }),
    ]);

    return {
      ecole: {
        nom: ecole.nom,
        slogan:
          ecole.slogan?.trim() ||
          "Plateforme scolaire intelligente",
      },
      anneeActive: anneeActive?.libelle ?? null,
      documentVerification: documentVerification
        ? {
            numero: documentVerification.numero,
            code: documentVerification.codeVerification,
            type: documentVerification.type,
          }
        : null,
      statistiques: {
        anneesScolaires,
        sectionsActives,
        classesActives,
        elevesActifs,
        enseignantsActifs,
        parents,
        evaluations,
        notesEnregistrees,
      },
    };
  } catch (erreur) {
    console.error(
      "Impossible de charger les statistiques publiques :",
      erreur
    );

    return donneesVides;
  }
}
