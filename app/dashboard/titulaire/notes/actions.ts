"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import { exigerPermission } from "@/lib/securite/rbac";

export async function enregistrerNotesTitulaire(
  evaluationId: number,
  formData: FormData
) {
  await exigerPermission("TITULAIRE_NOTES_SAISIR");

  const contexte = await obtenirContexteTitulaire();

  const evaluation = await prisma.evaluation.findFirst({
    where: {
      id: evaluationId,
      classeId: contexte.classeId,
      anneeScolaireId:
        contexte.anneeScolaireId,
    },
    select: {
      bareme: true,
      statut: true,
    },
  });

  if (!evaluation) {
    redirect("/acces-refuse?permission=TITULAIRE_EVALUATION_CLASSE");
  }

  if (evaluation.statut === "PUBLIEE") {
    throw new Error(
      "Cette évaluation est publiée et verrouillée."
    );
  }

  const bareme = Number(evaluation.bareme);
  const inscriptions =
    await prisma.inscription.findMany({
      where: {
        classeId: contexte.classeId,
        anneeScolaireId:
          contexte.anneeScolaireId,
        statut: { in: ["inscrit", "admis"] },
      },
      select: { eleveId: true },
    });

  const idsAutorises = new Set(
    inscriptions.map((ligne) => ligne.eleveId)
  );

  const eleveIds = formData
    .getAll("eleve_id")
    .map(Number)
    .filter((id) => idsAutorises.has(id));

  await prisma.$transaction(
    eleveIds.map((eleveId) => {
      const absent =
        formData.get(`absent_${eleveId}`) === "on";
      const brut = String(
        formData.get(`note_${eleveId}`) ?? ""
      ).trim();
      const valeur =
        absent || brut === ""
          ? null
          : Number(brut.replace(",", "."));

      if (
        valeur !== null &&
        (
          !Number.isFinite(valeur) ||
          valeur < 0 ||
          valeur > bareme
        )
      ) {
        throw new Error(
          `La note doit être comprise entre 0 et ${bareme}.`
        );
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
          valeur:
            valeur === null
              ? null
              : new Prisma.Decimal(valeur),
          absent,
          appreciation:
            String(
              formData.get(
                `appreciation_${eleveId}`
              ) ?? ""
            ).trim() || null,
        },
        update: {
          valeur:
            valeur === null
              ? null
              : new Prisma.Decimal(valeur),
          absent,
          appreciation:
            String(
              formData.get(
                `appreciation_${eleveId}`
              ) ?? ""
            ).trim() || null,
        },
      });
    })
  );

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      statut: "TERMINEE",
      publiee: false,
    },
  });

  revalidatePath("/dashboard/titulaire/notes");
  redirect(
    `/dashboard/titulaire/notes?evaluationId=${evaluationId}&succes=1`
  );
}
