"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
const txt=(fd:FormData,k:string)=>String(fd.get(k)??"").trim();
const num=(fd:FormData,k:string)=>Number(String(fd.get(k)??"0").replace(",","."));
export async function creer(fd:FormData){
 await exigerPermission("FINANCES_CATEGORIES_AJOUTER");
 const u=await obtenirUtilisateurConnecte(); if(!u) redirect("/connexion"); const e=await obtenirOuCreerEcole();
 const code=txt(fd,"code").toUpperCase(); const libelle=txt(fd,"libelle"); if(!code||!libelle) redirect("/dashboard/finances/categories-frais?erreur=champs");
 await prisma.$executeRaw`INSERT INTO categories_frais_scolaires(ecole_id,code,libelle,description,actif,cree_par,created_at,updated_at) VALUES(${e.id},${code},${libelle},${txt(fd,"description") || null},${fd.get("actif")==="on"?1:0},${u.nom},NOW(),NOW())`;
 revalidatePath("/dashboard/finances/categories-frais"); redirect("/dashboard/finances/categories-frais?succes=creation");
}
export async function basculer(id:number,actif:boolean){ await exigerPermission("FINANCES_CATEGORIES_MODIFIER"); const e=await obtenirOuCreerEcole(); await prisma.$executeRaw`UPDATE categories_frais_scolaires SET actif=${actif?0:1},updated_at=NOW() WHERE id=${id} AND ecole_id=${e.id}`; revalidatePath("/dashboard/finances/categories-frais"); }
