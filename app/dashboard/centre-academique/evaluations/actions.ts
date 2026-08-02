"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

const texte = (fd: FormData, nom: string) => String(fd.get(nom) ?? "").trim();
const entier = (fd: FormData, nom: string) => {
  const valeur = Number(fd.get(nom));
  return Number.isInteger(valeur) ? valeur : 0;
};
const decimal = (fd: FormData, nom: string) => {
  const valeur = Number(String(fd.get(nom) ?? "0").replace(",", "."));
  return Number.isFinite(valeur) ? valeur : 0;
};

export async function creerTypeEvaluation(formData: FormData) {
  await exigerPermission("ACADEMIQUE_AJOUTER", "Créer un type d’évaluation");
  const ecole = await obtenirOuCreerEcole();
  const nom = texte(formData, "nom");
  const code = texte(formData, "code").toUpperCase().replace(/\s+/g, "_");
  const coefficient = decimal(formData, "coefficient");

  if (!nom || !code) throw new Error("Le nom et le code sont obligatoires.");
  if (coefficient <= 0) throw new Error("Le coefficient doit être supérieur à zéro.");

  await prisma.typeEvaluation.create({
    data: {
      ecoleId: ecole.id,
      nom,
      code,
      description: texte(formData, "description") || null,
      coefficient: new Prisma.Decimal(coefficient),
      couleur: texte(formData, "couleur") || "#2563EB",
      actif: true,
    },
  });

  revalidatePath("/dashboard/centre-academique/evaluations/types");
  redirect("/dashboard/centre-academique/evaluations/types?succes=creation");
}

export async function changerStatutTypeEvaluation(formData: FormData) {
  await exigerPermission("ACADEMIQUE_CHANGER_STATUT", "Statut type évaluation");
  const id = entier(formData, "id");
  const actif = texte(formData, "actif") === "true";
  if (id <= 0) throw new Error("Type d’évaluation invalide.");
  await prisma.typeEvaluation.update({ where: { id }, data: { actif } });
  revalidatePath("/dashboard/centre-academique/evaluations/types");
}

export async function creerEvaluation(formData: FormData) {
  await exigerPermission("EVALUATIONS_AJOUTER", "Créer une évaluation");
  const ecole = await obtenirOuCreerEcole();

  const anneeScolaireId = entier(formData, "anneeScolaireId");
  const periodeAcademiqueId = entier(formData, "periodeAcademiqueId");
  const classeId = entier(formData, "classeId");
  const matiereId = entier(formData, "matiereId");
  const enseignantId = entier(formData, "enseignantId");
  const typeEvaluationId = entier(formData, "typeEvaluationId");
  const salleId = entier(formData, "salleId");
  const titre = texte(formData, "titre");
  const dateEvaluation = texte(formData, "dateEvaluation");
  const bareme = decimal(formData, "bareme");
  const coefficient = decimal(formData, "coefficient");

  if (!anneeScolaireId || !periodeAcademiqueId || !classeId || !matiereId || !enseignantId || !typeEvaluationId) {
    throw new Error("Veuillez compléter tous les champs académiques obligatoires.");
  }
  if (!titre || !dateEvaluation) throw new Error("Le titre et la date sont obligatoires.");
  if (bareme <= 0 || coefficient <= 0) throw new Error("Le barème et le coefficient doivent être supérieurs à zéro.");

  const evaluation = await prisma.evaluation.create({
    data: {
      ecoleId: ecole.id,
      anneeScolaireId,
      periodeAcademiqueId,
      classeId,
      matiereId,
      enseignantId,
      typeEvaluationId,
      salleId: salleId || null,
      titre,
      description: texte(formData, "description") || null,
      dateEvaluation: new Date(`${dateEvaluation}T12:00:00`),
      heureDebut: texte(formData, "heureDebut") || null,
      dureeMinutes: entier(formData, "dureeMinutes") || null,
      bareme: new Prisma.Decimal(bareme),
      coefficient: new Prisma.Decimal(coefficient),
      statut: "BROUILLON",
      publiee: false,
    },
  });

  revalidatePath("/dashboard/centre-academique/evaluations");
  redirect(`/dashboard/centre-academique/evaluations/${evaluation.id}/notes?succes=creation`);
}

