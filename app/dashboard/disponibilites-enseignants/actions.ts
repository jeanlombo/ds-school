"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

export async function enregistrerDisponibilites(
  formData: FormData
) {
  await exigerPermission(
    "DISPONIBILITES_ENSEIGNANTS_GERER"
  );

  const ecole = await obtenirOuCreerEcole();
  const enseignantId = Number(
    formData.get("enseignant_id") ?? 0
  );

  if (enseignantId <= 0) {
    redirect(
      "/dashboard/disponibilites-enseignants?erreur=enseignant"
    );
  }

  const enseignant =
    await prisma.enseignant.findFirst({
      where: {
        id: enseignantId,
        ecoleId: ecole.id,
        statut: "actif",
      },
      select: { id: true },
    });

  if (!enseignant) {
    redirect(
      "/dashboard/disponibilites-enseignants?erreur=enseignant"
    );
  }

  const valeurs = formData
    .getAll("disponibilites")
    .map(String);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM disponibilites_enseignants
      WHERE ecole_id = ${ecole.id}
        AND enseignant_id = ${enseignantId}
    `;

    for (const valeur of valeurs) {
      const [jour, creneau] =
        valeur.split(":");
      const creneauId = Number(creneau);

      if (!jour || !Number.isInteger(creneauId)) {
        continue;
      }

      await tx.$executeRaw`
        INSERT INTO disponibilites_enseignants
        (
          ecole_id,
          enseignant_id,
          jour,
          creneau_horaire_id,
          disponible,
          created_at,
          updated_at
        )
        VALUES
        (
          ${ecole.id},
          ${enseignantId},
          ${jour},
          ${creneauId},
          1,
          NOW(),
          NOW()
        )
      `;
    }
  });

  revalidatePath(
    "/dashboard/disponibilites-enseignants"
  );

  redirect(
    `/dashboard/disponibilites-enseignants?enseignant=${enseignantId}&succes=1`
  );
}
