"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
export async function enregistrerParametresDocuments(fd:FormData){await exigerPermission("DOCUMENTS_PARAMETRES_GERER");const ecole=await obtenirOuCreerEcole();const prefixe=String(fd.get("prefixe")??"DSS").trim().toUpperCase();const longueur=Number(fd.get("longueur_sequence")??7);const couleur=String(fd.get("couleur_officielle")??"#5B2A86").trim();await prisma.$executeRaw`INSERT INTO parametres_documents_academiques(ecole_id,prefixe,longueur_sequence,couleur_officielle,created_at,updated_at) VALUES(${ecole.id},${prefixe},${longueur},${couleur},NOW(),NOW()) ON DUPLICATE KEY UPDATE prefixe=VALUES(prefixe),longueur_sequence=VALUES(longueur_sequence),couleur_officielle=VALUES(couleur_officielle),updated_at=NOW()`;revalidatePath("/dashboard/centre-academique/parametres-documents");redirect("/dashboard/centre-academique/parametres-documents?succes=1")}
