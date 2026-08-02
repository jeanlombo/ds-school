"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";

function texte(formData: FormData, cle: string) {
  const valeur = formData.get(cle);
  return typeof valeur === "string" ? valeur.trim() : "";
}

function dateOuNull(valeur: string) {
  if (!valeur) return null;
  const date = new Date(`${valeur}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function enregistrerPhoto(formData: FormData, anciennePhoto?: string | null) {
  const supprimer = texte(formData, "supprimerPhoto") === "1";
  const fichier = formData.get("photoFichier");

  if (supprimer && anciennePhoto?.startsWith("/uploads/enseignants/")) {
    await unlink(path.join(process.cwd(), "public", anciennePhoto)).catch(() => undefined);
    return null;
  }

  if (!(fichier instanceof File) || fichier.size === 0) return anciennePhoto || null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(fichier.type)) {
    throw new Error("Format de photo non autorisé.");
  }
  if (fichier.size > 3 * 1024 * 1024) throw new Error("La photo compressée dépasse 3 Mo.");

  const extension = fichier.type === "image/png" ? "png" : fichier.type === "image/webp" ? "webp" : "jpg";
  const nom = `enseignant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const dossier = path.join(process.cwd(), "public", "uploads", "enseignants");
  await mkdir(dossier, { recursive: true });
  await writeFile(path.join(dossier, nom), Buffer.from(await fichier.arrayBuffer()));

  if (anciennePhoto?.startsWith("/uploads/enseignants/")) {
    await unlink(path.join(process.cwd(), "public", anciennePhoto)).catch(() => undefined);
  }
  return `/uploads/enseignants/${nom}`;
}

export async function creerEnseignant(formData: FormData) {
  await exigerPermission("ENSEIGNANTS_AJOUTER", "app/dashboard/enseignants/actions.ts::creerEnseignant");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();

  const nom = texte(formData, "nom");
  const prenom = texte(formData, "prenom");
  const sexe = texte(formData, "sexe");
  if (!nom || !prenom || !["M", "F"].includes(sexe)) {
    redirect("/dashboard/enseignants/nouveau?erreur=Nom, prénom et sexe sont obligatoires");
  }

  const compteur = await prisma.enseignant.count({ where: { ecoleId: ecole.id } });
  const matricule = texte(formData, "matricule") || `ENS-${new Date().getFullYear()}-${String(compteur + 1).padStart(4, "0")}`;
  const doublon = await prisma.enseignant.findFirst({ where: { ecoleId: ecole.id, matricule } });
  if (doublon) redirect("/dashboard/enseignants/nouveau?erreur=Ce matricule existe déjà");

  let photo: string | null = null;
  try { photo = await enregistrerPhoto(formData); }
  catch (erreur) {
    redirect(`/dashboard/enseignants/nouveau?erreur=${encodeURIComponent(erreur instanceof Error ? erreur.message : "Photo invalide")}`);
  }

  const enseignant = await prisma.enseignant.create({
    data: {
      ecoleId: ecole.id,
      matricule,
      nom: nom.toUpperCase(),
      postnom: texte(formData, "postnom") || null,
      prenom,
      sexe,
      dateNaissance: dateOuNull(texte(formData, "dateNaissance")),
      lieuNaissance: texte(formData, "lieuNaissance") || null,
      nationalite: texte(formData, "nationalite") || "Congolaise",
      etatCivil: texte(formData, "etatCivil") || null,
      telephone: texte(formData, "telephone") || null,
      email: texte(formData, "email") || null,
      adresse: texte(formData, "adresse") || null,
      photo,
      fonction: texte(formData, "fonction") || "Enseignant",
      specialite: texte(formData, "specialite") || null,
      grade: texte(formData, "grade") || null,
      dateEngagement: dateOuNull(texte(formData, "dateEngagement")),
      typePiece: texte(formData, "typePiece") || null,
      numeroPiece: texte(formData, "numeroPiece") || null,
      numeroCarteRfid: texte(formData, "numeroCarteRfid") || null,
      historiques: {
        create: { type: "creation", details: "Création du dossier enseignant.", auteur: utilisateur.nom }
      }
    }
  });

  revalidatePath("/dashboard/enseignants");
  redirect(`/dashboard/enseignants/${enseignant.id}?succes=Enseignant enregistré avec succès`);
}

export async function modifierEnseignant(formData: FormData) {
  await exigerPermission("ENSEIGNANTS_MODIFIER", "app/dashboard/enseignants/actions.ts::modifierEnseignant");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const id = Number(texte(formData, "id"));
  const enseignant = await prisma.enseignant.findFirst({ where: { id, ecoleId: ecole.id } });
  if (!enseignant) redirect("/dashboard/enseignants");

  const nom = texte(formData, "nom");
  const prenom = texte(formData, "prenom");
  const sexe = texte(formData, "sexe");
  if (!nom || !prenom || !["M", "F"].includes(sexe)) {
    redirect(`/dashboard/enseignants/${id}/modifier?erreur=Nom, prénom et sexe sont obligatoires`);
  }

  let photo = enseignant.photo;
  try { photo = await enregistrerPhoto(formData, enseignant.photo); }
  catch (erreur) {
    redirect(`/dashboard/enseignants/${id}/modifier?erreur=${encodeURIComponent(erreur instanceof Error ? erreur.message : "Photo invalide")}`);
  }

  await prisma.$transaction([
    prisma.enseignant.update({
      where: { id },
      data: {
        nom: nom.toUpperCase(),
        postnom: texte(formData, "postnom") || null,
        prenom,
        sexe,
        dateNaissance: dateOuNull(texte(formData, "dateNaissance")),
        lieuNaissance: texte(formData, "lieuNaissance") || null,
        nationalite: texte(formData, "nationalite") || null,
        etatCivil: texte(formData, "etatCivil") || null,
        telephone: texte(formData, "telephone") || null,
        email: texte(formData, "email") || null,
        adresse: texte(formData, "adresse") || null,
        photo,
        fonction: texte(formData, "fonction") || "Enseignant",
        specialite: texte(formData, "specialite") || null,
        grade: texte(formData, "grade") || null,
        dateEngagement: dateOuNull(texte(formData, "dateEngagement")),
        typePiece: texte(formData, "typePiece") || null,
        numeroPiece: texte(formData, "numeroPiece") || null,
        numeroCarteRfid: texte(formData, "numeroCarteRfid") || null
      }
    }),
    prisma.historiqueEnseignant.create({
      data: { enseignantId: id, type: "modification", details: "Mise à jour du dossier administratif.", auteur: utilisateur.nom }
    })
  ]);

  revalidatePath("/dashboard/enseignants");
  revalidatePath(`/dashboard/enseignants/${id}`);
  redirect(`/dashboard/enseignants/${id}?succes=Dossier mis à jour`);
}

export async function changerStatutEnseignant(formData: FormData) {
  await exigerPermission("ENSEIGNANTS_CHANGER_STATUT", "app/dashboard/enseignants/actions.ts::changerStatutEnseignant");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const id = Number(texte(formData, "id"));
  const enseignant = await prisma.enseignant.findFirst({ where: { id, ecoleId: ecole.id } });
  if (!enseignant) return;
  const statut = enseignant.statut === "actif" ? "archive" : "actif";

  await prisma.$transaction([
    prisma.enseignant.update({ where: { id }, data: { statut } }),
    prisma.historiqueEnseignant.create({
      data: { enseignantId: id, type: "statut", details: `Statut modifié vers « ${statut} ».`, auteur: utilisateur.nom }
    })
  ]);
  revalidatePath("/dashboard/enseignants");
  revalidatePath(`/dashboard/enseignants/${id}`);
}

export async function ajouterDiplome(formData: FormData) {
  await exigerPermission("ENSEIGNANTS_MODIFIER", "app/dashboard/enseignants/actions.ts::ajouterDiplome");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const enseignantId = Number(texte(formData, "enseignantId"));
  const intitule = texte(formData, "intitule");
  const enseignant = await prisma.enseignant.findFirst({ where: { id: enseignantId, ecoleId: ecole.id } });
  if (!enseignant || !intitule) return;

  await prisma.$transaction([
    prisma.diplomeEnseignant.create({
      data: {
        enseignantId,
        intitule,
        etablissement: texte(formData, "etablissement") || null,
        annee: Number(texte(formData, "annee")) || null
      }
    }),
    prisma.historiqueEnseignant.create({
      data: { enseignantId, type: "diplome", details: `Diplôme ajouté : ${intitule}.`, auteur: utilisateur.nom }
    })
  ]);
  revalidatePath(`/dashboard/enseignants/${enseignantId}`);
}

export async function ajouterContrat(formData: FormData) {
  await exigerPermission("ENSEIGNANTS_MODIFIER", "app/dashboard/enseignants/actions.ts::ajouterContrat");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const enseignantId = Number(texte(formData, "enseignantId"));
  const typeContrat = texte(formData, "typeContrat");
  const dateDebut = dateOuNull(texte(formData, "dateDebut"));
  const enseignant = await prisma.enseignant.findFirst({ where: { id: enseignantId, ecoleId: ecole.id } });
  if (!enseignant || !typeContrat || !dateDebut) return;

  await prisma.$transaction([
    prisma.contratEnseignant.create({
      data: {
        enseignantId,
        typeContrat,
        dateDebut,
        dateFin: dateOuNull(texte(formData, "dateFin")),
        salaire: texte(formData, "salaire") || null,
        devise: texte(formData, "devise") || "CDF"
      }
    }),
    prisma.historiqueEnseignant.create({
      data: { enseignantId, type: "contrat", details: `Nouveau contrat : ${typeContrat}.`, auteur: utilisateur.nom }
    })
  ]);
  revalidatePath(`/dashboard/enseignants/${enseignantId}`);
}

export async function ajouterAffectation(formData: FormData) {
  await exigerPermission("ENSEIGNANTS_MODIFIER", "app/dashboard/enseignants/actions.ts::ajouterAffectation");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const enseignantId = Number(texte(formData, "enseignantId"));
  const matiere = texte(formData, "matiere");
  const classeId = Number(texte(formData, "classeId")) || null;
  const enseignant = await prisma.enseignant.findFirst({ where: { id: enseignantId, ecoleId: ecole.id } });
  if (!enseignant || !matiere) return;

  if (classeId) {
    const classe = await prisma.classe.findFirst({ where: { id: classeId, ecoleId: ecole.id } });
    if (!classe) return;
  }

  await prisma.$transaction([
    prisma.affectationEnseignant.create({
      data: {
        enseignantId,
        matiere,
        classeId,
        volumeHoraire: Number(texte(formData, "volumeHoraire")) || null,
        anneeLibelle: texte(formData, "anneeLibelle") || null
      }
    }),
    prisma.historiqueEnseignant.create({
      data: { enseignantId, type: "affectation", details: `Affectation ajoutée : ${matiere}.`, auteur: utilisateur.nom }
    })
  ]);
  revalidatePath(`/dashboard/enseignants/${enseignantId}`);
}
