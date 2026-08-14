"use server";

import { exigerPermission } from "@/lib/securite/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { verifierQuota } from "@/lib/licence";

function codeNormalise(valeur: FormDataEntryValue | null) {
  return (valeur?.toString() || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

export async function creerSection(formData: FormData) {
  await exigerPermission(
    "SECTIONS_AJOUTER",
    "app/dashboard/sections/actions.ts::creerSection"
  );

  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const quota = await verifierQuota(ecole.id, "sections");
  if (!quota.autorise) {
    redirect(
      `/dashboard/sections?erreur=${encodeURIComponent(
        quota.message || "Limite de licence atteinte"
      )}`
    );
  }

  const nom = formData.get("nom")?.toString().trim();
  const code = codeNormalise(formData.get("code"));
  const description =
    formData.get("description")?.toString().trim() || null;
  const typeSection = formData.get("typeSection")?.toString().trim().toUpperCase() || "AUTRE";
  const typesAutorises = ["PRIMAIRE", "SECONDAIRE", "HUMANITES", "UNIVERSITE", "INSTITUT_SUPERIEUR", "AUTRE"];

  if (!nom || !code || !typesAutorises.includes(typeSection)) {
    redirect("/dashboard/sections?erreur=champs");
  }

  const doublon = await prisma.section.findFirst({
    where: {
      ecoleId: ecole.id,
      OR: [{ code }, { nom }],
    },
    select: { id: true },
  });

  if (doublon) {
    redirect("/dashboard/sections?erreur=doublon");
  }

  try {
    await prisma.section.create({
      data: {
        ecoleId: ecole.id,
        nom,
        code,
        description,
        typeSection,
      },
    });
  } catch (erreur) {
    console.error("Erreur création structure académique :", erreur);
    redirect("/dashboard/sections?erreur=creation");
  }

  revalidatePath("/dashboard/sections");
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/eleves");
  revalidatePath("/dashboard/enseignants");
  revalidatePath("/dashboard/emploi-du-temps");

  redirect("/dashboard/sections?succes=1");
}

export async function basculerSection(formData: FormData) {
  await exigerPermission(
    "SECTIONS_CHANGER_STATUT",
    "app/dashboard/sections/actions.ts::basculerSection"
  );

  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const id = Number(formData.get("id"));

  const section = await prisma.section.findFirst({
    where: { id, ecoleId: ecole.id },
    select: { id: true, statut: true },
  });

  if (!section) {
    redirect("/dashboard/sections?erreur=introuvable");
  }

  const statut = section.statut === "active" ? "inactive" : "active";

  await prisma.section.update({
    where: { id: section.id },
    data: { statut },
  });

  revalidatePath("/dashboard/sections");
  revalidatePath("/dashboard/classes");
}
