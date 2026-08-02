"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "").trim();
}

function entier(formData: FormData, cle: string): number {
  const valeur = Number(formData.get(cle));
  return Number.isFinite(valeur) ? Math.trunc(valeur) : 0;
}

function booleen(formData: FormData, cle: string): number {
  return formData.get(cle) === "on" ? 1 : 0;
}

function normaliserIdentifiant(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.+/g, ".")
    .toLowerCase()
    .slice(0, 60);
}

function genererMotDePasseTemporaire(): string {
  return crypto.randomBytes(6).toString("base64url") + "A1!";
}

async function contexte() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  return { utilisateur, ecole };
}

async function identifiantUnique(
  ecoleId: number,
  identifiantDemande: string,
  parentIdIgnore?: number
): Promise<string> {
  const base = normaliserIdentifiant(identifiantDemande) || `parent.${Date.now()}`;

  const existe = async (identifiant: string) => {
    const lignes = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM comptes_parents
      WHERE ecole_id = ${ecoleId}
        AND identifiant = ${identifiant}
        AND (${parentIdIgnore ?? 0} = 0 OR parent_id <> ${parentIdIgnore ?? 0})
      LIMIT 1
    `;
    return lignes.length > 0;
  };

  if (!(await existe(base))) return base;

  for (let index = 1; index <= 999; index += 1) {
    const candidat = `${base}.${String(index).padStart(3, "0")}`;
    if (!(await existe(candidat))) return candidat;
  }

  return `${base}.${Date.now()}`;
}

export async function creerParent(formData: FormData) {
  await exigerPermission("PARENTS_AJOUTER", "app/dashboard/parents/actions.ts::creerParent");
  const { utilisateur, ecole } = await contexte();

  const nom = texte(formData, "nom");
  const postnom = texte(formData, "postnom") || null;
  const prenom = texte(formData, "prenom");
  const sexe = texte(formData, "sexe") || null;
  const dateNaissance = texte(formData, "date_naissance") || null;
  const nationalite = texte(formData, "nationalite") || "Congolaise";
  const profession = texte(formData, "profession") || null;
  const employeur = texte(formData, "employeur") || null;
  const fonction = texte(formData, "fonction") || null;
  const telephonePrincipal = texte(formData, "telephone_principal");
  const telephoneSecondaire = texte(formData, "telephone_secondaire") || null;
  const whatsapp = texte(formData, "whatsapp") || null;
  const email = texte(formData, "email") || null;
  const province = texte(formData, "province") || null;
  const ville = texte(formData, "ville") || null;
  const commune = texte(formData, "commune") || null;
  const quartier = texte(formData, "quartier") || null;
  const avenue = texte(formData, "avenue") || null;
  const numeroAdresse = texte(formData, "numero_adresse") || null;
  const pieceIdentiteType = texte(formData, "piece_identite_type") || null;
  const pieceIdentiteNumero = texte(formData, "piece_identite_numero") || null;
  const actif = booleen(formData, "actif");

  if (!nom || !prenom || !telephonePrincipal) {
    redirect("/dashboard/parents/nouveau?erreur=champs");
  }

  const identifiantDemande =
    texte(formData, "identifiant") ||
    `${prenom}.${nom}`;

  const identifiant = await identifiantUnique(ecole.id, identifiantDemande);
  const motDePasseTemporaire =
    texte(formData, "mot_de_passe_temporaire") ||
    genererMotDePasseTemporaire();

  const motDePasseHash = crypto
    .createHash("sha256")
    .update(motDePasseTemporaire)
    .digest("hex");

  const parentId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO parents
      (
        ecole_id, nom, postnom, prenom, sexe, date_naissance,
        nationalite, profession, employeur, fonction,
        telephone_principal, telephone_secondaire, whatsapp, email,
        province, ville, commune, quartier, avenue, numero_adresse,
        piece_identite_type, piece_identite_numero, actif,
        cree_par, created_at, updated_at
      )
      VALUES
      (
        ${ecole.id}, ${nom}, ${postnom}, ${prenom}, ${sexe}, ${dateNaissance},
        ${nationalite}, ${profession}, ${employeur}, ${fonction},
        ${telephonePrincipal}, ${telephoneSecondaire}, ${whatsapp}, ${email},
        ${province}, ${ville}, ${commune}, ${quartier}, ${avenue}, ${numeroAdresse},
        ${pieceIdentiteType}, ${pieceIdentiteNumero}, ${actif},
        ${utilisateur.nom}, NOW(), NOW()
      )
    `;

    const lignes = await tx.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM parents
      WHERE ecole_id = ${ecole.id}
        AND telephone_principal = ${telephonePrincipal}
      ORDER BY id DESC
      LIMIT 1
    `;

    const idParent = lignes[0]?.id;
    if (!idParent) throw new Error("Parent introuvable après création.");

    await tx.$executeRaw`
      INSERT INTO comptes_parents
      (
        ecole_id, parent_id, identifiant, email_connexion,
        mot_de_passe_hash, doit_changer_mot_de_passe,
        statut, cree_par, created_at, updated_at
      )
      VALUES
      (
        ${ecole.id}, ${idParent}, ${identifiant}, ${email},
        ${motDePasseHash}, 1,
        ${actif ? "ACTIF" : "INACTIF"}, ${utilisateur.nom}, NOW(), NOW()
      )
    `;

    await tx.$executeRaw`
      INSERT INTO journal_parents
      (
        ecole_id, parent_id, action, description,
        utilisateur_nom, niveau, created_at
      )
      VALUES
      (
        ${ecole.id}, ${idParent}, 'CREATION_PARENT',
        ${`Parent créé avec l'identifiant ${identifiant}`},
        ${utilisateur.nom}, 'INFO', NOW()
      )
    `;

    return idParent;
  });

  revalidatePath("/dashboard/parents");
  redirect(
    `/dashboard/parents/${parentId}?succes=creation&identifiant=${encodeURIComponent(
      identifiant
    )}&motdepasse=${encodeURIComponent(motDePasseTemporaire)}`
  );
}

export async function modifierParent(parentId: number, formData: FormData) {
  await exigerPermission("PARENTS_MODIFIER", "app/dashboard/parents/actions.ts::modifierParent");
  const { utilisateur, ecole } = await contexte();

  const nom = texte(formData, "nom");
  const postnom = texte(formData, "postnom") || null;
  const prenom = texte(formData, "prenom");
  const sexe = texte(formData, "sexe") || null;
  const dateNaissance = texte(formData, "date_naissance") || null;
  const nationalite = texte(formData, "nationalite") || "Congolaise";
  const profession = texte(formData, "profession") || null;
  const employeur = texte(formData, "employeur") || null;
  const fonction = texte(formData, "fonction") || null;
  const telephonePrincipal = texte(formData, "telephone_principal");
  const telephoneSecondaire = texte(formData, "telephone_secondaire") || null;
  const whatsapp = texte(formData, "whatsapp") || null;
  const email = texte(formData, "email") || null;
  const province = texte(formData, "province") || null;
  const ville = texte(formData, "ville") || null;
  const commune = texte(formData, "commune") || null;
  const quartier = texte(formData, "quartier") || null;
  const avenue = texte(formData, "avenue") || null;
  const numeroAdresse = texte(formData, "numero_adresse") || null;
  const pieceIdentiteType = texte(formData, "piece_identite_type") || null;
  const pieceIdentiteNumero = texte(formData, "piece_identite_numero") || null;
  const actif = booleen(formData, "actif");

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE parents
      SET
        nom = ${nom},
        postnom = ${postnom},
        prenom = ${prenom},
        sexe = ${sexe},
        date_naissance = ${dateNaissance},
        nationalite = ${nationalite},
        profession = ${profession},
        employeur = ${employeur},
        fonction = ${fonction},
        telephone_principal = ${telephonePrincipal},
        telephone_secondaire = ${telephoneSecondaire},
        whatsapp = ${whatsapp},
        email = ${email},
        province = ${province},
        ville = ${ville},
        commune = ${commune},
        quartier = ${quartier},
        avenue = ${avenue},
        numero_adresse = ${numeroAdresse},
        piece_identite_type = ${pieceIdentiteType},
        piece_identite_numero = ${pieceIdentiteNumero},
        actif = ${actif},
        modifie_par = ${utilisateur.nom},
        updated_at = NOW()
      WHERE id = ${parentId}
        AND ecole_id = ${ecole.id}
    `;

    await tx.$executeRaw`
      UPDATE comptes_parents
      SET
        email_connexion = ${email},
        statut = ${actif ? "ACTIF" : "INACTIF"},
        updated_at = NOW()
      WHERE parent_id = ${parentId}
        AND ecole_id = ${ecole.id}
    `;

    await tx.$executeRaw`
      INSERT INTO journal_parents
      (
        ecole_id, parent_id, action, description,
        utilisateur_nom, niveau, created_at
      )
      VALUES
      (
        ${ecole.id}, ${parentId}, 'MODIFICATION_PARENT',
        'Informations du parent modifiées',
        ${utilisateur.nom}, 'INFO', NOW()
      )
    `;
  });

  revalidatePath("/dashboard/parents");
  revalidatePath(`/dashboard/parents/${parentId}`);
  redirect(`/dashboard/parents/${parentId}?succes=modification`);
}

