"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuInitialiserLicence } from "@/lib/licence";

async function admin() {
  const u = await obtenirUtilisateurConnecte();

  if (!u?.superAdministrateur) {
    throw new Error(
      "Accès réservé au Super Administrateur DIGIGROUPE."
    );
  }

  return u;
}

function texte(fd: FormData, nom: string): string {
  return String(fd.get(nom) ?? "").trim();
}

function nombre(fd: FormData, nom: string, defaut = 0): number {
  const valeur = Number(fd.get(nom));

  if (!Number.isFinite(valeur)) {
    return defaut;
  }

  return valeur;
}

/*
|--------------------------------------------------------------------------
| Création d'un abonnement
|--------------------------------------------------------------------------
| Un abonnement nouvellement créé ne doit pas être ACTIF avant paiement.
|--------------------------------------------------------------------------
*/
export async function creerAbonnement(fd: FormData) {
  const u = await admin();

  const organisationId = nombre(fd, "organisation_id");
  const code = texte(fd, "code_abonnement").toUpperCase();
  const formule = texte(fd, "formule") || "Standard";
  const debut = texte(fd, "date_debut");
  const expiration = texte(fd, "date_expiration");
  const montant = nombre(fd, "montant");
  const devise = texte(fd, "devise") || "USD";
  const periodicite = texte(fd, "periodicite") || "ANNUEL";
  const observations = texte(fd, "observations") || null;

  if (!organisationId || !code || !debut || !expiration) {
    throw new Error("Informations d'abonnement incomplètes.");
  }

  if (montant < 0) {
    throw new Error("Le montant de l'abonnement est invalide.");
  }

  const doublon = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM abonnements_clients
    WHERE code_abonnement = ${code}
    LIMIT 1
  `;

  if (doublon.length) {
    throw new Error(`Le code ${code} existe déjà.`);
  }

  await prisma.$executeRaw`
    INSERT INTO abonnements_clients
    (
      organisation_id,
      code_abonnement,
      formule,
      date_debut,
      date_expiration,
      statut,
      montant,
      devise,
      periodicite,
      observations
    )
    VALUES
    (
      ${organisationId},
      ${code},
      ${formule},
      ${debut},
      ${expiration},
      'EN_ATTENTE',
      ${montant},
      ${devise},
      ${periodicite},
      ${observations}
    )
  `;

  const abonnement = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM abonnements_clients
    WHERE code_abonnement = ${code}
    LIMIT 1
  `;

  await prisma.$executeRaw`
    INSERT INTO historique_abonnements_clients
    (
      organisation_id,
      abonnement_id,
      utilisateur_id,
      action,
      details
    )
    VALUES
    (
      ${organisationId},
      ${abonnement[0]?.id ?? null},
      ${u.id},
      'CREATION_ABONNEMENT',
      ${`Création de ${code} en attente de paiement`}
    )
  `;

  revalidatePath("/dashboard/saas");
}

/*
|--------------------------------------------------------------------------
| Enregistrement manuel d'un paiement
|--------------------------------------------------------------------------
| Même un paiement saisi par l'administration commence en EN_ATTENTE.
| Le Super Administrateur le valide ensuite dans le tableau des paiements.
|--------------------------------------------------------------------------
*/
export async function enregistrerPaiement(fd: FormData) {
  await admin();

  const abonnementId = nombre(fd, "abonnement_id");
  const montant = nombre(fd, "montant");
  const devise = texte(fd, "devise") || "USD";
  const datePaiement = texte(fd, "date_paiement");
  const modePaiement = texte(fd, "mode_paiement") || null;
  const reference = texte(fd, "reference_paiement") || null;
  const observations = texte(fd, "observations") || null;

  if (!abonnementId || montant <= 0 || !datePaiement) {
    throw new Error("Informations de paiement incomplètes.");
  }

  const rows = await prisma.$queryRaw<
    Array<{ organisation_id: number; devise: string }>
  >`
    SELECT organisation_id, devise
    FROM abonnements_clients
    WHERE id = ${abonnementId}
    LIMIT 1
  `;

  if (!rows.length) {
    throw new Error("Abonnement introuvable.");
  }

  if (
    rows[0].devise &&
    devise.toUpperCase() !== String(rows[0].devise).toUpperCase()
  ) {
    throw new Error(
      `La devise du paiement doit être ${rows[0].devise}.`
    );
  }

  await prisma.$executeRaw`
    INSERT INTO paiements_abonnements_clients
    (
      abonnement_id,
      organisation_id,
      montant,
      devise,
      mode_paiement,
      reference_paiement,
      date_paiement,
      statut,
      observations
    )
    VALUES
    (
      ${abonnementId},
      ${Number(rows[0].organisation_id)},
      ${montant},
      ${devise},
      ${modePaiement},
      ${reference},
      ${datePaiement},
      'EN_ATTENTE',
      ${observations}
    )
  `;

  revalidatePath("/dashboard/saas");
}

