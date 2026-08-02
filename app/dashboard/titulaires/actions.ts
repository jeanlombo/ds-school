"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

const entier = (fd: FormData, nom: string) =>
  Number(fd.get(nom) ?? 0);

export async function affecterTitulaire(formData: FormData) {
  await exigerPermission(
    "TITULAIRES_AFFECTER",
    "Affectation d’un titulaire"
  );

  const administrateur = await obtenirUtilisateurConnecte();
  if (!administrateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const utilisateurSecuriteId = entier(
    formData,
    "utilisateur_securite_id"
  );
  const enseignantId = entier(formData, "enseignant_id");
  const classeId = entier(formData, "classe_id");
  const anneeScolaireId = entier(
    formData,
    "annee_scolaire_id"
  );

  if (
    utilisateurSecuriteId <= 0 ||
    enseignantId <= 0 ||
    classeId <= 0 ||
    anneeScolaireId <= 0
  ) {
    redirect("/dashboard/titulaires?erreur=champs");
  }

  const [compte, enseignant, classe, annee] =
    await Promise.all([
      prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM utilisateurs_securite
        WHERE id = ${utilisateurSecuriteId}
          AND ecole_id = ${ecole.id}
          AND statut = 'ACTIF'
        LIMIT 1
      `,
      prisma.enseignant.findFirst({
        where: {
          id: enseignantId,
          ecoleId: ecole.id,
          statut: "actif",
        },
        select: { id: true },
      }),
      prisma.classe.findFirst({
        where: {
          id: classeId,
          ecoleId: ecole.id,
          statut: "active",
        },
        select: { id: true },
      }),
      prisma.anneeScolaire.findFirst({
        where: {
          id: anneeScolaireId,
          ecoleId: ecole.id,
        },
        select: { id: true },
      }),
    ]);

  if (!compte.length || !enseignant || !classe || !annee) {
    redirect("/dashboard/titulaires?erreur=introuvable");
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE titulaires_classes
      SET
        actif = 0,
        principal = 0,
        updated_at = NOW()
      WHERE ecole_id = ${ecole.id}
        AND (
          classe_id = ${classeId}
          OR utilisateur_securite_id = ${utilisateurSecuriteId}
        )
        AND annee_scolaire_id = ${anneeScolaireId}
        AND actif = 1
    `;

    await tx.$executeRaw`
      INSERT INTO titulaires_classes
      (
        ecole_id,
        utilisateur_securite_id,
        enseignant_id,
        classe_id,
        annee_scolaire_id,
        principal,
        actif,
        date_debut,
        cree_par,
        created_at,
        updated_at
      )
      VALUES
      (
        ${ecole.id},
        ${utilisateurSecuriteId},
        ${enseignantId},
        ${classeId},
        ${anneeScolaireId},
        1,
        1,
        CURDATE(),
        ${administrateur.nom},
        NOW(),
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        enseignant_id = VALUES(enseignant_id),
        principal = 1,
        actif = 1,
        date_debut = CURDATE(),
        date_fin = NULL,
        cree_par = VALUES(cree_par),
        updated_at = NOW()
    `;
  });

  revalidatePath("/dashboard/titulaires");
  revalidatePath("/dashboard/titulaire");
  redirect("/dashboard/titulaires?succes=affectation");
}

export async function desactiverTitulaire(
  formData: FormData
) {
  await exigerPermission(
    "TITULAIRES_AFFECTER",
    "Désactivation d’un titulaire"
  );

  const ecole = await obtenirOuCreerEcole();
  const id = entier(formData, "id");

  await prisma.$executeRaw`
    UPDATE titulaires_classes
    SET
      actif = 0,
      principal = 0,
      date_fin = CURDATE(),
      updated_at = NOW()
    WHERE id = ${id}
      AND ecole_id = ${ecole.id}
  `;

  revalidatePath("/dashboard/titulaires");
}
