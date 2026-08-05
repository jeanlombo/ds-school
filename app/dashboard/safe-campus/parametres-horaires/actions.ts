"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerPermission } from "@/lib/securite/rbac";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";

function texte(
  formData: FormData,
  nom: string
) {
  return (
    formData.get(nom)?.toString().trim() || ""
  );
}

function entier(
  formData: FormData,
  nom: string
) {
  return Number(
    formData.get(nom)?.toString() || 0
  );
}

export async function creerPlageHoraire(
  formData: FormData
) {
  await exigerPermission(
    "SAFE_CAMPUS_VOIR",
    "Configuration plages horaires Safe Campus"
  );

  const ecole = await obtenirOuCreerEcole();

  const nom = texte(formData, "nom");
  const typePassage = texte(
    formData,
    "type_passage"
  );
  const heureDebut = texte(
    formData,
    "heure_debut"
  );
  const heureFin = texte(
    formData,
    "heure_fin"
  );
  const jours = formData
    .getAll("jours")
    .map(String)
    .join(",");
  const classeId = entier(
    formData,
    "classe_id"
  );
  const tolerance = Math.max(
    entier(
      formData,
      "tolerance_doublon_secondes"
    ) || 120,
    10
  );
  const fuseau =
    texte(formData, "fuseau_horaire") ||
    "Africa/Kinshasa";

  if (
    !nom ||
    !["ENTREE", "SORTIE"].includes(
      typePassage
    ) ||
    !heureDebut ||
    !heureFin ||
    !jours
  ) {
    redirect(
      "/dashboard/safe-campus/parametres-horaires?erreur=champs"
    );
  }

  await prisma.$executeRaw`
    INSERT INTO safe_campus_plages_horaires
    (
      ecole_id,
      nom,
      type_passage,
      heure_debut,
      heure_fin,
      jours_semaine,
      classe_id,
      tolerance_doublon_secondes,
      fuseau_horaire,
      actif,
      created_at,
      updated_at
    )
    VALUES
    (
      ${ecole.id},
      ${nom},
      ${typePassage},
      ${heureDebut},
      ${heureFin},
      ${jours},
      ${classeId > 0 ? classeId : null},
      ${tolerance},
      ${fuseau},
      1,
      NOW(),
      NOW()
    )
  `;

  revalidatePath(
    "/dashboard/safe-campus/parametres-horaires"
  );

  redirect(
    "/dashboard/safe-campus/parametres-horaires?succes=creation"
  );
}

export async function basculerPlageHoraire(
  formData: FormData
) {
  await exigerPermission(
    "SAFE_CAMPUS_VOIR",
    "Activation plage horaire Safe Campus"
  );

  const ecole = await obtenirOuCreerEcole();
  const id = entier(formData, "id");

  if (id > 0) {
    await prisma.$executeRaw`
      UPDATE safe_campus_plages_horaires
      SET
        actif = IF(actif = 1, 0, 1),
        updated_at = NOW()
      WHERE id = ${id}
        AND ecole_id = ${ecole.id}
    `;
  }

  revalidatePath(
    "/dashboard/safe-campus/parametres-horaires"
  );
}

export async function supprimerPlageHoraire(
  formData: FormData
) {
  await exigerPermission(
    "SAFE_CAMPUS_VOIR",
    "Suppression plage horaire Safe Campus"
  );

  const ecole = await obtenirOuCreerEcole();
  const id = entier(formData, "id");

  if (id > 0) {
    await prisma.$executeRaw`
      DELETE FROM safe_campus_plages_horaires
      WHERE id = ${id}
        AND ecole_id = ${ecole.id}
    `;
  }

  revalidatePath(
    "/dashboard/safe-campus/parametres-horaires"
  );
}
