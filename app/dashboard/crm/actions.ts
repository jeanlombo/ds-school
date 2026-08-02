"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";

const texte = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const nullable = (v: FormDataEntryValue | null) => texte(v) || null;

export async function creerProspect(formData: FormData) {
  await exigerPermission("CRM_AJOUTER", "app/dashboard/crm/actions.ts::creerProspect");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();

  const nomEleve = texte(formData.get("nom_eleve"));
  const responsable = texte(formData.get("nom_responsable"));
  const telephone = texte(formData.get("telephone"));
  if (!nomEleve || !responsable || !telephone) redirect("/dashboard/crm/prospects/nouveau?erreur=champs");

  const code = `PR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const score = Math.max(0, Math.min(100, Number(formData.get("score") || 50)));
  const montant = Math.max(0, Number(formData.get("montant_estime") || 0));
  const dateNaissance = nullable(formData.get("date_naissance"));
  const prochaineRelance = nullable(formData.get("prochaine_relance"));

  await prisma.$executeRaw`
    INSERT INTO crm_prospects (
      ecole_id, code, nom_eleve, postnom_eleve, prenom_eleve, sexe, date_naissance,
      nom_responsable, telephone, telephone_secondaire, email, adresse, ville,
      ecole_origine, classe_souhaitee, annee_scolaire, source, statut, priorite,
      score, montant_estime, devise, conseiller, prochaine_relance, notes
    ) VALUES (
      ${ecole.id}, ${code}, ${nomEleve}, ${nullable(formData.get("postnom_eleve"))},
      ${nullable(formData.get("prenom_eleve"))}, ${nullable(formData.get("sexe"))}, ${dateNaissance},
      ${responsable}, ${telephone}, ${nullable(formData.get("telephone_secondaire"))},
      ${nullable(formData.get("email"))}, ${nullable(formData.get("adresse"))}, ${nullable(formData.get("ville"))},
      ${nullable(formData.get("ecole_origine"))}, ${nullable(formData.get("classe_souhaitee"))},
      ${nullable(formData.get("annee_scolaire"))}, ${texte(formData.get("source")) || "Autre"},
      'NOUVEAU', ${texte(formData.get("priorite")) || "TIEDE"}, ${score}, ${montant},
      ${texte(formData.get("devise")) || "CDF"}, ${nullable(formData.get("conseiller"))},
      ${prochaineRelance}, ${nullable(formData.get("notes"))}
    )`;

  revalidatePath("/dashboard/crm"); revalidatePath("/dashboard/crm/prospects");
  redirect("/dashboard/crm/prospects?succes=creation");
}

export async function changerStatut(formData: FormData) {
  await exigerPermission("CRM_CHANGER_STATUT", "app/dashboard/crm/actions.ts::changerStatut");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const id = Number(formData.get("id"));
  const statut = texte(formData.get("statut"));
  const autorises = ["NOUVEAU","CONTACTE","INTERESSE","RENDEZ_VOUS","VISITE","DOSSIER_RECU","VALIDATION","PAIEMENT","INSCRIPTION","PERDU"];
  if (!id || !autorises.includes(statut)) return;
  await prisma.$executeRaw`UPDATE crm_prospects SET statut=${statut}, date_conversion=IF(${statut}='INSCRIPTION', NOW(), date_conversion) WHERE id=${id} AND ecole_id=${ecole.id}`;
  await prisma.$executeRaw`INSERT INTO crm_activites (ecole_id, prospect_id, type, objet, contenu, auteur) VALUES (${ecole.id}, ${id}, 'STATUT', 'Changement d’étape', ${`Nouveau statut : ${statut}`}, ${utilisateur.nom})`;
  revalidatePath("/dashboard/crm"); revalidatePath("/dashboard/crm/pipeline"); revalidatePath("/dashboard/crm/prospects"); revalidatePath(`/dashboard/crm/prospects/${id}`);
}

export async function ajouterActivite(formData: FormData) {
  await exigerPermission("CRM_MODIFIER", "app/dashboard/crm/actions.ts::ajouterActivite");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const id = Number(formData.get("prospect_id"));
  const type = texte(formData.get("type")); const objet = texte(formData.get("objet"));
  if (!id || !type || !objet) return;
  await prisma.$executeRaw`INSERT INTO crm_activites (ecole_id, prospect_id, type, objet, contenu, auteur) VALUES (${ecole.id}, ${id}, ${type}, ${objet}, ${nullable(formData.get("contenu"))}, ${utilisateur.nom})`;
  revalidatePath(`/dashboard/crm/prospects/${id}`);
  redirect(`/dashboard/crm/prospects/${id}?succes=activite`);
}
