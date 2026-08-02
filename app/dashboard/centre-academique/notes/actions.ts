"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";

function texte(formData: FormData, nom: string): string {
  return String(formData.get(nom) ?? "").trim();
}

export async function enregistrerCarnetNotes(
  evaluationId: number,
  formData: FormData,
) {
  await exigerPermission("ACADEMIQUE_MODIFIER", "app/dashboard/centre-academique/notes/actions.ts::enregistrerCarnetNotes");
  const ecole = await obtenirOuCreerEcole();

  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, ecoleId: ecole.id },
    select: { id: true, bareme: true },
  });

  if (!evaluation) {
    throw new Error("Évaluation introuvable ou non autorisée.");
  }

  const bareme = Number(evaluation.bareme);
  const eleveIds = formData
    .getAll("eleveId")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

  const operations = eleveIds.map((eleveId) => {
    const absent = formData.get(`absent_${eleveId}`) === "on";
    const valeurBrute = texte(formData, `note_${eleveId}`).replace(",", ".");
    const valeur = absent || valeurBrute === "" ? null : Number(valeurBrute);

    if (
      valeur !== null &&
      (!Number.isFinite(valeur) || valeur < 0 || valeur > bareme)
    ) {
      throw new Error(`Chaque note doit être comprise entre 0 et ${bareme}.`);
    }

    return prisma.noteEvaluation.upsert({
      where: {
        evaluationId_eleveId: {
          evaluationId,
          eleveId,
        },
      },
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
  });

  await prisma.$transaction(operations);

  revalidatePath("/dashboard/centre-academique/notes");
  revalidatePath("/dashboard/centre-academique/resultats");
  revalidatePath("/dashboard/centre-academique/classements");

  redirect(
    `/dashboard/centre-academique/notes?evaluationId=${evaluationId}&succes=1`,
  );
}
