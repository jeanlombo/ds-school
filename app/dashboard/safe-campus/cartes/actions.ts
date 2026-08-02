"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function texte(formData: FormData, nom: string) {
  return String(formData.get(nom) || "").trim();
}

export async function creerCarteRfid(formData: FormData) {
  await exigerPermission("SAFE_CAMPUS_AJOUTER", "app/dashboard/safe-campus/cartes/actions.ts::creerCarteRfid");
  const uid = texte(formData, "uid").toUpperCase();
  const nomProprietaire = texte(formData, "nomProprietaire");
  const proprietaireId = Number(formData.get("proprietaireId"));
  const typeProprietaire = texte(formData, "typeProprietaire");

  if (!uid || !nomProprietaire || !proprietaireId || !typeProprietaire) {
    throw new Error("UID, propriétaire et type obligatoires.");
  }

  await (prisma as any).carteRfid.create({
    data: {
      uid,
      numeroInterne: texte(formData, "numeroInterne") || null,
      typeProprietaire,
      proprietaireId,
      nomProprietaire,
      classeOuFonction: texte(formData, "classeOuFonction") || null,
      photoProprietaire: texte(formData, "photoProprietaire") || null,
      statut: "ACTIVE",
    },
  });

  revalidatePath("/dashboard/safe-campus");
  revalidatePath("/dashboard/safe-campus/cartes");
}

export async function changerStatutCarte(formData: FormData) {
  await exigerPermission("SAFE_CAMPUS_CHANGER_STATUT", "app/dashboard/safe-campus/cartes/actions.ts::changerStatutCarte");
  const id = Number(formData.get("id"));
  const statut = texte(formData, "statut");

  if (!id || !statut) throw new Error("Données invalides.");

  await (prisma as any).carteRfid.update({
    where: { id },
    data: { statut },
  });

  revalidatePath("/dashboard/safe-campus/cartes");
}
