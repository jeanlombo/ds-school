import { PrismaClient } from "@prisma/client";

/**
 * Cache Prisma versionné.
 *
 * Le nom global volontairement nouveau empêche Next.js de réutiliser
 * une ancienne instance Prisma créée avant l'ajout des modèles académiques.
 */
const globalForPrisma = globalThis as unknown as {
  prismaDSchoolCentreAcademiqueV1?: PrismaClient;
};

const prisma =
  globalForPrisma.prismaDSchoolCentreAcademiqueV1 ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaDSchoolCentreAcademiqueV1 = prisma;
}

export { prisma };
export default prisma;