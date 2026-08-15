import { prisma } from "@/lib/prisma";
import {
  obtenirProfilAcademique,
  type ProfilAcademique,
} from "@/lib/academique/terminologie";

export async function obtenirProfilAcademiqueParClasse(
  classeId: number,
): Promise<ProfilAcademique> {
  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
    select: {
      section: {
        select: { nom: true, code: true },
      },
    },
  });

  return obtenirProfilAcademique(
    classe?.section?.nom,
    classe?.section?.code,
  );
}

export async function obtenirProfilAcademiqueParEleve(
  eleveId: number,
): Promise<ProfilAcademique> {
  const inscription = await prisma.inscription.findFirst({
    where: { eleveId },
    orderBy: { createdAt: "desc" },
    select: {
      classe: {
        select: {
          section: {
            select: { nom: true, code: true },
          },
        },
      },
    },
  });

  return obtenirProfilAcademique(
    inscription?.classe?.section?.nom,
    inscription?.classe?.section?.code,
  );
}
