"use server";

import { exigerPermission } from "@/lib/securite/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";

const nombre = (valeur: FormDataEntryValue | null): number =>
  Number(valeur ?? 0);

const texte = (valeur: FormDataEntryValue | null): string =>
  String(valeur ?? "").trim();

const estCoche = (formData: FormData, nom: string): boolean =>
  formData.get(nom) === "on";

async function securiser() {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  return obtenirOuCreerEcole();
}

function revaliderCentreAcademique() {
  revalidatePath("/dashboard/centre-academique");
  revalidatePath("/dashboard/centre-academique/types-evaluations");
  revalidatePath("/dashboard/centre-academique/evaluations");
  revalidatePath("/dashboard/centre-academique/notes");
  revalidatePath("/dashboard/centre-academique/regles");
  revalidatePath("/dashboard/centre-academique/modeles-bulletins");
}

export async function creerTypeEvaluation(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_AJOUTER",
    "app/dashboard/centre-academique/actions.ts::creerTypeEvaluation",
  );

  const ecole = await securiser();
  const nom = texte(formData.get("nom"));
  const code = texte(formData.get("code")).toUpperCase();
  const coefficient = nombre(formData.get("coefficient")) || 1;
  const couleur = texte(formData.get("couleur")) || "#1761A8";
  const description = texte(formData.get("description")) || null;

  if (!nom || !code) {
    redirect(
      "/dashboard/centre-academique/types-evaluations?erreur=champs",
    );
  }

  try {
    await prisma.typeEvaluation.create({
      data: {
        ecoleId: ecole.id,
        nom,
        code,
        description,
        coefficient,
        couleur,
      },
    });
  } catch {
    redirect(
      "/dashboard/centre-academique/types-evaluations?erreur=doublon",
    );
  }

  revaliderCentreAcademique();
  redirect(
    "/dashboard/centre-academique/types-evaluations?succes=creation",
  );
}

export async function supprimerTypeEvaluation(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_SUPPRIMER",
    "app/dashboard/centre-academique/actions.ts::supprimerTypeEvaluation",
  );

  const ecole = await securiser();
  const id = nombre(formData.get("id"));

  if (!id) {
    redirect(
      "/dashboard/centre-academique/types-evaluations?erreur=introuvable",
    );
  }

  const resultat = await prisma.typeEvaluation.deleteMany({
    where: {
      id,
      ecoleId: ecole.id,
      evaluations: { none: {} },
    },
  });

  revaliderCentreAcademique();

  if (resultat.count === 0) {
    redirect(
      "/dashboard/centre-academique/types-evaluations?erreur=utilise",
    );
  }

  redirect(
    "/dashboard/centre-academique/types-evaluations?succes=suppression",
  );
}

export async function creerEvaluation(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_AJOUTER",
    "app/dashboard/centre-academique/actions.ts::creerEvaluation",
  );

  const ecole = await securiser();
  const titre = texte(formData.get("titre"));
  const typeEvaluationId = nombre(formData.get("typeEvaluationId"));
  const anneeScolaireId = nombre(formData.get("anneeScolaireId"));
  const periodeAcademiqueId = nombre(formData.get("periodeAcademiqueId"));
  const classeId = nombre(formData.get("classeId"));
  const matiereId = nombre(formData.get("matiereId"));
  const enseignantId = nombre(formData.get("enseignantId"));
  const dateTexte = texte(formData.get("dateEvaluation"));
  const dateEvaluation = new Date(dateTexte);

  if (
    !titre ||
    !typeEvaluationId ||
    !anneeScolaireId ||
    !periodeAcademiqueId ||
    !classeId ||
    !matiereId ||
    !enseignantId ||
    !dateTexte ||
    Number.isNaN(dateEvaluation.getTime())
  ) {
    redirect(
      "/dashboard/centre-academique/evaluations/nouvelle?erreur=champs",
    );
  }

  await prisma.evaluation.create({
    data: {
      ecoleId: ecole.id,
      titre,
      typeEvaluationId,
      anneeScolaireId,
      periodeAcademiqueId,
      classeId,
      matiereId,
      enseignantId,
      salleId: nombre(formData.get("salleId")) || null,
      dateEvaluation,
      heureDebut: texte(formData.get("heureDebut")) || null,
      bareme: nombre(formData.get("noteMax")) || 20,
      coefficient: nombre(formData.get("coefficient")) || 1,
      dureeMinutes: nombre(formData.get("dureeMinutes")) || null,
      description: texte(formData.get("description")) || null,
      statut: "BROUILLON",
      publiee: false,
    },
  });

  revaliderCentreAcademique();
  redirect("/dashboard/centre-academique/evaluations?succes=creation");
}

