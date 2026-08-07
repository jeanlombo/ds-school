import { prisma } from "@/lib/prisma";
import { obtenirEcoleActive } from "@/lib/multi-etablissement";

export async function obtenirOuCreerEcole() {
  const active = await obtenirEcoleActive();
  if (active) {
    const ecole = await prisma.ecole.findUnique({ where: { id: active.id } });
    if (ecole) return ecole;
  }

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
