"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hacherMotDePasse } from "@/lib/mot-de-passe";
import { obtenirUtilisateurConnecte } from "@/lib/session";

/* =========================================================
   OUTILS
========================================================= */

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "").trim();
}

function entier(formData: FormData, cle: string): number {
  const valeur = Number(formData.get(cle));

  return Number.isFinite(valeur)
    ? Math.trunc(valeur)
    : 0;
}

function normaliserStatutSecurite(
  statut: string
): "ACTIF" | "INACTIF" | "BLOQUE" {
  const valeur = statut.trim().toUpperCase();

  if (valeur === "BLOQUE") {
    return "BLOQUE";
  }

  if (valeur === "INACTIF") {
    return "INACTIF";
  }

  return "ACTIF";
}

function convertirStatutConnexion(
  statutSecurite: string
): "actif" | "inactif" {
  return statutSecurite === "ACTIF"
    ? "actif"
    : "inactif";
}

/* =========================================================
   CONTEXTE ADMINISTRATEUR
========================================================= */

async function contexteAdministrateur() {
  const utilisateur =
    await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const peutGererUtilisateurs =
    utilisateur.superAdministrateur === true ||
    utilisateur.permissions?.includes("*") ||
    utilisateur.permissions?.includes(
      "SECURITE_UTILISATEURS"
    );

  if (!peutGererUtilisateurs) {
    redirect(
      "/acces-refuse?permission=SECURITE_UTILISATEURS"
    );
  }

  const ecole = await prisma.ecole.findFirst({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
    },
  });

  if (!ecole) {
    throw new Error(
      "Aucune école n’est configurée dans le système."
    );
  }

  return {
    utilisateur,
    ecoleId: ecole.id,
  };
}

/* =========================================================
   JOURNAL D’AUDIT
========================================================= */

async function journaliser(
  ecoleId: number,
  utilisateurSecuriteId: number | null,
  auteur: string,
  action: string,
  description: string,
  niveau = "IMPORTANT"
) {
  await prisma.$executeRaw`
    INSERT INTO journal_audit_securite
    (
      ecole_id,
      utilisateur_id,
      utilisateur_nom,
      action,
      module,
      description,
      niveau,
      created_at
    )
    VALUES
    (
      ${ecoleId},
      ${utilisateurSecuriteId},
      ${auteur},
      ${action},
      'SECURITE',
      ${description},
      ${niveau},
      NOW()
    )
  `.catch((erreur) => {
    console.error(
      "Erreur d’enregistrement du journal :",
      erreur
    );
  });
}

/* =========================================================
   CRÉATION D’UN UTILISATEUR
========================================================= */

