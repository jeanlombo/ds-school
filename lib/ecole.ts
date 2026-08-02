import { prisma } from "@/lib/prisma";

export async function obtenirOuCreerEcole() {
  const existante = await prisma.ecole.findFirst({ orderBy: { id: "asc" } });
  if (existante) return existante;

  return prisma.ecole.create({
    data: {
      nom: "DS School Premium",
      code: "DS-SCHOOL",
      slogan: "L'excellence scolaire, pilotée autrement",
      pays: "République démocratique du Congo",
      devise: "CDF",
    },
  });
}