/*
|--------------------------------------------------------------------------
| Validation d'un paiement d'abonnement
|--------------------------------------------------------------------------
| Résultat métier :
| Paiement VALIDE
| -> Abonnement ACTIF
| -> Licence(s) ACTIVE(S)
| -> Quota élèves commercial appliqué
|--------------------------------------------------------------------------
*/
export async function validerPaiementAbonnement(fd: FormData) {
  const u = await admin();

  const paiementId = nombre(fd, "paiement_id");
  const quotaEleves = Math.max(
    1,
    Math.trunc(nombre(fd, "quota_eleves", 480))
  );
  const observationValidation =
    texte(fd, "observation_validation") ||
    "Paiement vérifié et validé par DIGIGROUPE.";

  if (!paiementId) {
    throw new Error("Paiement invalide.");
  }

  const paiements = await prisma.$queryRaw<
    Array<{
      id: number;
      abonnement_id: number;
      organisation_id: number;
      montant: unknown;
      devise: string;
      statut: string;
      reference_paiement: string | null;
      code_abonnement: string;
      formule: string | null;
      montant_abonnement: unknown;
      devise_abonnement: string;
      date_debut: Date | null;
      date_expiration: Date | null;
    }>
  >`
    SELECT
      p.id,
      p.abonnement_id,
      p.organisation_id,
      p.montant,
      p.devise,
      p.statut,
      p.reference_paiement,
      a.code_abonnement,
      a.formule,
      a.montant AS montant_abonnement,
      a.devise AS devise_abonnement,
      a.date_debut,
      a.date_expiration
    FROM paiements_abonnements_clients p
    INNER JOIN abonnements_clients a
      ON a.id = p.abonnement_id
    WHERE p.id = ${paiementId}
    LIMIT 1
  `;

  if (!paiements.length) {
    throw new Error("Paiement introuvable.");
  }

  const paiement = paiements[0];

  if (String(paiement.statut).toUpperCase() === "VALIDE") {
    throw new Error("Ce paiement est déjà validé.");
  }

  if (String(paiement.statut).toUpperCase() === "REJETE") {
    throw new Error(
      "Un paiement rejeté ne peut pas être validé directement."
    );
  }

  const devisePaiement = String(paiement.devise || "").toUpperCase();
  const deviseAbonnement = String(
    paiement.devise_abonnement || ""
  ).toUpperCase();

  if (devisePaiement !== deviseAbonnement) {
    throw new Error(
      `Devise incohérente : paiement ${devisePaiement}, abonnement ${deviseAbonnement}.`
    );
  }

  const montantPaiement = Number(paiement.montant ?? 0);
  const montantAbonnement = Number(
    paiement.montant_abonnement ?? 0
  );

  if (montantPaiement < montantAbonnement) {
    throw new Error(
      `Paiement insuffisant : ${montantPaiement} ${devisePaiement} reçu(s) pour ${montantAbonnement} ${deviseAbonnement} attendu(s).`
    );
  }

  /*
   * L'abonnement est au niveau de l'organisation.
   * On active donc toutes les écoles actuellement rattachées à cette
   * organisation. Le schéma actuel ne contient pas d'ecole_id dans
   * abonnements_clients.
   */
  const ecoles = await prisma.$queryRaw<
    Array<{ ecole_id: number; principal: number | boolean | null }>
  >`
    SELECT ecole_id, principal
    FROM organisation_etablissements
    WHERE organisation_id = ${paiement.organisation_id}
    ORDER BY principal DESC, ecole_id ASC
  `;

  if (!ecoles.length) {
    throw new Error(
      "Aucun établissement n'est rattaché à ce client. Rattachez d'abord une école à l'organisation."
    );
  }

  /*
   * S'assurer que chaque école possède une licence avant la transaction
   * principale. Cette fonction existe déjà dans DS SCHOOL ENTERPRISE.
   */
  const licences: Array<{ id: number; ecoleId: number }> = [];

  for (const ecole of ecoles) {
    const licence = await obtenirOuInitialiserLicence(
      Number(ecole.ecole_id)
    );

    licences.push({
      id: Number(licence.id),
      ecoleId: Number(ecole.ecole_id),
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE paiements_abonnements_clients
      SET
        statut = 'VALIDE',
        observations = CONCAT(
          COALESCE(observations, ''),
          ${`\nVALIDATION DIGIGROUPE : ${observationValidation}`}
        )
      WHERE id = ${paiementId}
    `;

    await tx.$executeRaw`
      UPDATE abonnements_clients
      SET statut = 'ACTIF'
      WHERE id = ${paiement.abonnement_id}
    `;

    for (const licence of licences) {
      await tx.$executeRaw`
        UPDATE licences
        SET
          formule = ${paiement.formule || "Standard"},
          quota_personnalise = 1,
          statut = 'actif',
          max_eleves = ${quotaEleves},
          date_debut = ${paiement.date_debut},
          date_expiration = ${paiement.date_expiration},
          observations = CONCAT(
            COALESCE(observations, ''),
            ${`\nActivation SaaS via ${paiement.code_abonnement}. Quota commercial élèves : ${quotaEleves}.`}
          ),
          updated_at = NOW()
        WHERE id = ${licence.id}
      `;

      await tx.$executeRaw`
        INSERT INTO licence_historique
        (
          licence_id,
          utilisateur_id,
          action,
          ancienne_valeur,
          nouvelle_valeur,
          motif,
          created_at
        )
        VALUES
        (
          ${licence.id},
          ${u.utilisateurSecuriteId ?? null},
          'ACTIVATION_SAAS',
          'EN_ATTENTE',
          ${`ACTIF — quota élèves ${quotaEleves}`},
          ${`Paiement ${paiement.reference_paiement || "#" + paiement.id} validé pour ${paiement.code_abonnement}`},
          NOW()
        )
      `;
    }

    await tx.$executeRaw`
      INSERT INTO historique_abonnements_clients
      (
        organisation_id,
        abonnement_id,
        utilisateur_id,
        action,
        details
      )
      VALUES
      (
        ${paiement.organisation_id},
        ${paiement.abonnement_id},
        ${u.id},
        'VALIDATION_PAIEMENT_ACTIVATION',
        ${`Paiement #${paiement.id} validé. Abonnement ${paiement.code_abonnement} activé. ${licences.length} licence(s) activée(s). Quota élèves : ${quotaEleves}.`}
      )
    `;
  });

  revalidatePath("/dashboard/saas");
  revalidatePath("/dashboard/licences");
  revalidatePath("/dashboard");
}

/*
|--------------------------------------------------------------------------
| Rejet d'un paiement
|--------------------------------------------------------------------------
*/
export async function rejeterPaiementAbonnement(fd: FormData) {
  const u = await admin();

  const paiementId = nombre(fd, "paiement_id");
  const motif =
    texte(fd, "motif_rejet") ||
    "Paiement non confirmé par DIGIGROUPE.";

  if (!paiementId) {
    throw new Error("Paiement invalide.");
  }

  const rows = await prisma.$queryRaw<
    Array<{
      abonnement_id: number;
      organisation_id: number;
      statut: string;
      code_abonnement: string;
    }>
  >`
    SELECT
      p.abonnement_id,
      p.organisation_id,
      p.statut,
      a.code_abonnement
    FROM paiements_abonnements_clients p
    INNER JOIN abonnements_clients a
      ON a.id = p.abonnement_id
    WHERE p.id = ${paiementId}
    LIMIT 1
  `;

  if (!rows.length) {
    throw new Error("Paiement introuvable.");
  }

  const paiement = rows[0];

  if (String(paiement.statut).toUpperCase() === "VALIDE") {
    throw new Error(
      "Un paiement déjà validé ne peut pas être rejeté depuis cet écran."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE paiements_abonnements_clients
      SET
        statut = 'REJETE',
        observations = CONCAT(
          COALESCE(observations, ''),
          ${`\nREJET DIGIGROUPE : ${motif}`}
        )
      WHERE id = ${paiementId}
    `;

    await tx.$executeRaw`
      INSERT INTO historique_abonnements_clients
      (
        organisation_id,
        abonnement_id,
        utilisateur_id,
        action,
        details
      )
      VALUES
      (
        ${paiement.organisation_id},
        ${paiement.abonnement_id},
        ${u.id},
        'REJET_PAIEMENT',
        ${`Paiement #${paiementId} rejeté pour ${paiement.code_abonnement}. Motif : ${motif}`}
      )
    `;
  });

  revalidatePath("/dashboard/saas");
}

/*
|--------------------------------------------------------------------------
| Renouvellement administratif
|--------------------------------------------------------------------------
*/
export async function renouvelerAbonnement(fd: FormData) {
  const u = await admin();

  const id = nombre(fd, "abonnement_id");
  const nouvelle = texte(fd, "nouvelle_expiration");

  const rows = await prisma.$queryRaw<
    Array<{
      organisation_id: number;
      date_expiration: Date | null;
    }>
  >`
    SELECT organisation_id, date_expiration
    FROM abonnements_clients
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!rows.length || !nouvelle) {
    throw new Error("Renouvellement invalide.");
  }

  const r = rows[0];

  await prisma.$executeRaw`
    INSERT INTO renouvellements_abonnements
    (
      abonnement_id,
      organisation_id,
      ancienne_expiration,
      nouvelle_expiration,
      montant,
      devise,
      utilisateur_id,
      observations
    )
    VALUES
    (
      ${id},
      ${Number(r.organisation_id)},
      ${r.date_expiration},
      ${nouvelle},
      ${nombre(fd, "montant")},
      ${texte(fd, "devise") || "USD"},
      ${u.id},
      ${texte(fd, "observations") || null}
    )
  `;

  /*
   * Le renouvellement administratif ne réactive pas silencieusement un
   * abonnement non payé. L'activation reste liée à la validation du paiement.
   */
  await prisma.$executeRaw`
    UPDATE abonnements_clients
    SET date_expiration = ${nouvelle}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/saas");
}
