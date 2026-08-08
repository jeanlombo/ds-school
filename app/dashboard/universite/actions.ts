"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { exigerPermission } from "@/lib/securite/rbac";
import { obtenirUtilisateurConnecte } from "@/lib/session";

async function contexte() {
  await exigerPermission("ACADEMIQUE_VOIR", "app/dashboard/universite/actions.ts");
  if (!(await obtenirUtilisateurConnecte())) redirect("/connexion");
  return obtenirOuCreerEcole();
}

function texte(formData: FormData, nom: string) {
  return String(formData.get(nom) ?? "").trim();
}

export async function creerFaculte(formData: FormData) {
  const ecole = await contexte();
  const nom = texte(formData, "nom");
  const code = texte(formData, "code").toUpperCase();
  if (!nom || !code) redirect("/dashboard/universite?erreur=faculte");
  await prisma.faculteUniversitaire.create({ data: { ecoleId: ecole.id, nom, code } });
  revalidatePath("/dashboard/universite");
}

export async function creerDepartement(formData: FormData) {
  const ecole = await contexte();
  const nom = texte(formData, "nom");
  const code = texte(formData, "code").toUpperCase();
  const faculteId = Number(formData.get("faculteId"));
  if (!nom || !code || !Number.isInteger(faculteId)) redirect("/dashboard/universite?erreur=departement");
  const faculte = await prisma.faculteUniversitaire.findFirst({ where: { id: faculteId, ecoleId: ecole.id } });
  if (!faculte) redirect("/dashboard/universite?erreur=faculte");
  await prisma.departementUniversitaire.create({ data: { ecoleId: ecole.id, faculteId, nom, code } });
  revalidatePath("/dashboard/universite");
}

export async function creerCycle(formData: FormData) {
  const ecole = await contexte();
  const nom = texte(formData, "nom");
  const code = texte(formData, "code").toUpperCase();
  const dureeAnnees = Math.max(1, Number(formData.get("dureeAnnees") || 3));
  if (!nom || !code) redirect("/dashboard/universite?erreur=cycle");
  await prisma.cycleUniversitaire.create({ data: { ecoleId: ecole.id, nom, code, dureeAnnees } });
  revalidatePath("/dashboard/universite");
}

export async function creerPromotion(formData: FormData) {
  const ecole = await contexte();
  const nom = texte(formData, "nom");
  const code = texte(formData, "code").toUpperCase();
  const departementId = Number(formData.get("departementId"));
  const cycleId = Number(formData.get("cycleId"));
  const niveau = Math.max(1, Number(formData.get("niveau") || 1));
  if (!nom || !code || !Number.isInteger(departementId) || !Number.isInteger(cycleId)) redirect("/dashboard/universite?erreur=promotion");
  const [departement, cycle] = await Promise.all([
    prisma.departementUniversitaire.findFirst({ where: { id: departementId, ecoleId: ecole.id } }),
    prisma.cycleUniversitaire.findFirst({ where: { id: cycleId, ecoleId: ecole.id } }),
  ]);
  if (!departement || !cycle) redirect("/dashboard/universite?erreur=promotion");
  await prisma.promotionUniversitaire.create({ data: { ecoleId: ecole.id, departementId, cycleId, nom, code, niveau } });
  revalidatePath("/dashboard/universite");
}

export async function creerSemestre(formData: FormData) {
  const ecole = await contexte();
  const promotionId = Number(formData.get("promotionId"));
  const anneeScolaireId = Number(formData.get("anneeScolaireId"));
  const numero = Number(formData.get("numero"));
  const libelle = texte(formData, "libelle") || `Semestre ${numero}`;
  if (![promotionId, anneeScolaireId, numero].every(Number.isInteger)) redirect("/dashboard/universite?erreur=semestre");
  await prisma.semestreUniversitaire.create({ data: { ecoleId: ecole.id, promotionId, anneeScolaireId, numero, libelle } });
  revalidatePath("/dashboard/universite");
}

export async function creerUE(formData: FormData) {
  const ecole = await contexte();
  const semestreId = Number(formData.get("semestreId"));
  const code = texte(formData, "code").toUpperCase();
  const nom = texte(formData, "nom");
  const credits = Math.max(0, Number(formData.get("credits") || 0));
  if (!Number.isInteger(semestreId) || !code || !nom) redirect("/dashboard/universite?erreur=ue");
  await prisma.uniteEnseignement.create({ data: { ecoleId: ecole.id, semestreId, code, nom, credits } });
  revalidatePath("/dashboard/universite");
}

export async function creerCours(formData: FormData) {
  const ecole = await contexte();
  const uniteId = Number(formData.get("uniteId"));
  const code = texte(formData, "code").toUpperCase();
  const nom = texte(formData, "nom");
  const credits = Math.max(0, Number(formData.get("credits") || 0));
  const volumeHoraire = Number(formData.get("volumeHoraire") || 0) || null;
  if (!Number.isInteger(uniteId) || !code || !nom) redirect("/dashboard/universite?erreur=cours");
  await prisma.coursUniversitaire.create({ data: { ecoleId: ecole.id, uniteId, code, nom, credits, volumeHoraire } });
  revalidatePath("/dashboard/universite");
}