export async function changerStatutEvaluation(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_CHANGER_STATUT",
    "app/dashboard/centre-academique/actions.ts::changerStatutEvaluation",
  );

  const ecole = await securiser();
  const id = nombre(formData.get("id"));
  const statut = texte(formData.get("statut")).toUpperCase();

  if (!id || !["BROUILLON", "PUBLIEE", "CLOTUREE"].includes(statut)) {
    return;
  }

  await prisma.evaluation.updateMany({
    where: { id, ecoleId: ecole.id },
    data: {
      statut,
      publiee: statut === "PUBLIEE" || statut === "CLOTUREE",
    },
  });

  revaliderCentreAcademique();
}

export async function supprimerEvaluation(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_SUPPRIMER",
    "app/dashboard/centre-academique/actions.ts::supprimerEvaluation",
  );

  const ecole = await securiser();
  const id = nombre(formData.get("id"));

  if (!id) {
    redirect("/dashboard/centre-academique/evaluations?erreur=introuvable");
  }

  await prisma.evaluation.deleteMany({
    where: { id, ecoleId: ecole.id },
  });

  revaliderCentreAcademique();
  redirect("/dashboard/centre-academique/evaluations?succes=suppression");
}

export async function enregistrerNotes(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_MODIFIER",
    "app/dashboard/centre-academique/actions.ts::enregistrerNotes",
  );

  const ecole = await securiser();
  const evaluationId = nombre(formData.get("evaluationId"));

  const evaluation = await prisma.evaluation.findFirst({
    where: {
      id: evaluationId,
      ecoleId: ecole.id,
    },
    select: {
      id: true,
      bareme: true,
      classeId: true,
      anneeScolaireId: true,
    },
  });

  if (!evaluation) {
    redirect("/dashboard/centre-academique/notes?erreur=evaluation");
  }

  const donneesNotes: Array<{
    inscriptionId: number;
    valeur: number | null;
    absent: boolean;
    appreciation: string | null;
  }> = [];

  for (const [cle, valeurFormulaire] of formData.entries()) {
    if (!cle.startsWith("note_")) {
      continue;
    }

    const inscriptionId = Number(cle.slice(5));

    if (!Number.isInteger(inscriptionId) || inscriptionId <= 0) {
      continue;
    }

    const valeurBrute = String(valeurFormulaire).trim();
    const absent = formData.get(`absent_${inscriptionId}`) === "on";
    const valeurNumerique = Number(valeurBrute);
    const valeur: number | null = absent ? null : valeurNumerique;

    if (
      !absent &&
      (valeurBrute === "" ||
        Number.isNaN(valeurNumerique) ||
        valeurNumerique < 0 ||
        valeurNumerique > Number(evaluation.bareme))
    ) {
      continue;
    }

    donneesNotes.push({
      inscriptionId,
      valeur,
      absent,
      appreciation:
        texte(formData.get(`appreciation_${inscriptionId}`)) || null,
    });
  }

  if (donneesNotes.length === 0) {
    redirect(
      `/dashboard/centre-academique/notes?evaluationId=${evaluationId}&erreur=notes`,
    );
  }

  const inscriptions = await prisma.inscription.findMany({
    where: {
      id: { in: donneesNotes.map((item) => item.inscriptionId) },
      classeId: evaluation.classeId,
      anneeScolaireId: evaluation.anneeScolaireId,
      eleve: { ecoleId: ecole.id },
    },
    select: {
      id: true,
      eleveId: true,
    },
  });

  const eleveParInscription = new Map(
    inscriptions.map((inscription) => [inscription.id, inscription.eleveId]),
  );

  const operations = donneesNotes.flatMap((item) => {
    const eleveId = eleveParInscription.get(item.inscriptionId);

    if (!eleveId) {
      return [];
    }

    return [
      prisma.noteEvaluation.upsert({
        where: {
          evaluationId_eleveId: {
            evaluationId,
            eleveId,
          },
        },
        create: {
          evaluationId,
          eleveId,
          valeur: item.valeur,
          absent: item.absent,
          appreciation: item.appreciation,
        },
        update: {
          valeur: item.valeur,
          absent: item.absent,
          appreciation: item.appreciation,
        },
      }),
    ];
  });

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      statut: "PUBLIEE",
      publiee: true,
    },
  });

  revaliderCentreAcademique();
  redirect(
    `/dashboard/centre-academique/notes?evaluationId=${evaluationId}&succes=enregistrement`,
  );
}

