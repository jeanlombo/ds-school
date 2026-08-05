"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import { creerEvenementParent } from "@/lib/suivi-parent";

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "").trim();
}

function entier(formData: FormData, cle: string): number {
  const valeur = Number(formData.get(cle));
  return Number.isInteger(valeur) ? valeur : 0;
}

function dateOuNull(valeur: string): Date | null {
  if (!valeur) return null;
  const date = new Date(`${valeur}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function creerAlerteParent(
  formData: FormData
) {
  await exigerPermission(
    "SUIVI_PARENT_CREER",
    "Création d'une information destinée au parent"
  );

  const utilisateur =
    await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const eleveId = entier(formData, "eleve_id");
  const typeEvenement = texte(
    formData,
    "type_evenement"
  );
  const titre = texte(formData, "titre");
  const description = texte(
    formData,
    "description"
  );

  if (
    eleveId <= 0 ||
    !typeEvenement ||
    !titre ||
    !description
  ) {
    redirect(
      "/dashboard/suivi-parent/nouveau?erreur=champs"
    );
  }

  const montantTexte = texte(
    formData,
    "montant"
  );
  const montant = montantTexte
    ? Number(montantTexte)
    : null;

  const id = await creerEvenementParent({
    ecoleId: ecole.id,
    eleveId,
    typeEvenement:
      typeEvenement as Parameters<
        typeof creerEvenementParent
      >[0]["typeEvenement"],
    titre,
    description,
    niveau:
      (texte(formData, "niveau") ||
        "IMPORTANT") as Parameters<
        typeof creerEvenementParent
      >[0]["niveau"],
    montant:
      montant !== null &&
      Number.isFinite(montant)
        ? montant
        : null,
    devise:
      texte(formData, "devise") || null,
    dateEvenement:
      dateOuNull(
        texte(formData, "date_evenement")
      ) ?? new Date(),
    dateEcheance: dateOuNull(
      texte(formData, "date_echeance")
    ),
    lieu: texte(formData, "lieu") || null,
    reponseRequise:
      formData.get("reponse_requise") === "1",
    creePar: utilisateur.nom,
    referenceModule: "SUIVI_PARENT",
  });

  revalidatePath("/dashboard/suivi-parent");
  revalidatePath("/dashboard/parent");
  redirect(
    `/dashboard/suivi-parent/${id}?succes=creation`
  );
}

export async function changerStatutEvenement(
  id: number,
  formData: FormData
) {
  await exigerPermission(
    "SUIVI_PARENT_MODIFIER",
    "Modification du suivi parent"
  );

  const ecole = await obtenirOuCreerEcole();
  const statut = texte(formData, "statut");

  const statutsAutorises = new Set([
    "NOUVEAU",
    "EN_ATTENTE_REPONSE",
    "CONFIRME",
    "JUSTIFIE",
    "REJETE",
    "TRAITE",
    "CLOTURE",
    "ANNULE",
  ]);

  if (!statutsAutorises.has(statut)) {
    redirect(
      `/dashboard/suivi-parent/${id}?erreur=statut`
    );
  }

  await prisma.$executeRaw`
    UPDATE suivi_parent_evenements
    SET
      statut = ${statut},
      updated_at = NOW()
    WHERE id = ${id}
      AND ecole_id = ${ecole.id}
  `;

  revalidatePath(
    `/dashboard/suivi-parent/${id}`
  );
  revalidatePath("/dashboard/suivi-parent");
  redirect(
    `/dashboard/suivi-parent/${id}?succes=statut`
  );
}
