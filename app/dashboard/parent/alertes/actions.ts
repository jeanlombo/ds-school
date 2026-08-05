"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  exigerEnfantDuParent,
  obtenirContexteParent,
} from "@/lib/parent-portail";

function texte(formData: FormData, cle: string) {
  return String(formData.get(cle) ?? "").trim();
}

export async function marquerAlerteCommeLue(
  evenementId: number,
  eleveId: number
) {
  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_communication"
  );

  const evenement = await prisma.$queryRaw<
    Array<{ id: number }>
  >`
    SELECT id
    FROM suivi_parent_evenements
    WHERE id = ${evenementId}
      AND ecole_id = ${contexte.ecoleId}
      AND eleve_id = ${eleveId}
      AND visible_parent = 1
    LIMIT 1
  `;

  if (!evenement.length) {
    redirect(
      "/acces-refuse?permission=PARENT_ALERTE_AUTORISEE"
    );
  }

  await prisma.$executeRaw`
    INSERT INTO suivi_parent_lectures
    (
      evenement_id,
      parent_id,
      lu_le
    )
    VALUES
    (
      ${evenementId},
      ${contexte.parentId},
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      lu_le = VALUES(lu_le)
  `;

  revalidatePath(
    `/dashboard/parent/alertes/${evenementId}`
  );
  revalidatePath("/dashboard/parent");
}

export async function repondreAlerteParent(
  evenementId: number,
  eleveId: number,
  formData: FormData
) {
  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_communication"
  );

  const typeReponse =
    texte(formData, "type_reponse") ||
    "MESSAGE";
  const message = texte(formData, "message");
  const pieceJointeUrl =
    texte(formData, "piece_jointe_url") ||
    null;

  if (!message) {
    redirect(
      `/dashboard/parent/alertes/${evenementId}?eleveId=${eleveId}&erreur=message`
    );
  }

  const evenement = await prisma.$queryRaw<
    Array<{ id: number }>
  >`
    SELECT id
    FROM suivi_parent_evenements
    WHERE id = ${evenementId}
      AND ecole_id = ${contexte.ecoleId}
      AND eleve_id = ${eleveId}
      AND visible_parent = 1
    LIMIT 1
  `;

  if (!evenement.length) {
    redirect(
      "/acces-refuse?permission=PARENT_ALERTE_AUTORISEE"
    );
  }

  await prisma.$executeRaw`
    INSERT INTO suivi_parent_reponses
    (
      evenement_id,
      parent_id,
      type_reponse,
      message,
      piece_jointe_url,
      statut,
      created_at
    )
    VALUES
    (
      ${evenementId},
      ${contexte.parentId},
      ${typeReponse},
      ${message},
      ${pieceJointeUrl},
      'ENVOYEE',
      NOW()
    )
  `;

  await prisma.$executeRaw`
    UPDATE suivi_parent_evenements
    SET
      statut = CASE
        WHEN type_evenement = 'ABSENCE'
          THEN 'EN_ATTENTE_REPONSE'
        WHEN type_evenement IN
          ('CONVOCATION','INVITATION')
          THEN 'CONFIRME'
        ELSE 'EN_ATTENTE_REPONSE'
      END,
      updated_at = NOW()
    WHERE id = ${evenementId}
      AND ecole_id = ${contexte.ecoleId}
  `;

  await marquerAlerteCommeLue(
    evenementId,
    eleveId
  );

  revalidatePath(
    `/dashboard/parent/alertes/${evenementId}`
  );
  revalidatePath("/dashboard/parent");
  redirect(
    `/dashboard/parent/alertes/${evenementId}?eleveId=${eleveId}&succes=reponse`
  );
}