export async function enregistrerRegles(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_MODIFIER",
    "app/dashboard/centre-academique/actions.ts::enregistrerRegles",
  );

  const ecole = await securiser();
  const donnees = {
    seuilReussite: nombre(formData.get("seuilReussite")) || 50,
    mentionExcellent: nombre(formData.get("mentionExcellent")) || 80,
    mentionTresBien: nombre(formData.get("mentionTresBien")) || 70,
    mentionBien: nombre(formData.get("mentionBien")) || 60,
    mentionAssezBien: nombre(formData.get("mentionAssezBien")) || 50,
    arrondiDecimales: nombre(formData.get("arrondiDecimales")) || 2,
  };

  await prisma.regleEvaluation.upsert({
    where: { ecoleId: ecole.id },
    create: {
      ecoleId: ecole.id,
      ...donnees,
    },
    update: donnees,
  });

  revaliderCentreAcademique();
  redirect("/dashboard/centre-academique/regles?succes=enregistrement");
}

export async function creerModeleBulletin(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_AJOUTER",
    "app/dashboard/centre-academique/actions.ts::creerModeleBulletin",
  );

  const ecole = await securiser();
  const nom = texte(formData.get("nom"));
  const code = texte(formData.get("code"))
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "_");

  if (!nom || !code) {
    redirect(
      "/dashboard/centre-academique/modeles-bulletins/nouveau?erreur=champs",
    );
  }

  const parDefaut = estCoche(formData, "parDefaut");
  const configuration = {
    colonnes: [
      "matiere",
      "note",
      "coefficient",
      "moyenne",
      "appreciation",
    ],
  };

  try {
    await prisma.$transaction(async (transaction) => {
      if (parDefaut) {
        await transaction.modeleBulletin.updateMany({
          where: { ecoleId: ecole.id },
          data: { parDefaut: false },
        });
      }

      const modele = await transaction.modeleBulletin.create({
        data: {
          ecoleId: ecole.id,
          nom,
          code,
          niveau: texte(formData.get("niveau")) || null,
          orientation: texte(formData.get("orientation")) || "PORTRAIT",
          formatPapier: texte(formData.get("formatPapier")) || "A4",
          couleurPrincipale:
            texte(formData.get("couleurPrincipale")) || "#1761A8",
          couleurSecondaire:
            texte(formData.get("couleurSecondaire")) || "#F4B400",
          titreDocument:
            texte(formData.get("titreDocument")) || "BULLETIN SCOLAIRE",
          afficherLogo: estCoche(formData, "afficherLogo"),
          afficherPhoto: estCoche(formData, "afficherPhoto"),
          afficherClassement: estCoche(formData, "afficherClassement"),
          afficherAbsences: estCoche(formData, "afficherAbsences"),
          afficherQrCode: estCoche(formData, "afficherQrCode"),
          afficherCachet: estCoche(formData, "afficherCachet"),
          signature1: texte(formData.get("signature1")) || null,
          signature2: texte(formData.get("signature2")) || null,
          signature3: texte(formData.get("signature3")) || null,
          textePiedPage: texte(formData.get("textePiedPage")) || null,
          fondDocument: texte(formData.get("fondDocument")) || null,
          parDefaut,
          configuration,
        },
      });

      await transaction.versionModeleBulletin.create({
        data: {
          modeleBulletinId: modele.id,
          numeroVersion: 1,
          configuration,
          commentaire: "Création du modèle",
        },
      });
    });
  } catch {
    redirect(
      "/dashboard/centre-academique/modeles-bulletins/nouveau?erreur=doublon",
    );
  }

  revaliderCentreAcademique();
  redirect("/dashboard/centre-academique/modeles-bulletins?succes=creation");
}

