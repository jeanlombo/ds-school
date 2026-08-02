"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

function texte(formData: FormData, cle: string) {
  const valeur = formData.get(cle);
  return typeof valeur === "string" ? valeur.trim() : "";
}

function dateValide(valeur: string) {
  const date = new Date(`${valeur}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const TYPES_PHOTO = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const TAILLE_MAX_PHOTO = 3 * 1024 * 1024;

async function enregistrerPhotoEleve(formData: FormData) {
  const valeur = formData.get("photoFichier");

  if (!(valeur instanceof File) || valeur.size === 0) {
    return null;
  }

  if (!TYPES_PHOTO.has(valeur.type)) {
    throw new Error("Format de photo non autorisé");
  }

  if (valeur.size > TAILLE_MAX_PHOTO) {
    throw new Error("La photo traitée dépasse 3 Mo");
  }

  const extension =
    valeur.type === "image/png"
      ? "png"
      : valeur.type === "image/webp"
        ? "webp"
        : "jpg";

  const nomFichier = `${Date.now()}-${randomUUID()}.${extension}`;
  const dossier = path.join(
    process.cwd(),
    "public",
    "uploads",
    "eleves"
  );

  await mkdir(dossier, { recursive: true });

  await writeFile(
    path.join(dossier, nomFichier),
    Buffer.from(await valeur.arrayBuffer())
  );

  return `/uploads/eleves/${nomFichier}`;
}

async function supprimerPhotoLocale(photo?: string | null) {
  if (!photo || !photo.startsWith("/uploads/eleves/")) return;

  const nom = path.basename(photo);

  try {
    await unlink(
      path.join(
        process.cwd(),
        "public",
        "uploads",
        "eleves",
        nom
      )
    );
  } catch {}
}

export async function creerEleve(formData: FormData) {
  await exigerPermission("ELEVES_AJOUTER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const nom = texte(formData, "nom");
  const prenom = texte(formData, "prenom");
  const sexe = texte(formData, "sexe");
  const dateNaissance = dateValide(
    texte(formData, "dateNaissance")
  );
  const classeId = Number(texte(formData, "classeId"));
  const anneeScolaireId = Number(
    texte(formData, "anneeScolaireId")
  );

  if (
    !nom ||
    !prenom ||
    !["M", "F"].includes(sexe) ||
    !dateNaissance ||
    !classeId ||
    !anneeScolaireId
  ) {
    redirect(
      "/dashboard/eleves/nouveau?erreur=Champs obligatoires incomplets"
    );
  }

  const [classe, annee] = await Promise.all([
    prisma.classe.findFirst({
      where: {
        id: classeId,
        ecoleId: ecole.id,
        statut: "active",
      },
    }),
    prisma.anneeScolaire.findFirst({
      where: {
        id: anneeScolaireId,
        ecoleId: ecole.id,
      },
    }),
  ]);

  if (!classe || !annee) {
    redirect(
      "/dashboard/eleves/nouveau?erreur=Classe ou année scolaire invalide"
    );
  }

  const compteur = await prisma.eleve.count({
    where: { ecoleId: ecole.id },
  });

  const matricule =
    texte(formData, "matricule") ||
    `${ecole.code}-${new Date().getFullYear()}-${String(
      compteur + 1
    ).padStart(5, "0")}`;

  const doublon = await prisma.eleve.findFirst({
    where: {
      ecoleId: ecole.id,
      matricule,
    },
  });

  if (doublon) {
    redirect(
      "/dashboard/eleves/nouveau?erreur=Ce matricule existe déjà"
    );
  }

  let photo: string | null = null;

  try {
    photo = await enregistrerPhotoEleve(formData);
  } catch {
    redirect(
      "/dashboard/eleves/nouveau?erreur=La photo est invalide ou trop volumineuse"
    );
  }

  const eleve = await prisma.eleve.create({
    data: {
      ecoleId: ecole.id,
      matricule,
      nom: nom.toUpperCase(),
      postnom: texte(formData, "postnom") || null,
      prenom,
      sexe,
      dateNaissance,
      lieuNaissance:
        texte(formData, "lieuNaissance") || null,
      nationalite:
        texte(formData, "nationalite") || "Congolaise",
      adresse: texte(formData, "adresse") || null,
      photo,
      numeroPermanent:
        texte(formData, "numeroPermanent") || null,
      groupeSanguin:
        texte(formData, "groupeSanguin") || null,
      allergies: texte(formData, "allergies") || null,
      handicap: texte(formData, "handicap") || null,
      contactUrgence:
        texte(formData, "contactUrgence") || null,
      telephoneUrgence:
        texte(formData, "telephoneUrgence") || null,
      inscriptions: {
        create: {
          classeId,
          anneeScolaireId,
          dateInscription:
            dateValide(texte(formData, "dateInscription")) ||
            new Date(),
          typeAdmission:
            texte(formData, "typeAdmission") || "nouveau",
          ancienneEcole:
            texte(formData, "ancienneEcole") || null,
        },
      },
      historiques: {
        create: {
          type: "creation",
          details: `Création du dossier et inscription en classe ID ${classeId}.`,
          auteur: utilisateur.nom,
        },
      },
    },
  });

  const responsables = ["pere", "mere", "tuteur"]
    .map((type) => ({
      type,
      nom: texte(formData, `${type}Nom`),
      telephone:
        texte(formData, `${type}Telephone`) || null,
      email: texte(formData, `${type}Email`) || null,
      profession:
        texte(formData, `${type}Profession`) || null,
      adresse:
        texte(formData, `${type}Adresse`) || null,
      principal:
        texte(formData, "responsablePrincipal") === type,
    }))
    .filter((responsable) => responsable.nom);

  if (responsables.length) {
    await prisma.responsableEleve.createMany({
      data: responsables.map((responsable) => ({
        ...responsable,
        ecoleId: ecole.id,
        eleveId: eleve.id,
      })),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eleves");

  redirect(
    `/dashboard/eleves/${eleve.id}?succes=Élève enregistré avec succès`
  );
}

export async function modifierEleve(formData: FormData) {
  await exigerPermission("ELEVES_MODIFIER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const id = Number(texte(formData, "id"));

  const eleve = await prisma.eleve.findFirst({
    where: { id, ecoleId: ecole.id },
  });

  if (!eleve) redirect("/dashboard/eleves");

  const nom = texte(formData, "nom");
  const prenom = texte(formData, "prenom");
  const sexe = texte(formData, "sexe");
  const dateNaissance = dateValide(
    texte(formData, "dateNaissance")
  );

  if (
    !nom ||
    !prenom ||
    !dateNaissance ||
    !["M", "F"].includes(sexe)
  ) {
    redirect(
      `/dashboard/eleves/${id}/modifier?erreur=Champs obligatoires incomplets`
    );
  }

  const retirerPhoto =
    texte(formData, "supprimerPhoto") === "1";

  let nouvellePhoto: string | null = null;

  try {
    nouvellePhoto = await enregistrerPhotoEleve(formData);
  } catch {
    redirect(
      `/dashboard/eleves/${id}/modifier?erreur=La photo est invalide ou trop volumineuse`
    );
  }

  const photoFinale =
    nouvellePhoto || (retirerPhoto ? null : eleve.photo);

  await prisma.$transaction([
    prisma.eleve.update({
      where: { id },
      data: {
        nom: nom.toUpperCase(),
        postnom: texte(formData, "postnom") || null,
        prenom,
        sexe,
        dateNaissance,
        lieuNaissance:
          texte(formData, "lieuNaissance") || null,
        nationalite:
          texte(formData, "nationalite") || null,
        adresse: texte(formData, "adresse") || null,
        photo: photoFinale,
        numeroPermanent:
          texte(formData, "numeroPermanent") || null,
        groupeSanguin:
          texte(formData, "groupeSanguin") || null,
        allergies:
          texte(formData, "allergies") || null,
        handicap:
          texte(formData, "handicap") || null,
        contactUrgence:
          texte(formData, "contactUrgence") || null,
        telephoneUrgence:
          texte(formData, "telephoneUrgence") || null,
      },
    }),
    prisma.historiqueEleve.create({
      data: {
        eleveId: id,
        type: "modification",
        details:
          "Mise à jour des informations personnelles et médicales.",
        auteur: utilisateur.nom,
      },
    }),
  ]);

  if (
    (nouvellePhoto || retirerPhoto) &&
    eleve.photo &&
    eleve.photo !== photoFinale
  ) {
    await supprimerPhotoLocale(eleve.photo);
  }

  revalidatePath(`/dashboard/eleves/${id}`);
  revalidatePath(`/dashboard/eleves/${id}/carte`);
  revalidatePath("/dashboard/eleves");

  redirect(
    `/dashboard/eleves/${id}?succes=Dossier mis à jour avec succès`
  );
}

export async function changerStatutEleve(
  formData: FormData
) {
  await exigerPermission("ELEVES_CHANGER_STATUT");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const id = Number(texte(formData, "id"));
  const statut =
    texte(formData, "statut") === "actif"
      ? "archive"
      : "actif";

  const eleve = await prisma.eleve.findFirst({
    where: { id, ecoleId: ecole.id },
  });

  if (!eleve) return;

  await prisma.$transaction([
    prisma.eleve.update({
      where: { id },
      data: { statut },
    }),
    prisma.historiqueEleve.create({
      data: {
        eleveId: id,
        type: "statut",
        details: `Statut modifié vers « ${statut} ».`,
        auteur: utilisateur.nom,
      },
    }),
  ]);

  revalidatePath("/dashboard/eleves");
  revalidatePath(`/dashboard/eleves/${id}`);
}

export async function ajouterObservation(
  formData: FormData
) {
  await exigerPermission("ELEVES_OBSERVATIONS_AJOUTER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const eleveId = Number(texte(formData, "eleveId"));
  const contenu = texte(formData, "contenu");

  const eleve = await prisma.eleve.findFirst({
    where: {
      id: eleveId,
      ecoleId: ecole.id,
    },
  });

  if (eleve && contenu) {
    await prisma.$transaction([
      prisma.observationEleve.create({
        data: {
          eleveId,
          contenu,
          auteur: utilisateur.nom,
        },
      }),
      prisma.historiqueEleve.create({
        data: {
          eleveId,
          type: "observation",
          details:
            "Nouvelle observation ajoutée au dossier.",
          auteur: utilisateur.nom,
        },
      }),
    ]);
  }

  revalidatePath(`/dashboard/eleves/${eleveId}`);
}