export async function changerStatutEvaluation(formData: FormData) {
  await exigerPermission("EVALUATIONS_MODIFIER", "Changer le statut d’une évaluation");
  const id = entier(formData, "id");
  const statut = texte(formData, "statut");
  const statuts = ["BROUILLON", "PROGRAMMEE", "EN_COURS", "TERMINEE", "ARCHIVEE"];
  if (id <= 0 || !statuts.includes(statut)) throw new Error("Statut invalide.");

  await prisma.evaluation.update({
    where: { id },
    data: { statut, publiee: false },
  });

  revalidatePath("/dashboard/centre-academique/evaluations");
  revalidatePath(`/dashboard/centre-academique/evaluations/${id}/notes`);
}

export async function cloturerEtPublierEvaluation(evaluationId: number) {
  await exigerPermission("EVALUATIONS_CLOTURER", "Clôturer et publier une évaluation");

  if (!Number.isInteger(evaluationId) || evaluationId <= 0) {
    throw new Error("Évaluation invalide.");
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: {
      id: true,
      statut: true,
      _count: { select: { notes: true } },
    },
  });

  if (!evaluation) throw new Error("Évaluation introuvable.");

  if (evaluation._count.notes <= 0) {
    redirect(`/dashboard/centre-academique/evaluations/${evaluationId}/notes?erreur=aucune_note`);
  }

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { statut: "PUBLIEE", publiee: true },
  });

  revalidatePath("/dashboard/centre-academique/evaluations");
  revalidatePath(`/dashboard/centre-academique/evaluations/${evaluationId}/notes`);
  revalidatePath("/dashboard/centre-academique/resultats");
  revalidatePath("/dashboard/centre-academique/classements");
  revalidatePath("/dashboard/centre-academique/bulletins");

  redirect(`/dashboard/centre-academique/evaluations/${evaluationId}/notes?succes=publication`);
}

export async function enregistrerNotes(evaluationId: number, formData: FormData) {
  await exigerPermission("NOTES_SAISIR", "Saisir les notes");

  if (!Number.isInteger(evaluationId) || evaluationId <= 0) {
    throw new Error("Évaluation invalide.");
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { bareme: true, statut: true },
  });

  if (!evaluation) throw new Error("Évaluation introuvable.");
  if (evaluation.statut === "PUBLIEE") {
    throw new Error("Cette évaluation est publiée. Les notes sont verrouillées.");
  }

  const bareme = Number(evaluation.bareme);
  const eleveIds = formData.getAll("eleveId").map(Number).filter((id) => Number.isInteger(id) && id > 0);

  await prisma.$transaction(
    eleveIds.map((eleveId) => {
      const absent = formData.get(`absent_${eleveId}`) === "on";
      const valeurBrute = texte(formData, `note_${eleveId}`);
      const valeur = absent || valeurBrute === "" ? null : Number(valeurBrute.replace(",", "."));

      if (valeur !== null && (!Number.isFinite(valeur) || valeur < 0 || valeur > bareme)) {
        throw new Error(`Une note doit être comprise entre 0 et ${bareme}.`);
      }

      return prisma.noteEvaluation.upsert({
        where: { evaluationId_eleveId: { evaluationId, eleveId } },
        create: {
          evaluationId,
          eleveId,
          valeur: valeur === null ? null : new Prisma.Decimal(valeur),
          absent,
          appreciation: texte(formData, `appreciation_${eleveId}`) || null,
        },
        update: {
          valeur: valeur === null ? null : new Prisma.Decimal(valeur),
          absent,
          appreciation: texte(formData, `appreciation_${eleveId}`) || null,
        },
      });
    })
  );

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { statut: "TERMINEE", publiee: false },
  });

  revalidatePath(`/dashboard/centre-academique/evaluations/${evaluationId}/notes`);
  revalidatePath("/dashboard/centre-academique/evaluations");
  redirect(`/dashboard/centre-academique/evaluations/${evaluationId}/notes?succes=notes`);
}
