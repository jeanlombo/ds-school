"use server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { hacherMotDePasse } from "@/lib/mot-de-passe";

async function superAdmin(){
 const u=await obtenirUtilisateurConnecte();
 if(!u?.superAdministrateur) throw new Error("Accès réservé à DIGIGROUPE.");
 return u;
}
export async function creerCompteProprietaire(fd:FormData){
 const admin=await superAdmin();
 const organisationId=Number(fd.get("organisation_id"));
 const nom=String(fd.get("nom")||"").trim();
 const email=String(fd.get("email")||"").trim().toLowerCase();
 const mdp=String(fd.get("mot_de_passe")||"");
 const role=String(fd.get("role_groupe")||"PROPRIETAIRE");
 if(!organisationId||!nom||!email||mdp.length<8) throw new Error("Informations du compte invalides.");

 const exist=await prisma.utilisateur.findUnique({where:{email},select:{id:true}});
 if(exist) throw new Error("Cette adresse e-mail possède déjà un compte.");
 const hash=await hacherMotDePasse(mdp);

 await prisma.$transaction(async tx=>{
   const u=await tx.utilisateur.create({data:{nom,email,motDePasse:hash,role:"Propriétaire Groupe",statut:"actif"}});
   await tx.$executeRaw`INSERT INTO utilisateurs_organisations(utilisateur_id,organisation_id,role_groupe,actif)
     VALUES(${u.id},${organisationId},${role},1)`;
   await tx.$executeRaw`
     INSERT INTO utilisateurs_etablissements(utilisateur_id,ecole_id,role_etablissement,principal,actif)
     SELECT ${u.id},oe.ecole_id,${role},oe.principal,1
     FROM organisation_etablissements oe WHERE oe.organisation_id=${organisationId}`;
   await tx.$executeRaw`
     INSERT INTO invitations_comptes_clients(organisation_id,utilisateur_id,email,role_groupe,statut,activated_at)
     VALUES(${organisationId},${u.id},${email},${role},'ACTIVE',NOW())`;
   await tx.$executeRaw`
     INSERT INTO historique_abonnements_clients(organisation_id,utilisateur_id,action,details)
     VALUES(${organisationId},${admin.id},'CREATION_COMPTE_CLIENT',${"Compte "+email+" créé"})`;
 });
 revalidatePath("/dashboard/comptes-clients");
 redirect("/dashboard/comptes-clients?succes=1");
}
