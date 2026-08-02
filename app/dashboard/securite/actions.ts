"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { hacherMotDePasse } from "@/lib/mot-de-passe";

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "").trim();
}

function entier(formData: FormData, cle: string): number {
  const valeur = Number(formData.get(cle));

  return Number.isFinite(valeur) ? Math.trunc(valeur) : 0;
}

function normaliserCodeRole(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

async function contexte() {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();

  return {
    utilisateur,
    ecole,
  };
}

async function verifierAccesSecurite() {
  const { utilisateur, ecole } = await contexte();

  const autorise =
    utilisateur.superAdministrateur === true ||
    utilisateur.permissions?.includes("*") ||
    utilisateur.permissions?.includes("SECURITE_UTILISATEURS") ||
    utilisateur.permissions?.includes("SECURITE_ROLES") ||
    utilisateur.permissions?.includes("SECURITE_PERMISSIONS");

  if (!autorise) {
    redirect("/acces-refuse?permission=SECURITE_VOIR");
  }

  return {
    utilisateur,
    ecole,
  };
}

async function journal(
  ecoleId: number,
  utilisateurNom: string,
  action: string,
  module: string,
  description: string,
  niveau = "INFO"
) {
  await prisma.$executeRaw`
    INSERT INTO journal_audit_securite
    (
      ecole_id,
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
      ${utilisateurNom},
      ${action},
      ${module},
      ${description},
      ${niveau},
      NOW()
    )
  `.catch((erreur) => {
    console.error("Erreur journal de sécurité :", erreur);
  });
}

/* =========================================================
   UTILISATEURS
========================================================= */

export async function creerUtilisateur(formData: FormData) {
  await exigerPermission("SECURITE_AJOUTER", "app/dashboard/securite/actions.ts::creerUtilisateur");
  const { utilisateur, ecole } = await verifierAccesSecurite();

  const nom = texte(formData, "nom");
  const email = texte(formData, "email").toLowerCase();
  const telephone = texte(formData, "telephone") || null;
  const roleId = entier(formData, "role_id");
  const motDePasse =
    texte(formData, "mot_de_passe") || "Temporaire123!";

  const statutSecurite =
    texte(formData, "statut").toUpperCase() === "ACTIF"
      ? "ACTIF"
      : "INACTIF";

  const statutConnexion =
    statutSecurite === "ACTIF" ? "actif" : "inactif";

  if (!nom || !email || !roleId) {
    redirect("/dashboard/securite/utilisateurs?erreur=champs");
  }

  const roles = await prisma.$queryRaw<
    Array<{
      id: number;
      nom: string;
      code: string;
    }>
  >`
    SELECT id, nom, code
    FROM roles_securite
    WHERE id = ${roleId}
      AND ecole_id = ${ecole.id}
      AND actif = 1
    LIMIT 1
  `;

  const role = roles[0];

  if (!role) {
    redirect("/dashboard/securite/utilisateurs?erreur=role");
  }

  const existeSecurite = await prisma.$queryRaw<
    Array<{ id: number }>
  >`
    SELECT id
    FROM utilisateurs_securite
    WHERE ecole_id = ${ecole.id}
      AND LOWER(email) = LOWER(${email})
    LIMIT 1
  `;

  const existeConnexion = await prisma.utilisateur.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existeSecurite.length || existeConnexion) {
    redirect("/dashboard/securite/utilisateurs?erreur=doublon");
  }

  const motDePasseHash = await hacherMotDePasse(motDePasse);
  const roleConnexion = role.nom.trim() || role.code.toLowerCase();

  await prisma.$transaction(async (tx) => {
    const utilisateurConnexion = await tx.utilisateur.create({
      data: {
        nom,
        email,
        motDePasse: motDePasseHash,
        role: roleConnexion,
        statut: statutConnexion,
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
        ${ecole.id},
        ${nom},
        ${email},
        ${telephone},
        ${roleId},
        ${motDePasseHash},
        1,
        ${statutSecurite},
        ${utilisateur.nom},
        NOW(),
        NOW()
      )
    `;

    const comptesSecurite = await tx.$queryRaw<
      Array<{ id: number }>
    >`
      SELECT id
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecole.id}
        AND LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    const utilisateurSecuriteId = comptesSecurite[0]?.id;

    if (!utilisateurSecuriteId) {
      throw new Error(
        "Le compte de sécurité n’a pas été retrouvé après création."
      );
    }

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
        ${utilisateur.nom},
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
        ${ecole.id},
        ${utilisateurSecuriteId},
        ${utilisateur.nom},
        'CREATION_UTILISATEUR',
        'SECURITE',
        ${`Utilisateur ${email} créé et synchronisé avec le compte principal ${utilisateurConnexion.id}`},
        'IMPORTANT',
        NOW()
      )
    `;
  });

  revalidatePath("/dashboard/securite");
  revalidatePath("/dashboard/securite/utilisateurs");

  redirect("/dashboard/securite/utilisateurs?succes=creation");
}

export async function basculerUtilisateur(
  id: number,
  statutActuel: string
) {
  await exigerPermission("SECURITE_CHANGER_STATUT", "app/dashboard/securite/actions.ts::basculerUtilisateur");
  const { utilisateur, ecole } = await verifierAccesSecurite();

  const nouveauStatutSecurite =
    statutActuel.toUpperCase() === "ACTIF"
      ? "INACTIF"
      : "ACTIF";

  const nouveauStatutConnexion =
    nouveauStatutSecurite === "ACTIF"
      ? "actif"
      : "inactif";

  const comptes = await prisma.$queryRaw<
    Array<{
      email: string;
      role_code: string | null;
    }>
  >`
    SELECT
      us.email,
      rs.code AS role_code
    FROM utilisateurs_securite us
    LEFT JOIN utilisateurs_roles_securite ur
      ON ur.utilisateur_id = us.id
      AND ur.actif = 1
      AND ur.principal = 1
    LEFT JOIN roles_securite rs
      ON rs.id = ur.role_id
    WHERE us.id = ${id}
      AND us.ecole_id = ${ecole.id}
    LIMIT 1
  `;

  const compte = comptes[0];

  if (!compte) {
    redirect("/dashboard/securite/utilisateurs?erreur=introuvable");
  }

  if (compte.role_code === "SUPER_ADMIN") {
    redirect(
      "/dashboard/securite/utilisateurs?erreur=super_admin_protege"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE utilisateurs_securite
      SET
        statut = ${nouveauStatutSecurite},
        updated_at = NOW()
      WHERE id = ${id}
        AND ecole_id = ${ecole.id}
    `;

    await tx.utilisateur.updateMany({
      where: {
        email: compte.email,
      },
      data: {
        statut: nouveauStatutConnexion,
      },
    });

    if (nouveauStatutSecurite !== "ACTIF") {
      await tx.session.deleteMany({
        where: {
          utilisateur: {
            email: compte.email,
          },
        },
      });
    }
  });

  await journal(
    ecole.id,
    utilisateur.nom,
    "CHANGEMENT_STATUT_UTILISATEUR",
    "SECURITE",
    `Utilisateur ${id} passé à ${nouveauStatutSecurite}`,
    "IMPORTANT"
  );

  revalidatePath("/dashboard/securite/utilisateurs");
}

