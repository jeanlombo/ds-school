"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";

function nombre(formData: FormData, cle: string): number | null {
  const valeur = Number(formData.get(cle));
  return Number.isFinite(valeur) && valeur > 0 ? Math.trunc(valeur) : null;
}

function texte(formData: FormData, cle: string): string | null {
  const valeur = String(formData.get(cle) ?? "").trim();
  return valeur || null;
}

export async function enregistrerPermissionUtilisateur(
  utilisateurId: number,
  formData: FormData
) {
  await exigerPermission("SECURITE_MODIFIER", "app/dashboard/securite/utilisateurs/[id]/permissions/actions.ts::enregistrerPermissionUtilisateur");
  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  const permissionId = Number(formData.get("permission_id"));
  const decision = String(formData.get("decision") ?? "AUTORISER");
  const dateDebut = texte(formData, "date_debut");
  const dateFin = texte(formData, "date_fin");
  const ecoleId = nombre(formData, "ecole_id");
  const anneeScolaireId = nombre(formData, "annee_scolaire_id");
  const sectionId = nombre(formData, "section_id");
  const classeId = nombre(formData, "classe_id");
  const matiereId = nombre(formData, "matiere_id");
  const eleveId = nombre(formData, "eleve_id");
  const devise = texte(formData, "devise");

  await prisma.$executeRaw`
    INSERT INTO utilisateurs_permissions_securite
    (
      utilisateur_id,
      permission_id,
      decision,
      date_debut,
      date_fin,
      ecole_id,
      annee_scolaire_id,
      section_id,
      classe_id,
      matiere_id,
      eleve_id,
      devise,
      actif,
      cree_par,
      created_at,
      updated_at
    )
    VALUES
    (
      ${utilisateurId},
      ${permissionId},
      ${decision},
      ${dateDebut},
      ${dateFin},
      ${ecoleId},
      ${anneeScolaireId},
      ${sectionId},
      ${classeId},
      ${matiereId},
      ${eleveId},
      ${devise},
      1,
      ${administrateur.nom},
      NOW(),
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      decision = VALUES(decision),
      date_debut = VALUES(date_debut),
      date_fin = VALUES(date_fin),
      ecole_id = VALUES(ecole_id),
      annee_scolaire_id = VALUES(annee_scolaire_id),
      section_id = VALUES(section_id),
      classe_id = VALUES(classe_id),
      matiere_id = VALUES(matiere_id),
      eleve_id = VALUES(eleve_id),
      devise = VALUES(devise),
      actif = 1,
      updated_at = NOW()
  `;

  await prisma.$executeRaw`
    INSERT INTO journal_audit_securite
    (
      utilisateur_nom,
      action,
      module,
      description,
      niveau,
      created_at
    )
    VALUES
    (
      ${administrateur.nom},
      'PERMISSION_UTILISATEUR',
      'RBAC',
      ${`Permission ${permissionId} ${decision} pour utilisateur ${utilisateurId}`},
      'CRITIQUE',
      NOW()
    )
  `;

  revalidatePath(
    `/dashboard/securite/utilisateurs/${utilisateurId}/permissions`
  );
}

export async function supprimerPermissionUtilisateur(
  utilisateurId: number,
  permissionUtilisateurId: number
) {
  await exigerPermission("SECURITE_SUPPRIMER", "app/dashboard/securite/utilisateurs/[id]/permissions/actions.ts::supprimerPermissionUtilisateur");
  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  await prisma.$executeRaw`
    DELETE FROM utilisateurs_permissions_securite
    WHERE id = ${permissionUtilisateurId}
      AND utilisateur_id = ${utilisateurId}
  `;

  revalidatePath(
    `/dashboard/securite/utilisateurs/${utilisateurId}/permissions`
  );
}
