"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { obtenirUtilisateurConnecte } from "@/lib/session";

async function exigerSuperAdmin() {
  const u = await obtenirUtilisateurConnecte();
  if (!u?.superAdministrateur) throw new Error("Accès réservé au Super Administrateur DIGIGROUPE.");
  return u;
}

export async function creerOrganisation(fd: FormData) {
  const u = await exigerSuperAdmin();
  const nom=String(fd.get("nom")||"").trim();
  const code=String(fd.get("code")||"").trim().toUpperCase();
  if(!nom || !code) throw new Error("Nom et code obligatoires.");

  await prisma.$executeRaw`
    INSERT INTO organisations_clientes
      (code,nom,type_client,nom_contact,telephone,email,adresse,statut)
    VALUES (
      ${code},${nom},${String(fd.get("type_client")||"GROUPE_SCOLAIRE")},
      ${String(fd.get("nom_contact")||"") || null},
      ${String(fd.get("telephone")||"") || null},
      ${String(fd.get("email")||"") || null},
      ${String(fd.get("adresse")||"") || null},'ACTIF'
    )
  `;
  await prisma.$executeRaw`
    INSERT INTO historique_abonnements_clients(organisation_id,utilisateur_id,action,details)
    SELECT id,${u.id},'CREATION_ORGANISATION',${"Création de "+nom}
    FROM organisations_clientes WHERE code=${code} LIMIT 1
  `;
  revalidatePath("/dashboard/organisations");
}

export async function rattacherEtablissement(fd: FormData) {
  await exigerSuperAdmin();
  const organisationId=Number(fd.get("organisation_id"));
  const ecoleId=Number(fd.get("ecole_id"));
  await prisma.$executeRaw`
    INSERT INTO organisation_etablissements(organisation_id,ecole_id,principal)
    VALUES(${organisationId},${ecoleId},${fd.get("principal")==="1"?1:0})
    ON DUPLICATE KEY UPDATE organisation_id=VALUES(organisation_id), principal=VALUES(principal)
  `;
  revalidatePath("/dashboard/organisations");
}

export async function rattacherUtilisateurGroupe(fd: FormData) {
  await exigerSuperAdmin();
  const utilisateurId=Number(fd.get("utilisateur_id"));
  const organisationId=Number(fd.get("organisation_id"));
  const role=String(fd.get("role_groupe")||"LECTEUR");
  await prisma.$executeRaw`
    INSERT INTO utilisateurs_organisations(utilisateur_id,organisation_id,role_groupe,actif)
    VALUES(${utilisateurId},${organisationId},${role},1)
    ON DUPLICATE KEY UPDATE role_groupe=VALUES(role_groupe), actif=1
  `;
  revalidatePath("/dashboard/organisations");
}