export async function creerUtilisateurEnterprise(
  formData: FormData
) {
  await exigerPermission("SECURITE_AJOUTER", "app/dashboard/securite/utilisateurs/actions.ts::creerUtilisateurEnterprise");
  const {
    utilisateur: administrateur,
    ecoleId,
  } = await contexteAdministrateur();

  const nom = texte(formData, "nom");
  const email = texte(
    formData,
    "email"
  ).toLowerCase();
  const telephone =
    texte(formData, "telephone") || null;
  const motDePasse = texte(
    formData,
    "mot_de_passe"
  );
  const roleId = entier(formData, "role_id");

  const statutSecurite =
    normaliserStatutSecurite(
      texte(formData, "statut")
    );

  if (
    !nom ||
    !email ||
    !motDePasse ||
    !roleId
  ) {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=champs"
    );
  }

  if (motDePasse.length < 8) {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=motdepasse"
    );
  }

  const roles = await prisma.$queryRaw<
    Array<{
      id: number;
      nom: string;
      code: string;
    }>
  >`
    SELECT
      id,
      nom,
      code
    FROM roles_securite
    WHERE id = ${roleId}
      AND ecole_id = ${ecoleId}
      AND actif = 1
    LIMIT 1
  `;

  const role = roles[0];

  if (!role) {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=role"
    );
  }

  const compteConnexionExistant =
    await prisma.utilisateur.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

  const compteSecuriteExistant =
    await prisma.$queryRaw<
      Array<{
        id: number;
      }>
    >`
      SELECT id
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecoleId}
        AND LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

  if (
    compteConnexionExistant ||
    compteSecuriteExistant.length
  ) {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=doublon"
    );
  }

  const motDePasseHash =
    await hacherMotDePasse(motDePasse);

  await prisma.$transaction(async (tx) => {
    await tx.utilisateur.create({
      data: {
        nom,
        email,
        motDePasse: motDePasseHash,
        role: role.nom,
        statut: convertirStatutConnexion(
          statutSecurite
        ),
      },
    });

    await tx.$executeRaw`
      INSERT INTO utilisateurs_securite
      (
        ecole_id,
        nom,
        email,
        telephone,
        role_id,
        mot_de_passe_hash,
        doit_changer_mot_de_passe,
        statut,
        cree_par,
        created_at,
        updated_at
      )
      VALUES
      (
        ${ecoleId},
        ${nom},
        ${email},
        ${telephone},
        ${roleId},
        ${motDePasseHash},
        1,
        ${statutSecurite},
        ${administrateur.nom},
        NOW(),
        NOW()
      )
    `;

    const comptesSecurite =
      await tx.$queryRaw<
        Array<{
          id: number;
        }>
      >`
        SELECT id
        FROM utilisateurs_securite
        WHERE ecole_id = ${ecoleId}
          AND LOWER(email) = LOWER(${email})
        LIMIT 1
      `;

    const utilisateurSecuriteId =
      comptesSecurite[0]?.id;

    if (!utilisateurSecuriteId) {
      throw new Error(
        "Le compte de sécurité n’a pas été retrouvé après sa création."
      );
    }

    /*
     * Le rôle principal est enregistré dans la table
     * réellement utilisée par le moteur RBAC.
     */
    await tx.$executeRaw`
      INSERT INTO utilisateurs_roles_securite
      (
        utilisateur_id,
        role_id,
        actif,
        principal,
        date_debut,
        date_fin,
        cree_par,
        created_at,
        updated_at
      )
      VALUES
      (
        ${utilisateurSecuriteId},
        ${roleId},
        1,
        1,
        NULL,
        NULL,
        ${administrateur.nom},
        NOW(),
        NOW()
      )
    `;

    await tx.$executeRaw`
      INSERT INTO journal_audit_securite
      (
        ecole_id,
        utilisateur_id,
        utilisateur_nom,
        action,
        module,
        description,
        niveau,
        created_at
      )
      VALUES
      (
        ${ecoleId},
        ${utilisateurSecuriteId},
        ${administrateur.nom},
        'CREATION_UTILISATEUR',
        'SECURITE',
        ${`Utilisateur ${email} créé et synchronisé avec le rôle ${role.nom}`},
        'IMPORTANT',
        NOW()
      )
    `;
  });

  revalidatePath(
    "/dashboard/securite/utilisateurs"
  );
  revalidatePath("/dashboard/securite");

  redirect(
    "/dashboard/securite/utilisateurs?succes=creation"
  );
}

/* =========================================================
   MODIFICATION COMPLÈTE D’UN UTILISATEUR
========================================================= */

export async function modifierUtilisateurEnterprise(
  utilisateurSecuriteId: number,
  formData: FormData
) {
  await exigerPermission("SECURITE_MODIFIER", "app/dashboard/securite/utilisateurs/actions.ts::modifierUtilisateurEnterprise");
  const {
    utilisateur: administrateur,
    ecoleId,
  } = await contexteAdministrateur();

  const nom = texte(formData, "nom");
  const email = texte(
    formData,
    "email"
  ).toLowerCase();
  const telephone =
    texte(formData, "telephone") || null;
  const roleId = entier(formData, "role_id");

  const statutSecurite =
    normaliserStatutSecurite(
      texte(formData, "statut")
    );

  if (!nom || !email || !roleId) {
    redirect(
      `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}?erreur=champs`
    );
  }

  const roles = await prisma.$queryRaw<
    Array<{
      nom: string;
      code: string;
    }>
  >`
    SELECT
      nom,
      code
    FROM roles_securite
    WHERE id = ${roleId}
      AND ecole_id = ${ecoleId}
      AND actif = 1
    LIMIT 1
  `;

  const role = roles[0];

  if (!role) {
    redirect(
      `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}?erreur=role`
    );
  }

  const comptes = await prisma.$queryRaw<
    Array<{
      email: string;
      role_id: number;
    }>
  >`
    SELECT
      email,
      role_id
    FROM utilisateurs_securite
    WHERE id = ${utilisateurSecuriteId}
      AND ecole_id = ${ecoleId}
    LIMIT 1
  `;

  const compte = comptes[0];

  if (!compte) {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=introuvable"
    );
  }

  const doublonPrincipal =
    await prisma.utilisateur.findFirst({
      where: {
        email,
        NOT: {
          email: compte.email,
        },
      },
      select: {
        id: true,
      },
    });

  const doublonSecurite =
    await prisma.$queryRaw<
      Array<{
        id: number;
      }>
    >`
      SELECT id
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecoleId}
        AND LOWER(email) = LOWER(${email})
        AND id <> ${utilisateurSecuriteId}
      LIMIT 1
    `;

  if (
    doublonPrincipal ||
    doublonSecurite.length
  ) {
    redirect(
      `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}?erreur=doublon`
    );
  }

  const roleModifie =
    Number(compte.role_id) !== roleId;

  await prisma.$transaction(async (tx) => {
    await tx.utilisateur.updateMany({
      where: {
        email: compte.email,
      },
      data: {
        nom,
        email,
        role: role.nom,
        statut: convertirStatutConnexion(
          statutSecurite
        ),
      },
    });

    await tx.$executeRaw`
      UPDATE utilisateurs_securite
      SET
        nom = ${nom},
        email = ${email},
        telephone = ${telephone},
        role_id = ${roleId},
        statut = ${statutSecurite},
        updated_at = NOW()
      WHERE id = ${utilisateurSecuriteId}
        AND ecole_id = ${ecoleId}
    `;

    /*
     * Le rôle est remplacé uniquement s’il a réellement changé.
     */
    if (roleModifie) {
      await tx.$executeRaw`
        UPDATE utilisateurs_roles_securite
        SET
          actif = 0,
          principal = 0,
          updated_at = NOW()
        WHERE utilisateur_id = ${utilisateurSecuriteId}
      `;

      await tx.$executeRaw`
        INSERT INTO utilisateurs_roles_securite
        (
          utilisateur_id,
          role_id,
          actif,
          principal,
          date_debut,
          date_fin,
          cree_par,
          created_at,
          updated_at
        )
        VALUES
        (
          ${utilisateurSecuriteId},
          ${roleId},
          1,
          1,
          NULL,
          NULL,
          ${administrateur.nom},
          NOW(),
          NOW()
        )
        ON DUPLICATE KEY UPDATE
          actif = 1,
          principal = 1,
          date_debut = NULL,
          date_fin = NULL,
          updated_at = NOW()
      `;

      /*
       * Les exceptions personnelles de l’ancien rôle
       * sont supprimées lors du changement de rôle.
       */
      await tx.$executeRaw`
        DELETE FROM utilisateurs_permissions_securite
        WHERE utilisateur_id = ${utilisateurSecuriteId}
      `;
    }

    /*
     * Fermer les sessions si le compte devient
     * inactif ou bloqué.
     */
    if (statutSecurite !== "ACTIF") {
      const comptePrincipal =
        await tx.utilisateur.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
          },
        });

      if (comptePrincipal) {
        await tx.session.deleteMany({
          where: {
            utilisateurId:
              comptePrincipal.id,
          },
        });
      }
    }
  });

  await journaliser(
    ecoleId,
    utilisateurSecuriteId,
    administrateur.nom,
    "MODIFICATION_UTILISATEUR",
    roleModifie
      ? `Compte ${email} modifié et rôle remplacé par ${role.nom}`
      : `Compte ${email} modifié`,
    "IMPORTANT"
  );

  revalidatePath(
    "/dashboard/securite/utilisateurs"
  );
  revalidatePath(
    `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}`
  );

  redirect(
    `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}?succes=modification`
  );
}

/* =========================================================
   RÉINITIALISATION DU MOT DE PASSE
========================================================= */

export async function reinitialiserMotDePasseUtilisateur(
  utilisateurSecuriteId: number,
  formData: FormData
) {
  await exigerPermission("SECURITE_MODIFIER", "app/dashboard/securite/utilisateurs/actions.ts::reinitialiserMotDePasseUtilisateur");
  const {
    utilisateur: administrateur,
    ecoleId,
  } = await contexteAdministrateur();

  const nouveauMotDePasse = texte(
    formData,
    "nouveau_mot_de_passe"
  );

  if (
    !nouveauMotDePasse ||
    nouveauMotDePasse.length < 8
  ) {
    redirect(
      `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}?erreur=motdepasse`
    );
  }

  const comptes = await prisma.$queryRaw<
    Array<{
      email: string;
    }>
  >`
    SELECT email
    FROM utilisateurs_securite
    WHERE id = ${utilisateurSecuriteId}
      AND ecole_id = ${ecoleId}
    LIMIT 1
  `;

  const compte = comptes[0];

  if (!compte) {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=introuvable"
    );
  }

  const hash =
    await hacherMotDePasse(
      nouveauMotDePasse
    );

  await prisma.$transaction(async (tx) => {
    await tx.utilisateur.updateMany({
      where: {
        email: compte.email,
      },
      data: {
        motDePasse: hash,
      },
    });

    await tx.$executeRaw`
      UPDATE utilisateurs_securite
      SET
        mot_de_passe_hash = ${hash},
        doit_changer_mot_de_passe = 1,
        tentatives_echouees = 0,
        verrouille_jusqua = NULL,
        updated_at = NOW()
      WHERE id = ${utilisateurSecuriteId}
        AND ecole_id = ${ecoleId}
    `;

    const comptePrincipal =
      await tx.utilisateur.findUnique({
        where: {
          email: compte.email,
        },
        select: {
          id: true,
        },
      });

    if (comptePrincipal) {
      await tx.session.deleteMany({
        where: {
          utilisateurId:
            comptePrincipal.id,
        },
      });
    }
  });

  await journaliser(
    ecoleId,
    utilisateurSecuriteId,
    administrateur.nom,
    "REINITIALISATION_MOT_DE_PASSE",
    `Mot de passe du compte ${compte.email} réinitialisé`,
    "CRITIQUE"
  );

  revalidatePath(
    `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}`
  );

  redirect(
    `/dashboard/securite/utilisateurs/${utilisateurSecuriteId}?succes=motdepasse`
  );
}

/* =========================================================
   SYNCHRONISATION D’UN ANCIEN COMPTE
========================================================= */

async function synchroniserCompteExistant(
  comptePrincipal: {
    id: number;
    nom: string;
    email: string;
    motDePasse: string;
    role: string;
    statut: string;
  },
  ecoleId: number,
  roleId: number,
  auteur: string
) {
  const statutSecurite =
    comptePrincipal.statut === "actif"
      ? "ACTIF"
      : "INACTIF";

  await prisma.$executeRaw`
    INSERT INTO utilisateurs_securite
    (
      ecole_id,
      nom,
      email,
      role_id,
      mot_de_passe_hash,
      doit_changer_mot_de_passe,
      statut,
      cree_par,
      created_at,
      updated_at
    )
    VALUES
    (
      ${ecoleId},
      ${comptePrincipal.nom},
      ${comptePrincipal.email.toLowerCase()},
      ${roleId},
      ${comptePrincipal.motDePasse},
      0,
      ${statutSecurite},
      ${auteur},
      NOW(),
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      nom = VALUES(nom),
      role_id = VALUES(role_id),
      mot_de_passe_hash =
        VALUES(mot_de_passe_hash),
      statut = VALUES(statut),
      updated_at = NOW()
  `;

  const comptesSecurite =
    await prisma.$queryRaw<
      Array<{
        id: number;
      }>
    >`
      SELECT id
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecoleId}
        AND LOWER(email) =
          LOWER(${comptePrincipal.email})
      LIMIT 1
    `;

  const utilisateurSecuriteId =
    comptesSecurite[0]?.id;

  if (!utilisateurSecuriteId) {
    throw new Error(
      `Impossible de synchroniser ${comptePrincipal.email}.`
    );
  }

  await prisma.$executeRaw`
    UPDATE utilisateurs_roles_securite
    SET
      actif = 0,
      principal = 0,
      updated_at = NOW()
    WHERE utilisateur_id =
      ${utilisateurSecuriteId}
  `;

  await prisma.$executeRaw`
    INSERT INTO utilisateurs_roles_securite
    (
      utilisateur_id,
      role_id,
      actif,
      principal,
      date_debut,
      date_fin,
      cree_par,
      created_at,
      updated_at
    )
    VALUES
    (
      ${utilisateurSecuriteId},
      ${roleId},
      1,
      1,
      NULL,
      NULL,
      ${auteur},
      NOW(),
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      actif = 1,
      principal = 1,
      date_debut = NULL,
      date_fin = NULL,
      updated_at = NOW()
  `;
}

/* =========================================================
   SYNCHRONISATION GLOBALE
========================================================= */

export async function synchroniserTousLesUtilisateurs() {
  await exigerPermission("SECURITE_MODIFIER", "app/dashboard/securite/utilisateurs/actions.ts::synchroniserTousLesUtilisateurs");
  const {
    utilisateur: administrateur,
    ecoleId,
  } = await contexteAdministrateur();

  const comptesPrincipaux =
    await prisma.utilisateur.findMany();

  const roles = await prisma.$queryRaw<
    Array<{
      id: number;
      code: string;
      nom: string;
    }>
  >`
    SELECT
      id,
      code,
      nom
    FROM roles_securite
    WHERE ecole_id = ${ecoleId}
      AND actif = 1
    ORDER BY systeme DESC, nom ASC
  `;

  if (!roles.length) {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=roles_absents"
    );
  }

  const roleParNom = new Map<string, number>();
  const roleParCode = new Map<string, number>();

  for (const role of roles) {
    roleParNom.set(
      role.nom.toLowerCase(),
      role.id
    );

    roleParCode.set(
      role.code.toLowerCase(),
      role.id
    );
  }

  const roleDefaut =
    roleParCode.get("lecture_seule") ??
    roleParCode.get("enseignant") ??
    roles[0].id;

  let nombreSynchronises = 0;

  for (const compte of comptesPrincipaux) {
    const roleActuel =
      compte.role.trim().toLowerCase();

    const roleId =
      roleParNom.get(roleActuel) ??
      roleParCode.get(roleActuel) ??
      roleDefaut;

    await synchroniserCompteExistant(
      compte,
      ecoleId,
      roleId,
      administrateur.nom
    );

    nombreSynchronises += 1;
  }

  await journaliser(
    ecoleId,
    administrateur.utilisateurSecuriteId ??
      null,
    administrateur.nom,
    "SYNCHRONISATION_GLOBALE",
    `${nombreSynchronises} compte(s) synchronisé(s)`,
    "IMPORTANT"
  );

  revalidatePath(
    "/dashboard/securite/utilisateurs"
  );
  revalidatePath("/dashboard/securite");

  redirect(
    `/dashboard/securite/utilisateurs?succes=synchronisation&nombre=${nombreSynchronises}`
  );
}