export async function lierEleve(parentId: number, formData: FormData) {
  await exigerPermission("PARENTS_MODIFIER", "app/dashboard/parents/actions.ts::lierEleve");
  const { utilisateur, ecole } = await contexte();

  const eleveId = entier(formData, "eleve_id");
  const lienParente = texte(formData, "lien_parente") || "AUTRE";
  const principal = booleen(formData, "principal");
  const autoriseFinances = booleen(formData, "autorise_finances");
  const autoriseAcademique = booleen(formData, "autorise_academique");
  const autoriseCommunication = booleen(formData, "autorise_communication");
  const responsableLegal = booleen(formData, "responsable_legal");

  if (!eleveId) {
    redirect(`/dashboard/parents/${parentId}?erreur=eleve`);
  }

  await prisma.$transaction(async (tx) => {
    if (principal) {
      await tx.$executeRaw`
        UPDATE parents_eleves
        SET principal = 0
        WHERE eleve_id = ${eleveId}
          AND ecole_id = ${ecole.id}
      `;
    }

    await tx.$executeRaw`
      INSERT INTO parents_eleves
      (
        ecole_id, parent_id, eleve_id, lien_parente,
        principal, responsable_legal,
        autorise_finances, autorise_academique,
        autorise_communication, created_at, updated_at
      )
      VALUES
      (
        ${ecole.id}, ${parentId}, ${eleveId}, ${lienParente},
        ${principal}, ${responsableLegal},
        ${autoriseFinances}, ${autoriseAcademique},
        ${autoriseCommunication}, NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE
        lien_parente = VALUES(lien_parente),
        principal = VALUES(principal),
        responsable_legal = VALUES(responsable_legal),
        autorise_finances = VALUES(autorise_finances),
        autorise_academique = VALUES(autorise_academique),
        autorise_communication = VALUES(autorise_communication),
        updated_at = NOW()
    `;

    await tx.$executeRaw`
      INSERT INTO journal_parents
      (
        ecole_id, parent_id, action, description,
        utilisateur_nom, niveau, created_at
      )
      VALUES
      (
        ${ecole.id}, ${parentId}, 'LIAISON_ELEVE',
        ${`Élève ${eleveId} lié comme ${lienParente}`},
        ${utilisateur.nom}, 'INFO', NOW()
      )
    `;
  });

  revalidatePath(`/dashboard/parents/${parentId}`);
  redirect(`/dashboard/parents/${parentId}?succes=liaison`);
}

