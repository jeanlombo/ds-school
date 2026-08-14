"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";

function texte(formData: FormData, nom: string) {
  const valeur = formData.get(nom)?.toString().trim();
  return valeur || null;
}

export async function enregistrerParametres(formData: FormData) {
  await exigerPermission("PARAMETRES_MODIFIER", "app/dashboard/parametres/actions.ts::enregistrerParametres");
  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const nom = texte(formData, "nom");
  const code = texte(formData, "code");
  if (!nom || !code) redirect("/dashboard/parametres?erreur=champs");

  await prisma.ecole.update({
    where: { id: ecole.id },
    data: {
      nom,
      code: code.toUpperCase().replace(/\s+/g, "-"),
      slogan: texte(formData, "slogan"),
      logo: texte(formData, "logo"),
      adresse: texte(formData, "adresse"),
      ville: texte(formData, "ville"),
      pays: texte(formData, "pays"),
      telephone: texte(formData, "telephone"),
      email: texte(formData, "email"),
      siteWeb: texte(formData, "siteWeb"),
      devise: texte(formData, "devise") || "CDF",
      directeur: texte(formData, "directeur"),
      boitePostale: texte(formData, "boitePostale"),
      typeEtablissement: texte(formData, "typeEtablissement") || "MIXTE",
      terminologieApprenant: texte(formData, "terminologieApprenant") || "AUTOMATIQUE",
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/parametres");
  redirect("/dashboard/parametres?succes=1");
}
