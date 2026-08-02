"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerEleveTitulaire } from "@/lib/titulaire";
import { exigerPermission } from "@/lib/securite/rbac";

export async function ajouterObservationTitulaire(
  formData: FormData
) {
  await exigerPermission(
    "TITULAIRE_OBSERVATIONS_AJOUTER"
  );

  const eleveId = Number(
    formData.get("eleve_id") ?? 0
  );
  const contenu = String(
    formData.get("contenu") ?? ""
  ).trim();

  const contexte =
    await exigerEleveTitulaire(eleveId);

  if (!contenu) {
    redirect(
      `/dashboard/titulaire/observations?eleveId=${eleveId}&erreur=contenu`
    );
  }

  await prisma.observationEleve.create({
    data: {
      eleveId,
      contenu,
      auteur: contexte.utilisateur.nom,
    },
  });

  revalidatePath(
    "/dashboard/titulaire/observations"
  );
  redirect(
    `/dashboard/titulaire/observations?eleveId=${eleveId}&succes=1`
  );
}