export async function modifierModeleBulletin(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_MODIFIER",
    "app/dashboard/centre-academique/actions.ts::modifierModeleBulletin",
  );

  const ecole = await securiser();
  const id = nombre(formData.get("id"));

  const modele = await prisma.modeleBulletin.findFirst({
    where: { id, ecoleId: ecole.id },
  });

  if (!modele) {
    redirect(
      "/dashboard/centre-academique/modeles-bulletins?erreur=introuvable",
    );
  }

  const parDefaut = estCoche(formData, "parDefaut");
  const colonnes = [
    "matiere",
    "interrogation",
    "devoir",
    "examen",
    "note",
    "coefficient",
    "moyenne",
    "place",
    "appreciation",
  ].filter((colonne) => estCoche(formData, `colonne_${colonne}`));

  await prisma.$transaction(async (transaction) => {
    if (parDefaut) {
      await transaction.modeleBulletin.updateMany({
        where: {
          ecoleId: ecole.id,
          NOT: { id },
        },
        data: { parDefaut: false },
      });
    }

    const version = modele.version + 1;
    const configuration = { colonnes };

    await transaction.modeleBulletin.update({
      where: { id },
      data: {
        nom: texte(formData.get("nom")),
        niveau: texte(formData.get("niveau")) || null,
        orientation: texte(formData.get("orientation")) || "PORTRAIT",
        formatPapier: texte(formData.get("formatPapier")) || "A4",
        couleurPrincipale:
          texte(formData.get("couleurPrincipale")) || "#1761A8",
        couleurSecondaire:
          texte(formData.get("couleurSecondaire")) || "#F4B400",
        titreDocument:
          texte(formData.get("titreDocument")) || "BULLETIN SCOLAIRE",
        afficherLogo: estCoche(formData, "afficherLogo"),
        afficherPhoto: estCoche(formData, "afficherPhoto"),
        afficherClassement: estCoche(formData, "afficherClassement"),
        afficherAbsences: estCoche(formData, "afficherAbsences"),
        afficherQrCode: estCoche(formData, "afficherQrCode"),
        afficherCachet: estCoche(formData, "afficherCachet"),
        signature1: texte(formData.get("signature1")) || null,
        signature2: texte(formData.get("signature2")) || null,
        signature3: texte(formData.get("signature3")) || null,
        textePiedPage: texte(formData.get("textePiedPage")) || null,
        fondDocument: texte(formData.get("fondDocument")) || null,
        actif: estCoche(formData, "actif"),
        parDefaut,
        version,
        configuration,
      },
    });

    await transaction.versionModeleBulletin.create({
      data: {
        modeleBulletinId: id,
        numeroVersion: version,
        configuration,
        commentaire: "Mise à jour du modèle",
      },
    });
  });

  revalidatePath(`/dashboard/centre-academique/modeles-bulletins/${id}`);
  revaliderCentreAcademique();
  redirect(
    `/dashboard/centre-academique/modeles-bulletins/${id}?succes=enregistrement`,
  );
}

export async function dupliquerModeleBulletin(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_MODIFIER",
    "app/dashboard/centre-academique/actions.ts::dupliquerModeleBulletin",
  );

  const ecole = await securiser();
  const id = nombre(formData.get("id"));

  const source = await prisma.modeleBulletin.findFirst({
    where: { id, ecoleId: ecole.id },
  });

  if (!source) {
    return;
  }

  let code = `${source.code}_COPIE`;
  let compteur = 2;

  while (
    await prisma.modeleBulletin.findFirst({
      where: { ecoleId: ecole.id, code },
      select: { id: true },
    })
  ) {
    code = `${source.code}_COPIE_${compteur++}`;
  }

  const nouveauModele = await prisma.modeleBulletin.create({
    data: {
      ecoleId: source.ecoleId,
      nom: `${source.nom} (copie)`,
      code,
      niveau: source.niveau,
      orientation: source.orientation,
      formatPapier: source.formatPapier,
      couleurPrincipale: source.couleurPrincipale,
      couleurSecondaire: source.couleurSecondaire,
      titreDocument: source.titreDocument,
      afficherLogo: source.afficherLogo,
      afficherPhoto: source.afficherPhoto,
      afficherClassement: source.afficherClassement,
      afficherAbsences: source.afficherAbsences,
      afficherQrCode: source.afficherQrCode,
      afficherCachet: source.afficherCachet,
      signature1: source.signature1,
      signature2: source.signature2,
      signature3: source.signature3,
      textePiedPage: source.textePiedPage,
      fondDocument: source.fondDocument,
      configuration: source.configuration ?? undefined,
      actif: source.actif,
      parDefaut: false,
      version: 1,
    },
  });

  await prisma.versionModeleBulletin.create({
    data: {
      modeleBulletinId: nouveauModele.id,
      numeroVersion: 1,
      configuration: source.configuration ?? undefined,
      commentaire: `Copie du modèle ${source.nom}`,
    },
  });

  revaliderCentreAcademique();
}

export async function supprimerModeleBulletin(formData: FormData) {
  await exigerPermission(
    "ACADEMIQUE_SUPPRIMER",
    "app/dashboard/centre-academique/actions.ts::supprimerModeleBulletin",
  );

  const ecole = await securiser();
  const id = nombre(formData.get("id"));

  await prisma.modeleBulletin.deleteMany({
    where: {
      id,
      ecoleId: ecole.id,
      parDefaut: false,
    },
  });

  revaliderCentreAcademique();
}
