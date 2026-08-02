"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "").trim();
}

export async function creerRole(formData: FormData) {
  await exigerPermission("SECURITE_AJOUTER", "app/dashboard/securite/roles/actions.ts::creerRole");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  if (!utilisateur.superAdministrateur) {
    redirect("/acces-refuse?permission=SECURITE_ROLES");
  }

  const code = texte(formData, "code").toUpperCase();
  const nom = texte(formData, "nom");
  const description = texte(formData, "description") || null;

  const ecole = await prisma.ecole.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!ecole || !code || !nom) {
    redirect("/dashboard/securite/roles?erreur=champs");
  }

  await prisma.$executeRaw`
    INSERT INTO roles_securite
    (
      ecole_id, code, nom, description,
      systeme, actif, cree_par, created_at, updated_at
    )
    VALUES
    (
      ${ecole.id}, ${code}, ${nom}, ${description},
      0, 1, ${utilisateur.nom}, NOW(), NOW()
    )
  `;

  revalidatePath("/dashboard/securite/roles");
  redirect("/dashboard/securite/roles?succes=creation");
}
