"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";

function entier(value: FormDataEntryValue | null): number {
  return Number.parseInt(String(value || "0"), 10);
}

function destination(code: string): never {
  redirect(`/dashboard/emploi-du-temps/nouveau?erreur=${encodeURIComponent(code)}`);
}

export async function creerSeance(formData: FormData) {
  await exigerPermission("EMPLOI_DU_TEMPS_AJOUTER", "app/dashboard/emploi-du-temps/actions.ts::creerSeance");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const anneeScolaireId = entier(formData.get("anneeScolaireId"));
  const classeId = entier(formData.get("classeId"));
  const matiereId = entier(formData.get("matiereId"));
  const enseignantId = entier(formData.get("enseignantId"));
  const creneauHoraireId = entier(formData.get("creneauHoraireId"));
  const salleIdValeur = entier(formData.get("salleId"));
  const typeCoursIdValeur = entier(formData.get("typeCoursId"));
  const jour = String(formData.get("jour") || "").trim();
  const observations = String(formData.get("observations") || "").trim();

  if (!anneeScolaireId || !classeId || !matiereId || !enseignantId || !creneauHoraireId || !jour) {
    destination("champs");
  }

  const salleId = salleIdValeur || null;
  const typeCoursId = typeCoursIdValeur || null;

  const [annee, classe, matiere, enseignant, creneau, salle, typeCours] = await Promise.all([
    prisma.anneeScolaire.findFirst({ where: { id: anneeScolaireId, ecoleId: ecole.id } }),
    prisma.classe.findFirst({ where: { id: classeId, ecoleId: ecole.id, statut: "active" } }),
    prisma.matiere.findFirst({ where: { id: matiereId, statut: "ACTIF" } }),
    prisma.enseignant.findFirst({ where: { id: enseignantId, ecoleId: ecole.id, statut: "actif" } }),
    prisma.creneauHoraire.findFirst({ where: { id: creneauHoraireId, ecoleId: ecole.id, actif: true } }),
    salleId ? prisma.salle.findFirst({ where: { id: salleId, ecoleId: ecole.id, statut: "ACTIVE" } }) : Promise.resolve(null),
    typeCoursId ? prisma.typeCours.findFirst({ where: { id: typeCoursId, ecoleId: ecole.id, actif: true } }) : Promise.resolve(null),
  ]);

  if (!annee || !classe || !matiere || !enseignant || !creneau) destination("selection");
  if (salleId && !salle) destination("salle");
  if (typeCoursId && !typeCours) destination("type");

  const jourAutorise = await prisma.jourOuvrable.findFirst({
    where: { ecoleId: ecole.id, jour, actif: true },
  });
  if (!jourAutorise) destination("jour");

  const conflits = await prisma.seanceEmploiTemps.findMany({
    where: {
      ecoleId: ecole.id,
      anneeScolaireId,
      jour,
      creneauHoraireId,
      statut: "ACTIVE",
      OR: [
        { classeId },
        { enseignantId },
        ...(salleId ? [{ salleId }] : []),
      ],
    },
    select: { classeId: true, enseignantId: true, salleId: true },
  });

  if (conflits.some((item) => item.classeId === classeId)) destination("conflit-classe");
  if (conflits.some((item) => item.enseignantId === enseignantId)) destination("conflit-enseignant");
  if (salleId && conflits.some((item) => item.salleId === salleId)) destination("conflit-salle");

  const regle = await prisma.regleAcademique.findUnique({ where: { ecoleId: ecole.id } });
  if (regle?.gestionConflits) {
    const totalClasseJour = await prisma.seanceEmploiTemps.count({
      where: { ecoleId: ecole.id, anneeScolaireId, classeId, jour, statut: "ACTIVE" },
    });
    if (totalClasseJour >= regle.maxCoursJour) destination("limite-classe");

    const totalEnseignantJour = await prisma.seanceEmploiTemps.count({
      where: { ecoleId: ecole.id, anneeScolaireId, enseignantId, jour, statut: "ACTIVE" },
    });
    if (totalEnseignantJour >= regle.maxPeriodesEnseignant) destination("limite-enseignant");
  }

  await prisma.seanceEmploiTemps.create({
    data: {
      ecoleId: ecole.id,
      anneeScolaireId,
      classeId,
      matiereId,
      enseignantId,
      creneauHoraireId,
      salleId,
      typeCoursId,
      jour,
      observations: observations || null,
    },
  });

  revalidatePath("/dashboard/emploi-du-temps");
  redirect("/dashboard/emploi-du-temps?succes=creation");
}

export async function supprimerSeance(formData: FormData) {
  await exigerPermission("EMPLOI_DU_TEMPS_SUPPRIMER", "app/dashboard/emploi-du-temps/actions.ts::supprimerSeance");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const id = entier(formData.get("id"));

  if (id) {
    await prisma.seanceEmploiTemps.deleteMany({ where: { id, ecoleId: ecole.id } });
  }

  revalidatePath("/dashboard/emploi-du-temps");
  redirect("/dashboard/emploi-du-temps?succes=suppression");
}