/* =========================================================
   RÔLES
========================================================= */

export async function creerRole(formData: FormData) {
  await exigerPermission("SECURITE_AJOUTER", "app/dashboard/securite/actions.ts::creerRole");
  const { utilisateur, ecole } = await verifierAccesSecurite();

  const code = normaliserCodeRole(texte(formData, "code"));
  const nom = texte(formData, "nom");
  const description = texte(formData, "description") || null;

  if (!code || !nom) {
    redirect("/dashboard/securite/roles?erreur=champs");
  }

  const roleAvecCode = await prisma.$queryRaw<
    Array<{
      id: number;
      code: string;
      nom: string;
    }>
  >`
    SELECT id, code, nom
    FROM roles_securite
    WHERE ecole_id = ${ecole.id}
      AND UPPER(code) = UPPER(${code})
    LIMIT 1
  `;

  if (roleAvecCode.length > 0) {
    redirect(
      `/dashboard/securite/roles?erreur=code_existant&roleId=${roleAvecCode[0].id}`
    );
  }

  const roleAvecNom = await prisma.$queryRaw<
    Array<{
      id: number;
      code: string;
      nom: string;
    }>
  >`
    SELECT id, code, nom
    FROM roles_securite
    WHERE ecole_id = ${ecole.id}
      AND LOWER(nom) = LOWER(${nom})
    LIMIT 1
  `;

  if (roleAvecNom.length > 0) {
    redirect(
      `/dashboard/securite/roles?erreur=nom_existant&roleId=${roleAvecNom[0].id}`
    );
  }

  await prisma.$executeRaw`
    INSERT INTO roles_securite
    (
      ecole_id,
      code,
      nom,
      description,
      systeme,
      actif,
      cree_par,
      created_at,
      updated_at
    )
    VALUES
    (
      ${ecole.id},
      ${code},
      ${nom},
      ${description},
      0,
      1,
      ${utilisateur.nom},
      NOW(),
      NOW()
    )
  `;

  await journal(
    ecole.id,
    utilisateur.nom,
    "CREATION_ROLE",
    "SECURITE",
    `Rôle ${nom} créé avec le code ${code}`,
    "IMPORTANT"
  );

  revalidatePath("/dashboard/securite/roles");

  redirect("/dashboard/securite/roles?succes=creation");
}