export async function retirerEleve(parentId: number, eleveId: number) {
  await exigerPermission("PARENTS_SUPPRIMER", "app/dashboard/parents/actions.ts::retirerEleve");
  const { utilisateur, ecole } = await contexte();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM parents_eleves
      WHERE parent_id = ${parentId}
        AND eleve_id = ${eleveId}
        AND ecole_id = ${ecole.id}
    `;

    await tx.$executeRaw`
      INSERT INTO journal_parents
      (
        ecole_id, parent_id, action, description,
        utilisateur_nom, niveau, created_at
      )
      VALUES
      (
        ${ecole.id}, ${parentId}, 'RETRAIT_ELEVE',
        ${`Élève ${eleveId} retiré du compte parent`},
        ${utilisateur.nom}, 'AVERTISSEMENT', NOW()
      )
    `;
  });

  revalidatePath(`/dashboard/parents/${parentId}`);
}

export async function reinitialiserMotDePasse(
  parentId: number,
  formData: FormData
) {
  await exigerPermission("PARENTS_MODIFIER", "app/dashboard/parents/actions.ts::reinitialiserMotDePasse");
  const { utilisateur, ecole } = await contexte();

  const motDePasse =
    texte(formData, "nouveau_mot_de_passe") ||
    genererMotDePasseTemporaire();

  const hash = crypto
    .createHash("sha256")
    .update(motDePasse)
    .digest("hex");

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE comptes_parents
      SET
        mot_de_passe_hash = ${hash},
        doit_changer_mot_de_passe = 1,
        tentatives_echouees = 0,
        verrouille_jusqua = NULL,
        updated_at = NOW()
      WHERE parent_id = ${parentId}
        AND ecole_id = ${ecole.id}
    `;

    await tx.$executeRaw`
      INSERT INTO journal_parents
      (
        ecole_id, parent_id, action, description,
        utilisateur_nom, niveau, created_at
      )
      VALUES
      (
        ${ecole.id}, ${parentId}, 'REINITIALISATION_MOT_DE_PASSE',
        'Mot de passe du compte parent réinitialisé',
        ${utilisateur.nom}, 'CRITIQUE', NOW()
      )
    `;
  });

  revalidatePath(`/dashboard/parents/${parentId}`);
  redirect(
    `/dashboard/parents/${parentId}?succes=motdepasse&motdepasse=${encodeURIComponent(
      motDePasse
    )}`
  );
}

