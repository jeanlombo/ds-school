"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";

type DecisionPromotion = "PROMU" | "REDOUBLE" | "RATTRAPAGE" | "EXCLU";

type LignePromotion = {
  inscriptionId: number;
  eleveId: number;
  decision: DecisionPromotion;
};

function nombre(value: FormDataEntryValue | null) {
  return Number(value ?? 0);
}

function texte(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function executerPromotion(formData: FormData) {
  await exigerPermission("ACADEMIQUE_VALIDER", "app/dashboard/centre-academique/promotions/actions.ts::executerPromotion");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const anneeSourceId = nombre(formData.get("anneeSourceId"));
  const anneeCibleId = nombre(formData.get("anneeCibleId"));
  const classeSourceId = nombre(formData.get("classeSourceId"));
  const classeCibleId = nombre(formData.get("classeCibleId"));
  const lignesBrutes = texte(formData.get("lignes"));
  const confirmation = texte(formData.get("confirmation"));

  if (
    !anneeSourceId ||
    !anneeCibleId ||
    !classeSourceId ||
    !classeCibleId ||
    confirmation !== "CONFIRMER"
  ) {
    redirect(
      `/dashboard/centre-academique/promotions?erreur=parametres&anneeSourceId=${anneeSourceId}&classeSourceId=${classeSourceId}`,
    );
  }

  let lignes: LignePromotion[] = [];
  try {
    lignes = JSON.parse(lignesBrutes);
  } catch {
    redirect(
      `/dashboard/centre-academique/promotions?erreur=donnees&anneeSourceId=${anneeSourceId}&classeSourceId=${classeSourceId}`,
    );
  }

  if (!Array.isArray(lignes) || lignes.length === 0) {
    redirect(
      `/dashboard/centre-academique/promotions?erreur=aucun&anneeSourceId=${anneeSourceId}&classeSourceId=${classeSourceId}`,
    );
  }

  const [anneeSource, anneeCible, classeSource, classeCible, inscriptions] =
    await Promise.all([
      prisma.anneeScolaire.findFirst({
        where: { id: anneeSourceId, ecoleId: ecole.id },
      }),
      prisma.anneeScolaire.findFirst({
        where: { id: anneeCibleId, ecoleId: ecole.id },
      }),
      prisma.classe.findFirst({
        where: { id: classeSourceId, ecoleId: ecole.id },
      }),
      prisma.classe.findFirst({
        where: { id: classeCibleId, ecoleId: ecole.id },
      }),
      prisma.inscription.findMany({
        where: {
          id: { in: lignes.map((ligne) => ligne.inscriptionId) },
          classeId: classeSourceId,
          anneeScolaireId: anneeSourceId,
          eleve: { ecoleId: ecole.id },
        },
        include: { eleve: true },
      }),
    ]);

  if (!anneeSource || !anneeCible || !classeSource || !classeCible) {
    redirect("/dashboard/centre-academique/promotions?erreur=introuvable");
  }

  if (anneeSourceId === anneeCibleId) {
    redirect(
      `/dashboard/centre-academique/promotions?erreur=meme_annee&anneeSourceId=${anneeSourceId}&classeSourceId=${classeSourceId}`,
    );
  }

  const inscriptionParId = new Map(
    inscriptions.map((inscription) => [inscription.id, inscription]),
  );
  const auteur =
    utilisateur.nom?.trim() || utilisateur.email || "Utilisateur";

  let promus = 0;
  let redoublants = 0;
  let exclus = 0;
  let ignores = 0;

  await prisma.$transaction(async (tx) => {
    for (const ligne of lignes) {
      const inscription = inscriptionParId.get(ligne.inscriptionId);
      if (!inscription || inscription.eleveId !== ligne.eleveId) {
        ignores += 1;
        continue;
      }

      if (ligne.decision === "RATTRAPAGE") {
        ignores += 1;
        continue;
      }

      if (ligne.decision === "EXCLU") {
        await tx.inscription.update({
          where: { id: inscription.id },
          data: { statut: "exclu" },
        });
        await tx.eleve.update({
          where: { id: inscription.eleveId },
          data: { statut: "exclu" },
        });
        await tx.historiqueEleve.create({
          data: {
            eleveId: inscription.eleveId,
            type: "EXCLUSION_ACADEMIQUE",
            details: JSON.stringify({
              anneeSource: anneeSource.libelle,
              classeSource: classeSource.nom,
              decision: "Exclu",
            }),
            auteur,
          },
        });
        exclus += 1;
        continue;
      }

      const estPromu = ligne.decision === "PROMU";
      const classeDestinationId = estPromu ? classeCibleId : classeSourceId;
      const statutSource = estPromu ? "promu" : "redouble";

      await tx.inscription.update({
        where: { id: inscription.id },
        data: { statut: statutSource },
      });

      await tx.inscription.upsert({
        where: {
          eleveId_anneeScolaireId: {
            eleveId: inscription.eleveId,
            anneeScolaireId: anneeCibleId,
          },
        },
        update: {
          classeId: classeDestinationId,
          statut: "inscrit",
          typeAdmission: estPromu ? "promotion" : "redoublement",
        },
        create: {
          eleveId: inscription.eleveId,
          classeId: classeDestinationId,
          anneeScolaireId: anneeCibleId,
          statut: "inscrit",
          typeAdmission: estPromu ? "promotion" : "redoublement",
          ancienneEcole: ecole.nom,
        },
      });

      await tx.historiqueEleve.create({
        data: {
          eleveId: inscription.eleveId,
          type: estPromu ? "PROMOTION_ACADEMIQUE" : "REDOUBLEMENT_ACADEMIQUE",
          details: JSON.stringify({
            anneeSource: anneeSource.libelle,
            anneeCible: anneeCible.libelle,
            classeSource: classeSource.nom,
            classeDestination: estPromu ? classeCible.nom : classeSource.nom,
            decision: estPromu ? "Promu" : "Redouble",
          }),
          auteur,
        },
      });

      await tx.eleve.update({
        where: { id: inscription.eleveId },
        data: { statut: "actif" },
      });

      if (estPromu) promus += 1;
      else redoublants += 1;
    }
  });

  revalidatePath("/dashboard/centre-academique");
  revalidatePath("/dashboard/centre-academique/promotions");
  revalidatePath("/dashboard/eleves");
  revalidatePath("/dashboard/inscriptions");

  redirect(
    `/dashboard/centre-academique/promotions?succes=1&promus=${promus}&redoublants=${redoublants}&exclus=${exclus}&ignores=${ignores}&anneeSourceId=${anneeSourceId}&classeSourceId=${classeSourceId}`,
  );
}