export async function enregistrerPermissionsRole(
  roleId: number,
  formData: FormData
) {
  await exigerPermission("SECURITE_MODIFIER", "app/dashboard/securite/actions.ts::enregistrerPermissionsRole");
  const { utilisateur, ecole } = await verifierAccesSecurite();

  const roles = await prisma.$queryRaw<
    Array<{
      id: number;
      code: string;
      nom: string;
    }>
  >`
    SELECT id, code, nom
    FROM roles_securite
    WHERE id = ${roleId}
      AND ecole_id = ${ecole.id}
    LIMIT 1
  `;

  const role = roles[0];

  if (!role) {
    redirect("/dashboard/securite/permissions?erreur=role_introuvable");
  }

  if (role.code === "SUPER_ADMIN") {
    redirect(
      "/dashboard/securite/permissions?erreur=super_admin_protege"
    );
  }

  const permissions = [
    ...new Set(
      formData
        .getAll("permissions")
        .map((valeur) => Number(valeur))
        .filter(
          (valeur) =>
            Number.isInteger(valeur) && valeur > 0
        )
    ),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM roles_permissions_securite
      WHERE role_id = ${roleId}
    `;

    for (const permissionId of permissions) {
      const permissionExiste = await tx.$queryRaw<
        Array<{ id: number }>
      >`
        SELECT id
        FROM permissions_securite
        WHERE id = ${permissionId}
          AND actif = 1
        LIMIT 1
      `;

      if (!permissionExiste.length) {
        continue;
      }

      await tx.$executeRaw`
        INSERT INTO roles_permissions_securite
        (
          role_id,
          permission_id,
          created_at
        )
        VALUES
        (
          ${roleId},
          ${permissionId},
          NOW()
        )
      `;
    }
  });

  await journal(
    ecole.id,
    utilisateur.nom,
    "MISE_A_JOUR_PERMISSIONS",
    "SECURITE",
    `${permissions.length} permission(s) attribuée(s) au rôle ${role.nom}`,
    "CRITIQUE"
  );

  revalidatePath("/dashboard/securite");
  revalidatePath("/dashboard/securite/roles");
  revalidatePath("/dashboard/securite/permissions");

  redirect(
    `/dashboard/securite/permissions?succes=enregistrement&roleId=${roleId}`
  );
}

/* =========================================================
   SESSIONS
========================================================= */

export async function fermerSession(sessionId: number) {
  await exigerPermission("SECURITE_CHANGER_STATUT", "app/dashboard/securite/actions.ts::fermerSession");
  const { utilisateur, ecole } = await verifierAccesSecurite();

  await prisma.$executeRaw`
    UPDATE sessions_securite
    SET
      statut = 'FERMEE',
      date_fin = NOW()
    WHERE id = ${sessionId}
      AND ecole_id = ${ecole.id}
  `;

  await journal(
    ecole.id,
    utilisateur.nom,
    "FERMETURE_SESSION",
    "SECURITE",
    `Session ${sessionId} fermée à distance`,
    "CRITIQUE"
  );

  revalidatePath("/dashboard/securite/sessions");
}