export async function basculerCompte(parentId: number, actifActuel: boolean) {
  await exigerPermission("PARENTS_CHANGER_STATUT", "app/dashboard/parents/actions.ts::basculerCompte");
  const { utilisateur, ecole } = await contexte();
  const nouveauStatut = actifActuel ? "INACTIF" : "ACTIF";
  const actif = actifActuel ? 0 : 1;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE parents
      SET actif = ${actif}, updated_at = NOW()
      WHERE id = ${parentId}
        AND ecole_id = ${ecole.id}
    `;

    await tx.$executeRaw`
      UPDATE comptes_parents
      SET statut = ${nouveauStatut}, updated_at = NOW()
      WHERE parent_id = ${parentId}
        AND ecole_id = ${ecole.id}
    `;

    await tx.$executeRaw`
      INSERT INTO journal_parents
      (
        ecole_id, parent_id, action, description,
        utilisateur_nom, niveau, created_at
      )
      VALUES
      (
        ${ecole.id}, ${parentId}, 'CHANGEMENT_STATUT',
        ${`Compte parent passé à ${nouveauStatut}`},
        ${utilisateur.nom}, 'AVERTISSEMENT', NOW()
      )
    `;
  });

  revalidatePath("/dashboard/parents");
  revalidatePath(`/dashboard/parents/${parentId}`);
}
