"use server";
import { exigerPermission } from "@/lib/securite/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";

export async function creerAnnee(formData: FormData) {
  await exigerPermission("ANNEES_SCOLAIRES_AJOUTER", "app/dashboard/annees-scolaires/actions.ts::creerAnnee");
  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const libelle = formData.get("libelle")?.toString().trim();
  const dateDebut = formData.get("dateDebut")?.toString();
  const dateFin = formData.get("dateFin")?.toString();
  if (!libelle || !dateDebut || !dateFin || new Date(dateFin) <= new Date(dateDebut)) redirect("/dashboard/annees-scolaires?erreur=dates");
  await prisma.anneeScolaire.create({ data: { ecoleId: ecole.id, libelle, dateDebut: new Date(`${dateDebut}T00:00:00`), dateFin: new Date(`${dateFin}T00:00:00`) } });
  revalidatePath("/dashboard/annees-scolaires"); redirect("/dashboard/annees-scolaires?succes=creation");
}

export async function activerAnnee(formData: FormData) {
  await exigerPermission("ANNEES_SCOLAIRES_CHANGER_STATUT", "app/dashboard/annees-scolaires/actions.ts::activerAnnee");
  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const id = Number(formData.get("id"));
  await prisma.$transaction([prisma.anneeScolaire.updateMany({ where: { ecoleId: ecole.id }, data: { active: false } }), prisma.anneeScolaire.update({ where: { id }, data: { active: true, statut: "ouverte" } })]);
  revalidatePath("/dashboard"); revalidatePath("/dashboard/annees-scolaires");
}

export async function basculerStatutAnnee(formData: FormData) {
  await exigerPermission("ANNEES_SCOLAIRES_CHANGER_STATUT", "app/dashboard/annees-scolaires/actions.ts::basculerStatutAnnee");
  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");
  const id = Number(formData.get("id")); const statut = formData.get("statut") === "ouverte" ? "cloturee" : "ouverte";
  await prisma.anneeScolaire.update({ where: { id }, data: { statut, ...(statut === "cloturee" ? { active: false } : {}) } });
  revalidatePath("/dashboard/annees-scolaires");
}
