"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { verifierQuota } from "@/lib/licence";
import { exigerPermission } from "@/lib/securite/rbac";
import { terminologieSection } from "@/lib/terminologie-academique";
import {
  enregistrerPhotoEleve,
  supprimerPhotoEleve,
} from "@/lib/uploads/photo-eleve";

function texte(formData: FormData, cle: string) {
  const valeur = formData.get(cle);
  return typeof valeur === "string" ? valeur.trim() : "";
}

function dateValide(valeur: string) {
  const date = new Date(`${valeur}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}


export async function creerEleve(formData: FormData) {
  await exigerPermission("ELEVES_AJOUTER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const quota = await verifierQuota(ecole.id, "eleves");
  if (!quota.autorise) {
    redirect(`/dashboard/eleves/nouveau?erreur=${encodeURIComponent(quota.message || "Limite de licence atteinte")}`);
  }

  const modeAcademique = texte(formData, "modeAcademique") === "superieur" ? "superieur" : "scolaire";
  const nom = texte(formData, "nom");
  const prenom = texte(formData, "prenom");
  const sexe = texte(formData, "sexe");
  const dateNaissance = dateValide(texte(formData, "dateNaissance"));
  const anneeScolaireId = Number(texte(formData, "anneeScolaireId"));
  const classeId = Number(texte(formData, "classeId"));
  const promotionId = Number(texte(formData, "promotionId"));

  if (!nom || !prenom || !["M", "F"].includes(sexe) || !dateNaissance || !anneeScolaireId) {
    redirect("/dashboard/eleves/nouveau?erreur=Champs obligatoires incomplets");
  }
  if (modeAcademique === "scolaire" && !classeId) {
    redirect("/dashboard/eleves/nouveau?erreur=Veuillez sélectionner une classe");
  }
  if (modeAcademique === "superieur" && !promotionId) {
    redirect("/dashboard/eleves/nouveau?erreur=Veuillez sélectionner une promotion universitaire");
  }

  const annee = await prisma.anneeScolaire.findFirst({
    where: { id: anneeScolaireId, ecoleId: ecole.id },
  });
  if (!annee) redirect("/dashboard/eleves/nouveau?erreur=Année scolaire / académique invalide");

  const classe = modeAcademique === "scolaire"
    ? await prisma.classe.findFirst({
        where: { id: classeId, ecoleId: ecole.id, statut: "active" },
        include: { section: true },
      })
    : null;

  const promotion = modeAcademique === "superieur"
    ? await prisma.promotionUniversitaire.findFirst({
        where: { id: promotionId, ecoleId: ecole.id, statut: "active" },
        include: { departement: { include: { faculte: true } }, cycle: true },
      })
    : null;

  if (modeAcademique === "scolaire" && !classe) {
    redirect("/dashboard/eleves/nouveau?erreur=Classe invalide");
  }
  if (modeAcademique === "superieur" && !promotion) {
    redirect("/dashboard/eleves/nouveau?erreur=Promotion universitaire invalide");
  }

  const compteur = await prisma.eleve.count({ where: { ecoleId: ecole.id } });
  const matricule = texte(formData, "matricule") ||
    `${ecole.code}-${new Date().getFullYear()}-${String(compteur + 1).padStart(5, "0")}`;

  if (await prisma.eleve.findFirst({ where: { ecoleId: ecole.id, matricule } })) {
    redirect("/dashboard/eleves/nouveau?erreur=Ce matricule existe déjà");
  }

  let photo: string | null = null;
  try {
    photo = await enregistrerPhotoEleve({
      eleveId: compteur + 1,
      fichier: formData.get("photoFichier"),
      anciennePhoto: null,
    });
  } catch {
    redirect("/dashboard/eleves/nouveau?erreur=La photo est invalide ou trop volumineuse");
  }

  const dateInscription = dateValide(texte(formData, "dateInscription")) || new Date();

  const eleve = await prisma.eleve.create({
    data: {
      ecoleId: ecole.id,
      matricule,
      nom: nom.toUpperCase(),
      postnom: texte(formData, "postnom") || null,
      prenom,
      sexe,
      dateNaissance,
      lieuNaissance: texte(formData, "lieuNaissance") || null,
      nationalite: texte(formData, "nationalite") || "Congolaise",
      adresse: texte(formData, "adresse") || null,
      photo,
      numeroPermanent: texte(formData, "numeroPermanent") || null,
      groupeSanguin: texte(formData, "groupeSanguin") || null,
      allergies: texte(formData, "allergies") || null,
      handicap: texte(formData, "handicap") || null,
      contactUrgence: texte(formData, "contactUrgence") || null,
      telephoneUrgence: texte(formData, "telephoneUrgence") || null,
      ...(modeAcademique === "scolaire" && classe ? {
        inscriptions: {
          create: {
            classeId: classe.id,
            anneeScolaireId,
            dateInscription,
            typeAdmission: texte(formData, "typeAdmission") || "nouveau",
            ancienneEcole: texte(formData, "ancienneEcole") || null,
          },
        },
      } : {}),
      ...(modeAcademique === "superieur" && promotion ? {
        inscriptionsUniversitaires: {
          create: {
            promotionId: promotion.id,
            anneeScolaireId,
            dateInscription,
            statut: "inscrit",
          },
        },
      } : {}),
      historiques: {
        create: {
          type: "creation",
          details: modeAcademique === "superieur"
            ? `Création du dossier étudiant et inscription en promotion ${promotion?.nom}.`
            : `Création du dossier élève et inscription en classe ${classe?.nom}.`,
          auteur: utilisateur.nom,
        },
      },
    },
  });

  const responsables = ["pere", "mere", "tuteur"].map((type) => ({
    type,
    nom: texte(formData, `${type}Nom`),
    telephone: texte(formData, `${type}Telephone`) || null,
    email: texte(formData, `${type}Email`) || null,
    profession: texte(formData, `${type}Profession`) || null,
    adresse: texte(formData, `${type}Adresse`) || null,
    principal: texte(formData, "responsablePrincipal") === type,
  })).filter((r) => r.nom);

  if (responsables.length) {
    await prisma.responsableEleve.createMany({
      data: responsables.map((r) => ({ ...r, ecoleId: ecole.id, eleveId: eleve.id })),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eleves");
  revalidatePath("/dashboard/universite");

  const libelle = modeAcademique === "superieur" ? "Étudiant" : "Élève";
  redirect(`/dashboard/eleves/${eleve.id}?succes=${encodeURIComponent(`${libelle} enregistré(e) avec succès`)}`);
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
    nouvellePhoto = await enregistrerPhotoEleve({
      eleveId: id,
      fichier: formData.get("photoFichier"),
      anciennePhoto: eleve.photo,
    });
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
    retirerPhoto &&
    !nouvellePhoto &&
    eleve.photo
  ) {
    await supprimerPhotoEleve(eleve.photo);
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