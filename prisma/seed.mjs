import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

async function hacherMotDePasse(motDePasse) {
  const sel = randomBytes(16).toString("hex");
  const cle = await scrypt(motDePasse, sel, 64);
  return `scrypt:${sel}:${Buffer.from(cle).toString("hex")}`;
}

async function principal() {
  const email = "admin@dsschool.cd";
  const motDePasse = "Admin@2026";
  const hash = await hacherMotDePasse(motDePasse);

  await prisma.utilisateur.upsert({
    where: { email },
    update: { nom: "Administrateur Principal", role: "super_administrateur", statut: "actif" },
    create: { nom: "Administrateur Principal", email, motDePasse: hash, role: "super_administrateur", statut: "actif" },
  });

  console.log("Compte administrateur prêt :");
  console.log(`E-mail : ${email}`);
  console.log(`Mot de passe temporaire : ${motDePasse}`);
}

principal().catch((erreur) => { console.error(erreur); process.exit(1); }).finally(async () => prisma.$disconnect());
