"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirContexteTitulaire } from "@/lib/titulaire";
import { exigerPermission } from "@/lib/securite/rbac";

export async function enregistrerPresences(
  formData: FormData
) {
  await exigerPermission("TITULAIRE_PRESENCES_SAISIR");

  const contexte = await obtenirContexteTitulaire();
  const datePresence = String(
    formData.get("date_presence") ?? ""
  ).trim();

  if (!datePresence) {
    redirect("/dashboard/titulaire/presences?erreur=date");
  }

  const eleveIds = formData
    .getAll("eleve_id")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

  const autorises = await prisma.inscription.findMany({
    where: {
      eleveId: { in: eleveIds },
      classeId: contexte.classeId,
      anneeScolaireId:
        contexte.anneeScolaireId,
      statut: { in: ["inscrit", "admis"] },
    },
    select: { eleveId: true },
  });

  const idsAutorises = new Set(
    autorises.map((ligne) => ligne.eleveId)
  );

  await prisma.$transaction(
    eleveIds
      .filter((eleveId) =>
        idsAutorises.has(eleveId)
      )
      .map((eleveId) => {
        const statut = String(
          formData.get(`statut_${eleveId}`) ??
            "PRESENT"
        );
        const observation =
          String(
            formData.get(
              `observation_${eleveId}`
            ) ?? ""
          ).trim() || null;

        return prisma.$executeRaw`
          INSERT INTO presences_titulaires
          (
            ecole_id,
            classe_id,
            annee_scolaire_id,
            eleve_id,
            titulaire_affectation_id,
            date_presence,
            statut,
            observation,
            saisi_par,
            created_at,
            updated_at
          )
          VALUES
          (
            ${contexte.ecoleId},
            ${contexte.classeId},
            ${contexte.anneeScolaireId},
            ${eleveId},
            ${contexte.affectationId},
            ${datePresence},
            ${statut},
            ${observation},
            ${contexte.utilisateur.nom},
            NOW(),
            NOW()
          )
          ON DUPLICATE KEY UPDATE
            statut = VALUES(statut),
            observation = VALUES(observation),
            saisi_par = VALUES(saisi_par),
            updated_at = NOW()
        `;
      })
  );

  revalidatePath("/dashboard/titulaire/presences");
  redirect(
    `/dashboard/titulaire/presences?date=${datePresence}&succes=1`
  );
}
