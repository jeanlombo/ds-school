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

  return Number.isFinite(valeur)
    ? valeur
    : defaut;
}

function dateFinJour(date: Date | null) {
  if (!date) return null;

  const d = new Date(date);
  d.setHours(23, 59, 59, 999);

  return d;
}

export async function creerAbonnement(fd: FormData) {
  const u = await admin();

  const organisationId = nombre(fd, "organisation_id");
  const code = texte(fd, "code_abonnement").toUpperCase();
  const formule = texte(fd, "formule") || "Standard";
  const debut = texte(fd, "date_debut");
  const expiration = texte(fd, "date_expiration");
  const echeancePaiement = texte(fd, "date_echeance_paiement");
  const montant = nombre(fd, "montant");
  const devise = texte(fd, "devise") || "USD";
  const periodicite = texte(fd, "periodicite") || "ANNUEL";
  const observations = texte(fd, "observations") || null;

  if (
    !organisationId ||
    !code ||
    !debut ||
    !expiration ||
    !echeancePaiement
  ) {
    throw new Error(
      "Informations d'abonnement incomplètes."
    );
  }

  if (montant <= 0) {
    throw new Error(
      "Le montant de l'abonnement doit être supérieur à zéro."
    );
  }

  const debutDate = new Date(`${debut}T00:00:00`);
  const expirationDate = new Date(`${expiration}T00:00:00`);
  const echeanceDate = new Date(`${echeancePaiement}T00:00:00`);

  if (
    Number.isNaN(debutDate.getTime()) ||
    Number.isNaN(expirationDate.getTime()) ||
    Number.isNaN(echeanceDate.getTime())
  ) {
    throw new Error("Une date renseignée est invalide.");
  }

  if (echeanceDate < debutDate) {
    throw new Error(
      "L'échéance de paiement ne peut pas être antérieure au début de l'abonnement."
    );
  }

  const doublon = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM abonnements_clients
    WHERE code_abonnement = ${code}
    LIMIT 1
  `;

  if (doublon.length) {
    throw new Error(
      `Le code ${code} existe déjà.`
    );
  }

  await prisma.$executeRaw`
    INSERT INTO abonnements_clients
    (
      organisation_id,
      code_abonnement,
      formule,
      date_debut,
      date_expiration,
      date_echeance_paiement,
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
      ${echeancePaiement},
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
      ${`Création de ${code}. Montant ${montant} ${devise}. Échéance de paiement : ${echeancePaiement}.`}
    )
  `;

  revalidatePath("/dashboard/saas");
}

export async function enregistrerPaiement(fd: FormData) {
  await admin();

  const abonnementId = nombre(fd, "abonnement_id");
  const montant = nombre(fd, "montant");
  const devise = texte(fd, "devise") || "USD";
  const datePaiement = texte(fd, "date_paiement");
  const modePaiement = texte(fd, "mode_paiement") || null;
  const reference = texte(fd, "reference_paiement") || null;
  const observations = texte(fd, "observations") || null;

  if (
    !abonnementId ||
    montant <= 0 ||
    !datePaiement
  ) {
    throw new Error(
      "Informations de paiement incomplètes."
    );
  }

  const rows = await prisma.$queryRaw<
    Array<{
      organisation_id: number;
      montant: unknown;
      devise: string;
      date_echeance_paiement: Date | null;
      total_paye: unknown;
      total_en_attente: unknown;
    }>
  >`
    SELECT
      a.organisation_id,
      a.montant,
      a.devise,
      a.date_echeance_paiement,

      COALESCE((
        SELECT SUM(p.montant)
        FROM paiements_abonnements_clients p
        WHERE p.abonnement_id = a.id
          AND UPPER(p.statut) = 'VALIDE'
      ), 0) total_paye,

      COALESCE((
        SELECT SUM(p.montant)
        FROM paiements_abonnements_clients p
        WHERE p.abonnement_id = a.id
          AND UPPER(p.statut) = 'EN_ATTENTE'
      ), 0) total_en_attente

    FROM abonnements_clients a
    WHERE a.id = ${abonnementId}
    LIMIT 1
  `;

  if (!rows.length) {
    throw new Error("Abonnement introuvable.");
  }

  const abonnement = rows[0];

  if (
    devise.toUpperCase() !==
    String(abonnement.devise).toUpperCase()
  ) {
    throw new Error(
      `La devise du paiement doit être ${abonnement.devise}.`
    );
  }

  const echeance = dateFinJour(
    abonnement.date_echeance_paiement
  );

  if (
    echeance &&
    new Date().getTime() > echeance.getTime()
  ) {
    throw new Error(
      "L'échéance de paiement est dépassée. Prolongez d'abord l'échéance."
    );
  }

  const disponible = Math.max(
    0,
    Number(abonnement.montant ?? 0) -
      Number(abonnement.total_paye ?? 0) -
      Number(abonnement.total_en_attente ?? 0)
  );

  if (montant > disponible + 0.00001) {
    throw new Error(
      `Ce versement dépasse le solde disponible (${disponible} ${abonnement.devise}).`
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
      ${Number(abonnement.organisation_id)},
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

export async function validerPaiementAbonnement(
  fd: FormData
) {
  const u = await admin();

  const paiementId = nombre(fd, "paiement_id");

  const quotaEleves = Math.max(
    1,
    Math.trunc(
      nombre(fd, "quota_eleves", 480)
    )
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
      date_echeance_paiement: Date | null;
      total_valide_avant: unknown;
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
      a.date_expiration,
      a.date_echeance_paiement,

      COALESCE((
        SELECT SUM(p2.montant)
        FROM paiements_abonnements_clients p2
        WHERE p2.abonnement_id = p.abonnement_id
          AND UPPER(p2.statut) = 'VALIDE'
      ), 0) AS total_valide_avant

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

  if (
    String(paiement.statut).toUpperCase() ===
    "VALIDE"
  ) {
    throw new Error(
      "Ce paiement est déjà validé."
    );
  }

  if (
    String(paiement.statut).toUpperCase() ===
    "REJETE"
  ) {
    throw new Error(
      "Un paiement rejeté ne peut pas être validé directement."
    );
  }

  const devisePaiement =
    String(paiement.devise || "").toUpperCase();

  const deviseAbonnement =
    String(
      paiement.devise_abonnement || ""
    ).toUpperCase();

  if (devisePaiement !== deviseAbonnement) {
    throw new Error(
      `Devise incohérente : paiement ${devisePaiement}, abonnement ${deviseAbonnement}.`
    );
  }

  const echeance = dateFinJour(
    paiement.date_echeance_paiement
  );

  if (
    echeance &&
    new Date().getTime() > echeance.getTime()
  ) {
    throw new Error(
      "Échéance dépassée : prolongez l'échéance avant de valider ce versement."
    );
  }

  const montantVersement =
    Number(paiement.montant ?? 0);

  const totalAvant =
    Number(paiement.total_valide_avant ?? 0);

  const totalApres =
    totalAvant + montantVersement;

  const montantAbonnement =
    Number(paiement.montant_abonnement ?? 0);

  const soldeApres = Math.max(
    0,
    montantAbonnement - totalApres
  );

  const complet =
    totalApres + 0.00001 >= montantAbonnement;

  /*
   * 1) Toujours valider le versement.
   * 2) Si le cumul reste insuffisant :
   *    l'abonnement reste EN_ATTENTE et aucune licence n'est activée.
   */
  if (!complet) {
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
        SET statut = 'EN_ATTENTE'
        WHERE id = ${paiement.abonnement_id}
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
          'VALIDATION_PAIEMENT_PARTIEL',
          ${`Versement #${paiement.id} validé : ${montantVersement} ${devisePaiement}. Cumul validé : ${totalApres} ${devisePaiement}. Solde restant : ${soldeApres} ${devisePaiement}.`}
        )
      `;
    });

    revalidatePath("/dashboard/saas");

    return;
  }

  const ecoles = await prisma.$queryRaw<
    Array<{
      ecole_id: number;
      principal: number | boolean | null;
    }>
  >`
    SELECT
      ecole_id,
      principal
    FROM organisation_etablissements
    WHERE organisation_id = ${paiement.organisation_id}
    ORDER BY principal DESC, ecole_id ASC
  `;

  if (!ecoles.length) {
    throw new Error(
      "Le montant est soldé, mais aucun établissement n'est rattaché à ce client. Rattachez d'abord une école."
    );
  }

  const licences: Array<{
    id: number;
    ecoleId: number;
  }> = [];

  for (const ecole of ecoles) {
    const licence =
      await obtenirOuInitialiserLicence(
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
            ${`\nActivation SaaS via ${paiement.code_abonnement}. Paiement cumulé soldé. Quota élèves : ${quotaEleves}.`}
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
          ${`Abonnement ${paiement.code_abonnement} soldé après paiements cumulés. Total validé ${totalApres} ${devisePaiement}.`},
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
        'ABONNEMENT_SOLDE_ACTIVATION',
        ${`Paiement #${paiement.id} validé. Cumul ${totalApres} ${devisePaiement}. Abonnement ${paiement.code_abonnement} soldé et activé. ${licences.length} licence(s) activée(s). Quota élèves : ${quotaEleves}.`}
      )
    `;
  });

  revalidatePath("/dashboard/saas");
  revalidatePath("/dashboard/licences");
  revalidatePath("/dashboard");
}

export async function rejeterPaiementAbonnement(
  fd: FormData
) {
  const u = await admin();

  const paiementId =
    nombre(fd, "paiement_id");

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

  if (
    String(paiement.statut).toUpperCase() ===
    "VALIDE"
  ) {
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

export async function prolongerEcheancePaiement(
  fd: FormData
) {
  const u = await admin();

  const abonnementId =
    nombre(fd, "abonnement_id");

  const nouvelleEcheance =
    texte(fd, "nouvelle_echeance");

  const motif =
    texte(fd, "motif_prolongation") ||
    "Prolongation commerciale autorisée par DIGIGROUPE.";

  if (
    !abonnementId ||
    !nouvelleEcheance
  ) {
    throw new Error(
      "Informations de prolongation incomplètes."
    );
  }

  const rows = await prisma.$queryRaw<
    Array<{
      organisation_id: number;
      code_abonnement: string;
      date_echeance_paiement: Date | null;
    }>
  >`
    SELECT
      organisation_id,
      code_abonnement,
      date_echeance_paiement
    FROM abonnements_clients
    WHERE id = ${abonnementId}
    LIMIT 1
  `;

  if (!rows.length) {
    throw new Error(
      "Abonnement introuvable."
    );
  }

  const ancienne =
    rows[0].date_echeance_paiement
      ? new Date(
          rows[0].date_echeance_paiement
        )
          .toISOString()
          .slice(0, 10)
      : "non définie";

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE abonnements_clients
      SET date_echeance_paiement =
        ${nouvelleEcheance}
      WHERE id = ${abonnementId}
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
        ${rows[0].organisation_id},
        ${abonnementId},
        ${u.id},
        'PROLONGATION_ECHEANCE_PAIEMENT',
        ${`Abonnement ${rows[0].code_abonnement} : échéance modifiée de ${ancienne} à ${nouvelleEcheance}. Motif : ${motif}`}
      )
    `;
  });

  revalidatePath("/dashboard/saas");
}

export async function renouvelerAbonnement(
  fd: FormData
) {
  const u = await admin();

  const id =
    nombre(fd, "abonnement_id");

  const nouvelle =
    texte(fd, "nouvelle_expiration");

  const rows = await prisma.$queryRaw<
    Array<{
      organisation_id: number;
      date_expiration: Date | null;
    }>
  >`
    SELECT
      organisation_id,
      date_expiration
    FROM abonnements_clients
    WHERE id = ${id}
    LIMIT 1
  `;

  if (
    !rows.length ||
    !nouvelle
  ) {
    throw new Error(
      "Renouvellement invalide."
    );
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

  await prisma.$executeRaw`
    UPDATE abonnements_clients
    SET date_expiration = ${nouvelle}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/saas");
}
