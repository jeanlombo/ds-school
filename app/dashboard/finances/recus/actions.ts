"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

const FORMATS = new Set(["A4", "A5", "POS58", "POS80"]);

export async function enregistrerImpressionRecu(
  recuId: number,
  format: string,
  duplicata: boolean
) {
  await exigerPermission("FINANCES_RECUS_REIMPRIMER");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const formatNormalise = String(format || "A4").toUpperCase();

  if (!FORMATS.has(formatNormalise)) {
    throw new Error("Format d’impression invalide.");
  }

  const recus = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM recus_scolaires
    WHERE id = ${recuId}
      AND ecole_id = ${ecole.id}
    LIMIT 1
  `;

  if (!recus.length) {
    throw new Error("Reçu introuvable.");
  }

  const enTetes = await headers();
  const adresseIp =
    enTetes.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    enTetes.get("x-real-ip") ||
    null;
  const appareil = enTetes.get("user-agent") || null;

  await prisma.$executeRaw`
    INSERT INTO journal_impressions_recus
    (
      ecole_id,
      recu_id,
      format_impression,
      duplicata,
      imprime_par,
      adresse_ip,
      appareil,
      date_impression
    )
    VALUES
    (
      ${ecole.id},
      ${recuId},
      ${formatNormalise},
      ${duplicata ? 1 : 0},
      ${utilisateur.nom},
      ${adresseIp},
      ${appareil},
      NOW()
    )
  `;

  revalidatePath("/dashboard/finances/recus");
  revalidatePath(`/dashboard/finances/recus/${recuId}`);
}
