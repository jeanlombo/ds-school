"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import { genererEmploiDuTemps } from "@/lib/emploi-du-temps/moteur";

export async function genererPlanification(
  formData: FormData
) {
  await exigerPermission(
    "EMPLOI_DU_TEMPS_GENERER",
    "Génération intelligente"
  );

  const ecole = await obtenirOuCreerEcole();

  const anneeScolaireId = Number(
    formData.get("annee_scolaire_id") ?? 0
  );
  const classeId = Number(
    formData.get("classe_id") ?? 0
  );
  const matiereId = Number(
    formData.get("matiere_id") ?? 0
  );
  const enseignantId = Number(
    formData.get("enseignant_id") ?? 0
  );
  const salleIdBrut = Number(
    formData.get("salle_id") ?? 0
  );
  const typeCoursIdBrut = Number(
    formData.get("type_cours_id") ?? 0
  );
  const volume = Number(
    formData.get("volume_hebdomadaire") ??
      1
  );

  if (
    anneeScolaireId <= 0 ||
    classeId <= 0 ||
    matiereId <= 0 ||
    enseignantId <= 0 ||
    volume <= 0
  ) {
    redirect(
      "/dashboard/emploi-du-temps/generation?erreur=champs"
    );
  }

  const resultat = await genererEmploiDuTemps({
    ecoleId: ecole.id,
    anneeScolaireId,
    classeId,
    matiereId,
    enseignantId,
    salleId:
      salleIdBrut > 0 ? salleIdBrut : null,
    typeCoursId:
      typeCoursIdBrut > 0
        ? typeCoursIdBrut
        : null,
    volumeHebdomadaire:
      Math.min(20, Math.trunc(volume)),
  });

  revalidatePath("/dashboard/emploi-du-temps");

  redirect(
    `/dashboard/emploi-du-temps/generation?succes=1&creees=${resultat.creees}&manquantes=${resultat.manquantes}`
  );
}
