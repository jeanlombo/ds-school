"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";

function entier(formData: FormData, cle: string): number | null {
  const valeur = Number(formData.get(cle));
  return Number.isFinite(valeur) && valeur > 0 ? Math.trunc(valeur) : null;
}

function texte(formData: FormData, cle: string): string | null {
  const valeur = String(formData.get(cle) ?? "").trim();
  return valeur || null;
}

export async function creerAffectation(formData: FormData) {
  await exigerPermission("SECURITE_MODIFIER", "app/dashboard/securite/affectations/actions.ts::creerAffectation");
  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  const utilisateurId = entier(formData, "utilisateur_id");
  const anneeScolaireId = entier(formData, "annee_scolaire_id");
  const classeId = entier(formData, "classe_id");
  const matiereId = entier(formData, "matiere_id");
  const fonction = texte(formData, "fonction");
  const dateDebut = texte(formData, "date_debut");
  const dateFin = texte(formData, "date_fin");
  const principal = formData.get("principal") === "on" ? 1 : 0;

  if (!utilisateurId || !anneeScolaireId || !classeId || !fonction) {
    redirect("/dashboard/securite/affectations?erreur=champs");
  }

  if (principal && fonction === "TITULAIRE_PRINCIPAL") {
    await prisma.$executeRaw`
      UPDATE affectations_utilisateurs_classes
      SET principal = 0
      WHERE annee_scolaire_id = ${anneeScolaireId}
        AND classe_id = ${classeId}
        AND fonction = 'TITULAIRE_PRINCIPAL'
        AND statut = 'ACTIVE'
    `;
  }

  await prisma.$executeRaw`
    INSERT INTO affectations_utilisateurs_classes
    (
      utilisateur_id,
      annee_scolaire_id,
      classe_id,
      matiere_id,
      fonction,
      principal,
      date_debut,
      date_fin,
      statut,
      cree_par,
      created_at,
      updated_at
    )
    VALUES
    (
      ${utilisateurId},
      ${anneeScolaireId},
      ${classeId},
      ${matiereId},
      ${fonction},
      ${principal},
      ${dateDebut},
      ${dateFin},
      'ACTIVE',
      ${administrateur.nom},
      NOW(),
      NOW()
    )
  `;

  revalidatePath("/dashboard/securite/affectations");
  redirect("/dashboard/securite/affectations?succes=creation");
}
