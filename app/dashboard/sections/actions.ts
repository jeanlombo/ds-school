"use server";
import { exigerPermission } from "@/lib/securite/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { verifierQuota } from "@/lib/licence";

export async function creerSection(formData: FormData) {
  await exigerPermission("SECTIONS_AJOUTER", "app/dashboard/sections/actions.ts::creerSection");
  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion"); const ecole = await obtenirOuCreerEcole();
  const quota = await verifierQuota(ecole.id, "sections"); if (!quota.autorise) redirect(`/dashboard/sections?erreur=${encodeURIComponent(quota.message || "Limite de licence atteinte")}`);
  const nom=formData.get("nom")?.toString().trim(); const code=formData.get("code")?.toString().trim().toUpperCase(); const description=formData.get("description")?.toString().trim() || null;
  if(!nom||!code) redirect("/dashboard/sections?erreur=champs");
  await prisma.section.create({data:{ecoleId:ecole.id,nom,code,description}}); revalidatePath("/dashboard/sections"); redirect("/dashboard/sections?succes=1");
}
export async function basculerSection(formData: FormData) {
  await exigerPermission("SECTIONS_CHANGER_STATUT", "app/dashboard/sections/actions.ts::basculerSection"); if (!(await obtenirUtilisateurConnecte())) redirect("/connexion"); const id=Number(formData.get("id")); const statut=formData.get("statut") === "active" ? "inactive" : "active"; await prisma.section.update({where:{id},data:{statut}}); revalidatePath("/dashboard/sections"); }
