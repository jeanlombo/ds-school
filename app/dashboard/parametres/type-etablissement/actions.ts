"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { exigerPermission } from "@/lib/securite/rbac";
import { obtenirUtilisateurConnecte } from "@/lib/session";

const TYPES = new Set(["PRIMAIRE", "SECONDAIRE", "UNIVERSITE", "MIXTE"]);

export async function modifierTypeEtablissement(formData: FormData) {
  await exigerPermission(
    "PARAMETRES_VOIR",
    "app/dashboard/parametres/type-etablissement/actions.ts::modifierTypeEtablissement",
  );

  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const typeEtablissement = String(formData.get("typeEtablissement") ?? "")
    .trim()
    .toUpperCase();

  if (!TYPES.has(typeEtablissement)) {
    redirect("/dashboard/parametres/type-etablissement?erreur=type");
  }

  await prisma.ecole.update({
    where: { id: ecole.id },
    data: { typeEtablissement },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/annees-scolaires");
  revalidatePath("/dashboard/universite");
  revalidatePath("/dashboard/parametres/type-etablissement");
  redirect("/dashboard/parametres/type-etablissement?succes=1");
}
