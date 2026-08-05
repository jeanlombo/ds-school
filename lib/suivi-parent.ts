import { prisma } from "@/lib/prisma";

export type TypeEvenementParent =
  | "DETTE"
  | "ABSENCE"
  | "RETARD"
  | "DISCIPLINE"
  | "PUNITION"
  | "EXCLUSION"
  | "CONVOCATION"
  | "INVITATION"
  | "MESSAGE"
  | "AUTRE";

export type NiveauEvenementParent =
  | "INFORMATION"
  | "IMPORTANT"
  | "URGENT";

export type CreerEvenementParentInput = {
  ecoleId: number;
  eleveId: number;
  typeEvenement: TypeEvenementParent;
  titre: string;
  description: string;
  niveau?: NiveauEvenementParent;
  montant?: number | null;
  devise?: string | null;
  dateEvenement?: Date;
  dateEcheance?: Date | null;
  lieu?: string | null;
  reponseRequise?: boolean;
  creePar?: string | null;
  referenceModule?: string | null;
  referenceId?: number | null;
};

/**
 * Point d'entrée partagé par les autres modules :
 * Finance, Safe Campus, Titulaire, Discipline, etc.
 *
 * Cette fonction évite de dupliquer la logique d'envoi vers l'Espace Parent.
 */
export async function creerEvenementParent(
  input: CreerEvenementParentInput
): Promise<number> {
  const dateEvenement =
    input.dateEvenement ?? new Date();

  await prisma.$executeRaw`
    INSERT INTO suivi_parent_evenements
    (
      ecole_id,
      eleve_id,
      type_evenement,
      titre,
      description,
      niveau,
      montant,
      devise,
      date_evenement,
      date_echeance,
      lieu,
      statut,
      visible_parent,
      reponse_requise,
      cree_par,
      reference_module,
      reference_id,
      created_at,
      updated_at
    )
    VALUES
    (
      ${input.ecoleId},
      ${input.eleveId},
      ${input.typeEvenement},
      ${input.titre},
      ${input.description},
      ${input.niveau ?? "IMPORTANT"},
      ${input.montant ?? null},
      ${input.devise ?? null},
      ${dateEvenement},
      ${input.dateEcheance ?? null},
      ${input.lieu ?? null},
      'NOUVEAU',
      1,
      ${input.reponseRequise ? 1 : 0},
      ${input.creePar ?? null},
      ${input.referenceModule ?? null},
      ${input.referenceId ?? null},
      NOW(),
      NOW()
    )
  `;

  const lignes = await prisma.$queryRaw<
    Array<{ id: number }>
  >`
    SELECT LAST_INSERT_ID() AS id
  `;

  return Number(lignes[0]?.id ?? 0);
}
