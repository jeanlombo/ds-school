"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirUtilisateurConnecte } from "@/lib/session";

async function exigerSuperAdmin() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  if (!utilisateur.superAdministrateur) throw new Error("Accès réservé au Super Administrateur DIGIGROUPE.");
}

function texte(fd: FormData, nom: string) {
  const v = String(fd.get(nom) ?? "").trim();
  return v || null;
}

export async function creerEtablissement(fd: FormData) {
  await exigerSuperAdmin();
  const nom = texte(fd, "nom");
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (!nom || !code) throw new Error("Le nom et le code sont obligatoires.");

  const existe = await prisma.ecole.findUnique({ where: { code }, select: { id: true } });
  if (existe) throw new Error(`Le code ${code} est déjà utilisé.`);

  const ecole = await prisma.ecole.create({ data: {
    nom, code, slogan: texte(fd,"slogan"), adresse: texte(fd,"adresse"),
    ville: texte(fd,"ville"), pays: texte(fd,"pays") ?? "République démocratique du Congo",
    telephone: texte(fd,"telephone"), email: texte(fd,"email"),
    siteWeb: texte(fd,"site_web"), devise: texte(fd,"devise") ?? "CDF",
    directeur: texte(fd,"directeur"), boitePostale: texte(fd,"boite_postale"), statut:"active"
  }});

  const organisationId = Number(fd.get("organisation_id") ?? 0);
  if (organisationId > 0) {
    await prisma.$executeRaw`
      INSERT INTO organisation_etablissements (organisation_id, ecole_id, principal)
      VALUES (${organisationId}, ${ecole.id}, 0)
      ON DUPLICATE KEY UPDATE organisation_id=VALUES(organisation_id)
    `;
  }
  revalidatePath("/dashboard/etablissements");
  revalidatePath("/dashboard/organisations");
  redirect("/dashboard/etablissements?creation=ok");
}

export async function modifierEtablissement(fd: FormData) {
  await exigerSuperAdmin();
  const id=Number(fd.get("id"));
  const nom=texte(fd,"nom");
  const code=String(fd.get("code")??"").trim().toUpperCase();
  if(!id || !nom || !code) throw new Error("Informations invalides.");
  const doublon=await prisma.ecole.findFirst({where:{code,NOT:{id}},select:{id:true}});
  if(doublon) throw new Error(`Le code ${code} est déjà utilisé.`);
  await prisma.ecole.update({where:{id},data:{
    nom,code,adresse:texte(fd,"adresse"),ville:texte(fd,"ville"),pays:texte(fd,"pays"),
    telephone:texte(fd,"telephone"),email:texte(fd,"email"),directeur:texte(fd,"directeur"),
    devise:texte(fd,"devise")??"CDF"
  }});
  revalidatePath("/dashboard/etablissements");
}

export async function changerStatutEtablissement(fd: FormData) {
  await exigerSuperAdmin();
  const id=Number(fd.get("id"));
  const statut=String(fd.get("statut")??"");
  if(!id || !["active","inactive"].includes(statut)) throw new Error("Action invalide.");
  await prisma.ecole.update({where:{id},data:{statut}});
  revalidatePath("/dashboard/etablissements");
}
