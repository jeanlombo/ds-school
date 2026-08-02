"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { Prisma, StatutMatiere } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "").trim();
}

function nombre(formData: FormData, cle: string, valeurParDefaut = 0): number {
  const valeur = Number(formData.get(cle));
  return Number.isFinite(valeur) ? valeur : valeurParDefaut;
}

function normaliserCode(code: string): string {
  return code
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase();
}

async function genererCode(nom: string): Promise<string> {
  const prefixe =
    normaliserCode(nom)
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3)
      .padEnd(3, "X") || "MAT";

  const total = await prisma.matiere.count({
    where: { code: { startsWith: prefixe } },
  });

  let sequence = total + 1;
  let code = `${prefixe}${String(sequence).padStart(3, "0")}`;

  while (await prisma.matiere.findUnique({ where: { code } })) {
    sequence += 1;
    code = `${prefixe}${String(sequence).padStart(3, "0")}`;
  }

  return code;
}

function verifierDonnees(formData: FormData) {
  const nom = texte(formData, "nom");
  const coefficient = nombre(formData, "coefficient", 1);
  const volumeHoraireHebdomadaire = Math.trunc(
    nombre(formData, "volumeHoraireHebdomadaire", 1)
  );

  if (nom.length < 2) {
    throw new Error("Le nom de la matière doit contenir au moins 2 caractères.");
  }

  if (coefficient <= 0 || coefficient > 100) {
    throw new Error("Le coefficient doit être compris entre 0,01 et 100.");
  }

  if (volumeHoraireHebdomadaire < 1 || volumeHoraireHebdomadaire > 60) {
    throw new Error("Le volume horaire doit être compris entre 1 et 60 heures.");
  }

  return {
    nom,
    coefficient,
    volumeHoraireHebdomadaire,
  };
}

export async function creerMatiere(formData: FormData) {
  await exigerPermission("MATIERES_AJOUTER", "app/dashboard/matieres/actions.ts::creerMatiere");
  const { nom, coefficient, volumeHoraireHebdomadaire } =
    verifierDonnees(formData);

  const codeSaisi = normaliserCode(texte(formData, "code"));
  const code = codeSaisi || (await genererCode(nom));

  const couleur = texte(formData, "couleur") || "#2563EB";
  const statut =
    texte(formData, "statut") === "INACTIF"
      ? StatutMatiere.INACTIF
      : StatutMatiere.ACTIF;

  try {
    await prisma.matiere.create({
      data: {
        code,
        nom,
        description: texte(formData, "description") || null,
        departement: texte(formData, "departement") || null,
        coefficient: new Prisma.Decimal(coefficient),
        volumeHoraireHebdomadaire,
        couleur,
        statut,
      },
    });
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      throw new Error("Ce code de matière existe déjà.");
    }
    throw erreur;
  }

  revalidatePath("/dashboard/matieres");
  redirect("/dashboard/matieres?succes=creation");
}

export async function modifierMatiere(id: number, formData: FormData) {
  await exigerPermission("MATIERES_MODIFIER", "app/dashboard/matieres/actions.ts::modifierMatiere");
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Identifiant de matière invalide.");
  }

  const { nom, coefficient, volumeHoraireHebdomadaire } =
    verifierDonnees(formData);

  const code = normaliserCode(texte(formData, "code"));
  if (!code) {
    throw new Error("Le code de la matière est obligatoire.");
  }

  const statut =
    texte(formData, "statut") === "INACTIF"
      ? StatutMatiere.INACTIF
      : StatutMatiere.ACTIF;

  try {
    await prisma.matiere.update({
      where: { id },
      data: {
        code,
        nom,
        description: texte(formData, "description") || null,
        departement: texte(formData, "departement") || null,
        coefficient: new Prisma.Decimal(coefficient),
        volumeHoraireHebdomadaire,
        couleur: texte(formData, "couleur") || "#2563EB",
        statut,
      },
    });
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      throw new Error("Ce code de matière est déjà utilisé.");
    }
    throw erreur;
  }

  revalidatePath("/dashboard/matieres");
  redirect("/dashboard/matieres?succes=modification");
}

export async function supprimerMatiere(formData: FormData) {
  await exigerPermission("MATIERES_SUPPRIMER", "app/dashboard/matieres/actions.ts::supprimerMatiere");
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Identifiant de matière invalide.");
  }

  try {
    await prisma.matiere.delete({ where: { id } });
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2003"
    ) {
      throw new Error(
        "Cette matière est déjà utilisée dans un autre module et ne peut pas être supprimée."
      );
    }
    throw erreur;
  }

  revalidatePath("/dashboard/matieres");
}
