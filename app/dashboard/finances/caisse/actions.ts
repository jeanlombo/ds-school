"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

function nombre(formData: FormData, cle: string) {
  const valeur = Number(formData.get(cle));
  return Number.isFinite(valeur) ? valeur : 0;
}

function texte(formData: FormData, cle: string) {
  return String(formData.get(cle) ?? "").trim();
}

export async function ouvrirCaisse(formData: FormData) {
  await exigerPermission("FINANCES_CAISSE_OUVRIR");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const soldeInitial = nombre(formData, "solde_initial");
  const devise = texte(formData, "devise") || "CDF";

  const dejaOuverte = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM sessions_caisse_scolaire
    WHERE ecole_id = ${ecole.id}
      AND utilisateur_nom = ${utilisateur.nom}
      AND statut = 'OUVERTE'
    LIMIT 1
  `;

  if (dejaOuverte.length) {
    redirect("/dashboard/finances/caisse?erreur=deja_ouverte");
  }

  await prisma.$executeRaw`
    INSERT INTO sessions_caisse_scolaire
    (
      ecole_id, utilisateur_nom, date_ouverture,
      solde_initial, devise, statut
    )
    VALUES
    (
      ${ecole.id}, ${utilisateur.nom}, NOW(),
      ${soldeInitial}, ${devise}, 'OUVERTE'
    )
  `;

  revalidatePath("/dashboard/finances/caisse");
  redirect("/dashboard/finances/caisse?succes=ouverture");
}

export async function fermerCaisse(formData: FormData) {
  await exigerPermission("FINANCES_CAISSE_FERMER");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const sessionId = nombre(formData, "session_id");
  const soldeCompte = nombre(formData, "solde_compte");
  const observation = texte(formData, "observation") || null;

  const resume = await prisma.$queryRaw<Array<{ total_entrees: number; total_sorties: number; solde_initial: number }>>`
    SELECT
      s.solde_initial,
      COALESCE(SUM(CASE WHEN m.type_mouvement = 'ENTREE' THEN m.montant ELSE 0 END), 0) AS total_entrees,
      COALESCE(SUM(CASE WHEN m.type_mouvement = 'SORTIE' THEN m.montant ELSE 0 END), 0) AS total_sorties
    FROM sessions_caisse_scolaire s
    LEFT JOIN mouvements_caisse_scolaire m ON m.session_caisse_id = s.id
    WHERE s.id = ${sessionId}
      AND s.ecole_id = ${ecole.id}
      AND s.statut = 'OUVERTE'
    GROUP BY s.id
  `;

  const ligne = resume[0];
  if (!ligne) redirect("/dashboard/finances/caisse?erreur=session");

  const soldeTheorique =
    Number(ligne.solde_initial) +
    Number(ligne.total_entrees) -
    Number(ligne.total_sorties);

  const ecart = soldeCompte - soldeTheorique;

  await prisma.$executeRaw`
    UPDATE sessions_caisse_scolaire
    SET
      date_fermeture = NOW(),
      solde_theorique = ${soldeTheorique},
      solde_compte = ${soldeCompte},
      ecart = ${ecart},
      observation_fermeture = ${observation},
      statut = 'FERMEE'
    WHERE id = ${sessionId}
      AND ecole_id = ${ecole.id}
  `;

  revalidatePath("/dashboard/finances/caisse");
  redirect("/dashboard/finances/caisse?succes=fermeture");
}
