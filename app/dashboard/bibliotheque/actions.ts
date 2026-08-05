"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { exigerPermission } from "@/lib/securite/rbac";
import {
  chaine,
  creerCodeRessource,
  entier,
  nombreNonNegatif,
} from "@/lib/bibliotheque/utilitaires";

export async function ajouterCategorie(formData: FormData) {
  await exigerPermission("BIBLIOTHEQUE_CATEGORIES_GERER");

  const ecole = await obtenirOuCreerEcole();
  const nom = chaine(formData.get("nom"));
  const description = chaine(formData.get("description")) || null;

  if (!nom) {
    redirect("/dashboard/bibliotheque/categories?erreur=nom");
  }

  await prisma.$executeRaw`
    INSERT INTO bibliotheque_categories
    (ecole_id, nom, description, actif, created_at, updated_at)
    VALUES
    (${ecole.id}, ${nom}, ${description}, 1, NOW(), NOW())
  `;

  revalidatePath("/dashboard/bibliotheque/categories");
  redirect("/dashboard/bibliotheque/categories?succes=creation");
}

export async function ajouterAuteur(formData: FormData) {
  await exigerPermission("BIBLIOTHEQUE_AUTEURS_GERER");

  const ecole = await obtenirOuCreerEcole();
  const nom = chaine(formData.get("nom"));
  const prenom = chaine(formData.get("prenom")) || null;
  const biographie = chaine(formData.get("biographie")) || null;

  if (!nom) {
    redirect("/dashboard/bibliotheque/auteurs?erreur=nom");
  }

  await prisma.$executeRaw`
    INSERT INTO bibliotheque_auteurs
    (ecole_id, nom, prenom, biographie, actif, created_at, updated_at)
    VALUES
    (${ecole.id}, ${nom}, ${prenom}, ${biographie}, 1, NOW(), NOW())
  `;

  revalidatePath("/dashboard/bibliotheque/auteurs");
  redirect("/dashboard/bibliotheque/auteurs?succes=creation");
}

export async function ajouterEditeur(formData: FormData) {
  await exigerPermission("BIBLIOTHEQUE_EDITEURS_GERER");

  const ecole = await obtenirOuCreerEcole();
  const nom = chaine(formData.get("nom"));
  const pays = chaine(formData.get("pays")) || null;
  const siteWeb = chaine(formData.get("site_web")) || null;

  if (!nom) {
    redirect("/dashboard/bibliotheque/editeurs?erreur=nom");
  }

  await prisma.$executeRaw`
    INSERT INTO bibliotheque_editeurs
    (ecole_id, nom, pays, site_web, actif, created_at, updated_at)
    VALUES
    (${ecole.id}, ${nom}, ${pays}, ${siteWeb}, 1, NOW(), NOW())
  `;

  revalidatePath("/dashboard/bibliotheque/editeurs");
  redirect("/dashboard/bibliotheque/editeurs?succes=creation");
}

export async function creerRessource(formData: FormData) {
  await exigerPermission("BIBLIOTHEQUE_RESSOURCES_CREER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const titre = chaine(formData.get("titre"));
  const typeRessource = chaine(formData.get("type_ressource"));
  const categorieId = entier(formData.get("categorie_id"));
  const auteurId = entier(formData.get("auteur_id"));
  const editeurId = entier(formData.get("editeur_id"));
  const matiereId = entier(formData.get("matiere_id"));
  const classeId = entier(formData.get("classe_id"));
  const isbn = chaine(formData.get("isbn")) || null;
  const resume = chaine(formData.get("resume")) || null;
  const motsCles = chaine(formData.get("mots_cles")) || null;
  const urlFichier = chaine(formData.get("url_fichier")) || null;
  const urlCouverture = chaine(formData.get("url_couverture")) || null;
  const anneePublication = entier(formData.get("annee_publication"));
  const nombrePages = entier(formData.get("nombre_pages"));
  const nombreExemplaires = nombreNonNegatif(
    formData.get("nombre_exemplaires"),
    typeRessource === "LIVRE_PHYSIQUE" ? 1 : 0
  );

  if (!titre || !typeRessource) {
    redirect("/dashboard/bibliotheque/ressources/nouveau?erreur=champs");
  }

  if (
    typeRessource !== "LIVRE_PHYSIQUE" &&
    !urlFichier
  ) {
    redirect("/dashboard/bibliotheque/ressources/nouveau?erreur=fichier");
  }

  const code = creerCodeRessource();

  await prisma.$executeRaw`
    INSERT INTO bibliotheque_ressources
    (
      ecole_id,
      code_ressource,
      titre,
      type_ressource,
      categorie_id,
      auteur_id,
      editeur_id,
      matiere_id,
      classe_id,
      isbn,
      resume,
      mots_cles,
      url_fichier,
      url_couverture,
      annee_publication,
      nombre_pages,
      nombre_exemplaires,
      exemplaires_disponibles,
      statut,
      cree_par,
      created_at,
      updated_at
    )
    VALUES
    (
      ${ecole.id},
      ${code},
      ${titre},
      ${typeRessource},
      ${categorieId},
      ${auteurId},
      ${editeurId},
      ${matiereId},
      ${classeId},
      ${isbn},
      ${resume},
      ${motsCles},
      ${urlFichier},
      ${urlCouverture},
      ${anneePublication},
      ${nombrePages},
      ${nombreExemplaires},
      ${nombreExemplaires},
      'PUBLIE',
      ${utilisateur.nom},
      NOW(),
      NOW()
    )
  `;

  const lignes = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM bibliotheque_ressources
    WHERE ecole_id = ${ecole.id}
      AND code_ressource = ${code}
    LIMIT 1
  `;

  revalidatePath("/dashboard/bibliotheque");
  revalidatePath("/dashboard/bibliotheque/ressources");

  redirect(
    `/dashboard/bibliotheque/ressources/${lignes[0]?.id ?? ""}?succes=creation`
  );
}

export async function archiverRessource(
  id: number,
  _formData: FormData
) {
  await exigerPermission("BIBLIOTHEQUE_RESSOURCES_MODIFIER");
  const ecole = await obtenirOuCreerEcole();

  await prisma.$executeRaw`
    UPDATE bibliotheque_ressources
    SET statut = 'ARCHIVE', updated_at = NOW()
    WHERE id = ${id}
      AND ecole_id = ${ecole.id}
  `;

  revalidatePath("/dashboard/bibliotheque/ressources");
  redirect("/dashboard/bibliotheque/ressources?succes=archivage");
}
