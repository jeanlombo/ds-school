"use server";

import { exigerPermission } from "@/lib/securite/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import {
  enregistrerLogoEcole,
  supprimerLogoEcole,
} from "@/lib/uploads/logo-ecole";

function texte(
  formData: FormData,
  nom: string
): string | null {
  const valeur = formData.get(nom)?.toString().trim();
  return valeur || null;
}

function fichier(
  formData: FormData,
  nom: string
): File | null {
  const valeur = formData.get(nom);

  if (!(valeur instanceof File) || valeur.size === 0) {
    return null;
  }

  return valeur;
}

export async function enregistrerParametres(
  formData: FormData
) {
  await exigerPermission(
    "PARAMETRES_MODIFIER",
    "app/dashboard/parametres/actions.ts::enregistrerParametres"
  );

  const utilisateur =
    await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const nom = texte(formData, "nom");
  const code = texte(formData, "code");

  if (!nom || !code) {
    redirect("/dashboard/parametres?erreur=champs");
  }

  const logoFichier = fichier(
    formData,
    "logoFichier"
  );
  const doitSupprimerLogo =
    texte(formData, "supprimerLogo") === "1";

  let nouveauLogo = ecole.logo;

  try {
    if (logoFichier) {
      nouveauLogo = await enregistrerLogoEcole({
        ecoleId: ecole.id,
        fichier: logoFichier,
        ancienLogo: ecole.logo,
      });
    } else if (doitSupprimerLogo && ecole.logo) {
      await supprimerLogoEcole(ecole.logo);
      nouveauLogo = null;
    }
  } catch (erreur) {
    const codeErreur =
      erreur instanceof Error
        ? erreur.message
        : "logo_upload";

    const erreursAutorisees = new Set([
      "logo_format",
      "logo_taille",
      "logo_upload",
    ]);

    redirect(
      `/dashboard/parametres?erreur=${
        erreursAutorisees.has(codeErreur)
          ? codeErreur
          : "logo_upload"
      }`
    );
  }

  await prisma.ecole.update({
    where: {
      id: ecole.id,
    },
    data: {
      nom,
      code: code
        .toUpperCase()
        .replace(/\s+/g, "-"),
      slogan: texte(formData, "slogan"),
      logo: nouveauLogo,
      adresse: texte(formData, "adresse"),
      ville: texte(formData, "ville"),
      pays: texte(formData, "pays"),
      telephone: texte(formData, "telephone"),
      email: texte(formData, "email"),
      siteWeb: texte(formData, "siteWeb"),
      devise:
        texte(formData, "devise") || "CDF",
      directeur: texte(formData, "directeur"),
      boitePostale: texte(
        formData,
        "boitePostale"
      ),
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/parametres");

  redirect("/dashboard/parametres?succes=1");
}
