"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

export async function lierCompteParent(formData: FormData) {
  await exigerPermission("PARENTS_COMPTES_PORTAIL_GERER");

  const ecole = await obtenirOuCreerEcole();
  const parentId = Number(formData.get("parent_id") ?? 0);
  const utilisateurSecuriteId = Number(
    formData.get("utilisateur_securite_id") ?? 0
  );

  if (parentId <= 0 || utilisateurSecuriteId <= 0) {
    redirect("/dashboard/parents/comptes-portail?erreur=champs");
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE parents_utilisateurs_portail
      SET actif = 0, updated_at = NOW()
      WHERE ecole_id = ${ecole.id}
        AND (
          parent_id = ${parentId}
          OR utilisateur_securite_id =
            ${utilisateurSecuriteId}
        )
    `;

    await tx.$executeRaw`
      INSERT INTO parents_utilisateurs_portail
      (
        ecole_id,
        parent_id,
        utilisateur_securite_id,
        actif,
        created_at,
        updated_at
      )
      VALUES
      (
        ${ecole.id},
        ${parentId},
        ${utilisateurSecuriteId},
        1,
        NOW(),
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        actif = 1,
        updated_at = NOW()
    `;
  });

  revalidatePath("/dashboard/parents/comptes-portail");
  redirect("/dashboard/parents/comptes-portail?succes=liaison");
}
