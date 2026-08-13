"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { verifierQuota } from "@/lib/licence";

export async function creerClasse(formData: FormData) {
  await exigerPermission(
    "CLASSES_AJOUTER",
    "app/dashboard/classes/actions.ts::creerClasse"
  );

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const quota = await verifierQuota(ecole.id, "classes");
  if (!quota.autorise) {
    redirect(
      `/dashboard/classes?erreur=${encodeURIComponent(
        quota.message || "Limite de licence atteinte"
      )}`
    );
  }

  const nom = formData.get("nom")?.toString().trim();
  const codeSaisi = formData.get("code")?.toString().trim().toUpperCase();
  const sectionId = Number(formData.get("sectionId"));
  const niveau = formData.get("niveau")?.toString().trim() || null;
  const capacite = Math.max(1, Number(formData.get("capacite")) || 40);
  const titulaire = formData.get("titulaire")?.toString().trim() || null;
  const local = formData.get("local")?.toString().trim() || null;

  if (!nom || !codeSaisi || !sectionId) {
    redirect("/dashboard/classes?erreur=champs");
  }

  const section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      ecoleId: ecole.id,
      statut: "active",
    },
    select: {
      id: true,
      nom: true,
      code: true,
    },
  });

  if (!section) {
    redirect("/dashboard/classes?erreur=section");
  }

  /*
  |--------------------------------------------------------------------------
  | Code de classe unique dans toute l'école
  |--------------------------------------------------------------------------
  | Le schéma Prisma impose @@unique([ecoleId, code]).
  | Donc "1A" ne peut pas exister deux fois, même dans deux sections différentes.
  |
  | Pour permettre :
  | - Primaire : 1ère A
  | - Secondaire : 1ère A
  | - Humanités : 1ère A
  | - Université : L1 A
  |
  | on préfixe automatiquement le code par le code de la section.
  | Exemple : PRIM-1A, SEC-1A, HUM-1A, UNI-L1A.
  |--------------------------------------------------------------------------
  */
  const prefixeSection = section.code.trim().toUpperCase().replace(/\s+/g, "-");
  const codeNettoye = codeSaisi.replace(/\s+/g, "-");
  const code = codeNettoye.startsWith(`${prefixeSection}-`)
    ? codeNettoye
    : `${prefixeSection}-${codeNettoye}`;

  /*
  |--------------------------------------------------------------------------
  | Doublon métier
  |--------------------------------------------------------------------------
  | Le nom peut se répéter dans une autre section, mais pas dans la même section.
  | Le code final reste unique dans toute l'école.
  |--------------------------------------------------------------------------
  */
  const doublonNom = await prisma.classe.findFirst({
    where: {
      ecoleId: ecole.id,
      sectionId,
      nom,
    },
    select: { id: true },
  });

  if (doublonNom) {
    redirect("/dashboard/classes?erreur=doublon_nom");
  }

  const doublonCode = await prisma.classe.findFirst({
    where: {
      ecoleId: ecole.id,
      code,
    },
    select: { id: true },
  });

  if (doublonCode) {
    redirect("/dashboard/classes?erreur=doublon_code");
  }

  try {
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
  } catch (erreur) {
    console.error("Erreur création classe :", erreur);

    if (
      typeof erreur === "object" &&
      erreur !== null &&
      "code" in erreur &&
      (erreur as { code?: string }).code === "P2002"
    ) {
      redirect("/dashboard/classes?erreur=doublon_code");
    }

    redirect("/dashboard/classes?erreur=creation");
  }

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eleves/nouveau");
  revalidatePath("/dashboard/emploi-du-temps");
  revalidatePath("/dashboard/emploi-du-temps/nouveau");

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
