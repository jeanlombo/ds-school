"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { verifierQuota } from "@/lib/licence";

export async function creerClasse(formData: FormData) {
  await exigerPermission("CLASSES_AJOUTER", "app/dashboard/classes/actions.ts::creerClasse");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const quota = await verifierQuota(ecole.id, "classes");
  if (!quota.autorise) redirect(`/dashboard/classes?erreur=${encodeURIComponent(quota.message || "Limite de licence atteinte")}`);
  const nom = formData.get("nom")?.toString().trim();
  const code = formData.get("code")?.toString().trim().toUpperCase();
  const sectionId = Number(formData.get("sectionId"));
  const niveau = formData.get("niveau")?.toString().trim() || null;
  const capacite = Math.max(1, Number(formData.get("capacite")) || 40);
  const titulaire = formData.get("titulaire")?.toString().trim() || null;
  const local = formData.get("local")?.toString().trim() || null;

  if (!nom || !code || !sectionId) {
    redirect("/dashboard/classes?erreur=champs");
  }

  const section = await prisma.section.findFirst({
    where: { id: sectionId, ecoleId: ecole.id, statut: "active" },
    select: { id: true },
  });

  if (!section) redirect("/dashboard/classes?erreur=section");

  const doublon = await prisma.classe.findFirst({
    where: {
      ecoleId: ecole.id,
      OR: [{ code }, { nom, sectionId }],
    },
    select: { id: true },
  });

  if (doublon) redirect("/dashboard/classes?erreur=doublon");

  await prisma.classe.create({
    data: {
      ecoleId: ecole.id,
      sectionId,
      nom,
      code,
      niveau,
      capacite,
      titulaire,
      local,
    },
  });

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard");
  redirect("/dashboard/classes?succes=creation");
}

export async function basculerClasse(formData: FormData) {
  await exigerPermission("CLASSES_CHANGER_STATUT", "app/dashboard/classes/actions.ts::basculerClasse");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const id = Number(formData.get("id"));
  if (!id) redirect("/dashboard/classes?erreur=introuvable");

  const classe = await prisma.classe.findFirst({
    where: { id, ecoleId: ecole.id },
    select: { id: true, statut: true },
  });

  if (!classe) redirect("/dashboard/classes?erreur=introuvable");

  await prisma.classe.update({
    where: { id: classe.id },
    data: { statut: classe.statut === "active" ? "inactive" : "active" },
  });

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard");
  redirect("/dashboard/classes?succes=statut");
}
