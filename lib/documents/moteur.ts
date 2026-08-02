import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export function creerCodeVerification(): string {
  return randomUUID().replaceAll("-", "").toUpperCase();
}

export function calculerEmpreinteDocument(payload: {
  ecoleId: number;
  eleveId: number;
  numero: string;
  type: string;
  dateEmission: string;
}): string {
  return createHash("sha256")
    .update([payload.ecoleId,payload.eleveId,payload.numero,payload.type,payload.dateEmission].join("|"))
    .digest("hex");
}

export async function genererNumeroDocument(
  ecoleId: number,
  typeDocument: string
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const reglages = await tx.$queryRaw<Array<{prefixe:string;longueur_sequence:number}>>`
      SELECT prefixe, longueur_sequence
      FROM parametres_documents_academiques
      WHERE ecole_id = ${ecoleId}
      LIMIT 1
      FOR UPDATE
    `;

    const prefixe = reglages[0]?.prefixe || "DSS";
    const longueur = Number(reglages[0]?.longueur_sequence || 7);
    const annee = new Date().getFullYear();

    await tx.$executeRaw`
      INSERT INTO numerotation_documents_academiques
      (ecole_id,type_document,annee,prochaine_sequence,created_at,updated_at)
      VALUES (${ecoleId},${typeDocument},${annee},2,NOW(),NOW())
      ON DUPLICATE KEY UPDATE
        prochaine_sequence = LAST_INSERT_ID(prochaine_sequence + 1),
        updated_at = NOW()
    `;

    const lignes = await tx.$queryRaw<Array<{sequence:bigint|number}>>`
      SELECT CASE WHEN prochaine_sequence = 2 THEN 1 ELSE LAST_INSERT_ID() END AS sequence
      FROM numerotation_documents_academiques
      WHERE ecole_id=${ecoleId} AND type_document=${typeDocument} AND annee=${annee}
      LIMIT 1
    `;

    const sequence = Number(lignes[0]?.sequence ?? 1);
    return `${prefixe}-${typeDocument.slice(0,3).toUpperCase()}-${annee}-${String(sequence).padStart(longueur,"0")}`;
  });
}
