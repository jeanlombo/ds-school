"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { obtenirUtilisateurConnecte } from "@/lib/session";

async function admin(){
 const u=await obtenirUtilisateurConnecte();
 if(!u?.superAdministrateur) throw new Error("Accès réservé au Super Administrateur DIGIGROUPE.");
 return u;
}

export async function creerAbonnement(fd:FormData){
 const u=await admin();
 const organisationId=Number(fd.get("organisation_id"));
 const code=String(fd.get("code_abonnement")||"").trim().toUpperCase();
 const formule=String(fd.get("formule")||"Standard");
 const debut=String(fd.get("date_debut")||"");
 const expiration=String(fd.get("date_expiration")||"");
 const montant=Number(fd.get("montant")||0);
 const devise=String(fd.get("devise")||"USD");
 if(!organisationId||!code||!debut||!expiration) throw new Error("Informations d'abonnement incomplètes.");
 await prisma.$executeRaw`
 INSERT INTO abonnements_clients(organisation_id,code_abonnement,formule,date_debut,date_expiration,statut,montant,devise,periodicite,observations)
 VALUES(${organisationId},${code},${formule},${debut},${expiration},'ACTIF',${montant},${devise},${String(fd.get("periodicite")||"ANNUEL")},${String(fd.get("observations")||"")||null})`;
 await prisma.$executeRaw`
 INSERT INTO historique_abonnements_clients(organisation_id,utilisateur_id,action,details)
 VALUES(${organisationId},${u.id},'CREATION_ABONNEMENT',${"Création "+code})`;
 revalidatePath("/dashboard/saas");
}

export async function enregistrerPaiement(fd:FormData){
 await admin();
 const abonnementId=Number(fd.get("abonnement_id"));
 const rows=await prisma.$queryRaw<{organisation_id:number}[]>`SELECT organisation_id FROM abonnements_clients WHERE id=${abonnementId} LIMIT 1`;
 if(!rows.length) throw new Error("Abonnement introuvable.");
 await prisma.$executeRaw`
 INSERT INTO paiements_abonnements_clients(abonnement_id,organisation_id,montant,devise,mode_paiement,reference_paiement,date_paiement,statut,observations)
 VALUES(${abonnementId},${Number(rows[0].organisation_id)},${Number(fd.get("montant")||0)},${String(fd.get("devise")||"USD")},
 ${String(fd.get("mode_paiement")||"")||null},${String(fd.get("reference_paiement")||"")||null},
 ${String(fd.get("date_paiement")||"")},'VALIDE',${String(fd.get("observations")||"")||null})`;
 revalidatePath("/dashboard/saas");
}

export async function renouvelerAbonnement(fd:FormData){
 const u=await admin();
 const id=Number(fd.get("abonnement_id"));
 const nouvelle=String(fd.get("nouvelle_expiration")||"");
 const rows=await prisma.$queryRaw<{organisation_id:number,date_expiration:Date|null}[]>`
 SELECT organisation_id,date_expiration FROM abonnements_clients WHERE id=${id} LIMIT 1`;
 if(!rows.length||!nouvelle) throw new Error("Renouvellement invalide.");
 const r=rows[0];
 await prisma.$executeRaw`
 INSERT INTO renouvellements_abonnements(abonnement_id,organisation_id,ancienne_expiration,nouvelle_expiration,montant,devise,utilisateur_id,observations)
 VALUES(${id},${Number(r.organisation_id)},${r.date_expiration},${nouvelle},${Number(fd.get("montant")||0)},${String(fd.get("devise")||"USD")},${u.id},${String(fd.get("observations")||"")||null})`;
 await prisma.$executeRaw`UPDATE abonnements_clients SET date_expiration=${nouvelle},statut='ACTIF' WHERE id=${id}`;
 revalidatePath("/dashboard/saas");
}
