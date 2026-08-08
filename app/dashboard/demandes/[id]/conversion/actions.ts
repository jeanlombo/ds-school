"use server";

import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type Demande = {
  id: number;
  reference_demande: string;
  type_demande: string;
  nom_etablissement: string;
  type_etablissement: string | null;
  effectif: number | null;
  nom_responsable: string;
  telephone: string;
  email: string | null;
  message: string | null;
  statut: string;
};

type LigneId = { id: bigint | number };

function texte(fd: FormData, nom: string) {
  return String(fd.get(nom) ?? "").trim();
}

function entier(fd: FormData, nom: string) {
  return Number(fd.get(nom) ?? 0);
}

function montant(fd: FormData, nom: string) {
  const valeur = Number(fd.get(nom) ?? 0);
  return Number.isFinite(valeur) ? valeur : 0;
}

function normaliserTypeEtablissement(valeur: string | null) {
  const brut = String(valeur || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  return brut.includes("UNIVERSIT") ||
    brut.includes("INSTITUT SUPERIEUR") ||
    brut.includes("SUPERIEUR")
    ? "UNIVERSITE"
    : "SCOLAIRE";
}

function typeOrganisation(typeEtablissement: string) {
  return typeEtablissement === "UNIVERSITE"
    ? "INSTITUTION"
    : "GROUPE_SCOLAIRE";
}

function codeCourt(prefixe: string, reference: string) {
  const ref = reference
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(-12);

  return `${prefixe}-${ref}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`.slice(0, 60);
}

function codeAbonnement(reference: string) {
  const maintenant = new Date();
  const y = maintenant.getFullYear();
  const m = String(maintenant.getMonth() + 1).padStart(2, "0");
  const d = String(maintenant.getDate()).padStart(2, "0");

  return `ABO-${y}${m}${d}-${reference
    .replace(/[^A-Z0-9]/gi, "")
    .slice(-8)
    .toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`.slice(0, 100);
}

function ajouterPeriode(date: Date, periodicite: string) {
  const fin = new Date(date);

  switch (periodicite) {
    case "MENSUEL":
      fin.setMonth(fin.getMonth() + 1);
      break;
    case "TRIMESTRIEL":
      fin.setMonth(fin.getMonth() + 3);
      break;
    case "SEMESTRIEL":
      fin.setMonth(fin.getMonth() + 6);
      break;
    case "PERSONNALISE":
      fin.setFullYear(fin.getFullYear() + 1);
      break;
    default:
      fin.setFullYear(fin.getFullYear() + 1);
      break;
  }

  return fin.toISOString().slice(0, 10);
}

export async function convertirDemandeEnAbonnement(fd: FormData) {
  const u = await obtenirUtilisateurConnecte();

  if (!u?.superAdministrateur) {
    throw new Error("Accès réservé au Super Administrateur DIGIGROUPE.");
  }

  const demandeId = entier(fd, "demande_id");
  const montantAbonnement = montant(fd, "montant");
  const devise = texte(fd, "devise").toUpperCase() || "USD";
  const periodicite = texte(fd, "periodicite").toUpperCase() || "ANNUEL";
  const formule = texte(fd, "formule") || "Personnalisée";

  if (!demandeId || montantAbonnement <= 0) {
    throw new Error("Demande ou montant invalide.");
  }

  if (!["USD", "CDF"].includes(devise)) {
    throw new Error("Devise invalide.");
  }

  if (
    ![
      "MENSUEL",
      "TRIMESTRIEL",
      "SEMESTRIEL",
      "ANNUEL",
      "PERSONNALISE",
    ].includes(periodicite)
  ) {
    throw new Error("Périodicité invalide.");
  }

  const demandes = await prisma.$queryRaw<Demande[]>`
    SELECT
      id,
      reference_demande,
      type_demande,
      nom_etablissement,
      type_etablissement,
      effectif,
      nom_responsable,
      telephone,
      email,
      message,
      statut
    FROM demandes_vitrine
    WHERE id = ${demandeId}
    LIMIT 1
  `;

  const demande = demandes[0];

  if (!demande) {
    throw new Error("Demande introuvable.");
  }

  if (!["INSCRIPTION", "TARIFICATION"].includes(demande.type_demande)) {
    throw new Error(
      "Seules les demandes d'inscription ou de tarification peuvent être converties."
    );
  }

  const typeEtab = normaliserTypeEtablissement(
    demande.type_etablissement
  );

  const debut = new Date().toISOString().slice(0, 10);
  const expiration =
    texte(fd, "date_expiration") ||
    ajouterPeriode(new Date(), periodicite);

  const resultat = await prisma.$transaction(async (tx) => {
    /*
     * 1. Réutilisation d'une organisation existante quand les coordonnées
     *    correspondent, afin d'éviter les doublons.
     */
    const organisations = await tx.$queryRaw<LigneId[]>`
      SELECT id
      FROM organisations_clientes
      WHERE
        (${demande.email || null} IS NOT NULL AND LOWER(COALESCE(email,'')) = LOWER(${demande.email || ""}))
        OR
        (${demande.telephone || null} IS NOT NULL AND COALESCE(telephone,'') = ${demande.telephone})
        OR
        LOWER(nom) = LOWER(${demande.nom_etablissement})
      ORDER BY id DESC
      LIMIT 1
    `;

    let organisationId = organisations.length
      ? Number(organisations[0].id)
      : 0;

    if (!organisationId) {
      const codeOrganisation = codeCourt(
        "ORG",
        demande.reference_demande
      );

      await tx.$executeRaw`
        INSERT INTO organisations_clientes
        (
          code,
          nom,
          type_client,
          nom_contact,
          telephone,
          email,
          statut
        )
        VALUES
        (
          ${codeOrganisation},
          ${demande.nom_etablissement},
          ${typeOrganisation(typeEtab)},
          ${demande.nom_responsable},
          ${demande.telephone || null},
          ${demande.email || null},
          'ACTIF'
        )
      `;

      const ids = await tx.$queryRaw<LigneId[]>`
        SELECT LAST_INSERT_ID() AS id
      `;

      organisationId = Number(ids[0].id);
    }

    /*
     * 2. Réutilisation d'un établissement déjà rattaché à l'organisation
     *    si le même nom existe. Sinon création de l'établissement.
     */
    const ecolesExistantes = await tx.$queryRaw<LigneId[]>`
      SELECT e.id
      FROM ecoles e
      INNER JOIN organisation_etablissements oe
        ON oe.ecole_id = e.id
      WHERE oe.organisation_id = ${organisationId}
        AND LOWER(e.nom) = LOWER(${demande.nom_etablissement})
      LIMIT 1
    `;

    let ecoleId = ecolesExistantes.length
      ? Number(ecolesExistantes[0].id)
      : 0;

    if (!ecoleId) {
      const codeEcole = codeCourt(
        typeEtab === "UNIVERSITE" ? "UNI" : "ECO",
        demande.reference_demande
      );

      await tx.$executeRaw`
        INSERT INTO ecoles
        (
          nom,
          code,
          telephone,
          email,
          directeur,
          statut,
          devise,
          type_etablissement,
          created_at,
          updated_at
        )
        VALUES
        (
          ${demande.nom_etablissement},
          ${codeEcole},
          ${demande.telephone || null},
          ${demande.email || null},
          ${demande.nom_responsable || null},
          'active',
          'CDF',
          ${typeEtab},
          NOW(3),
          NOW(3)
        )
      `;

      const ids = await tx.$queryRaw<LigneId[]>`
        SELECT LAST_INSERT_ID() AS id
      `;

      ecoleId = Number(ids[0].id);

      await tx.$executeRaw`
        INSERT INTO organisation_etablissements
        (
          organisation_id,
          ecole_id,
          principal
        )
        VALUES
        (
          ${organisationId},
          ${ecoleId},
          1
        )
      `;
    }

    /*
     * 3. Empêche une double conversion de la même demande.
     *    La référence de la demande est conservée dans observations.
     */
    const dejaConvertie = await tx.$queryRaw<LigneId[]>`
      SELECT id
      FROM abonnements_clients
      WHERE organisation_id = ${organisationId}
        AND observations LIKE ${`%${demande.reference_demande}%`}
      LIMIT 1
    `;

    if (dejaConvertie.length) {
      throw new Error(
        "Cette demande a déjà été convertie en abonnement."
      );
    }

    /*
     * 4. Création de l'abonnement en EN_ATTENTE.
     *    Le prix n'est PAS calculé automatiquement :
     *    il est saisi et validé par DIGIGROUPE dans cet écran.
     */
    const abonnementCode = codeAbonnement(
      demande.reference_demande
    );

    const observations = [
      `Conversion demande ${demande.reference_demande}.`,
      `Effectif déclaré : ${demande.effectif ?? "non renseigné"}.`,
      `Type : ${typeEtab}.`,
      demande.message ? `Message : ${demande.message}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    await tx.$executeRaw`
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
        ${abonnementCode},
        ${formule},
        ${debut},
        ${expiration},
        'EN_ATTENTE',
        ${montantAbonnement},
        ${devise},
        ${periodicite},
        ${observations}
      )
    `;

    const abonnementIds = await tx.$queryRaw<LigneId[]>`
      SELECT LAST_INSERT_ID() AS id
    `;

    const abonnementId = Number(abonnementIds[0].id);

    /*
     * 5. Traçabilité SaaS.
     */
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
        ${organisationId},
        ${abonnementId},
        ${u.id},
        'CONVERSION_DEMANDE_VITRINE',
        ${`Demande ${demande.reference_demande} convertie en abonnement ${abonnementCode}. Montant ${montantAbonnement} ${devise}. Effectif ${demande.effectif ?? "N/A"}.`}
      )
    `;

    /*
     * 6. La demande est marquée comme traitée.
     */
    const observationDemande =
      `Convertie en abonnement ${abonnementCode} — ${montantAbonnement} ${devise} — statut EN_ATTENTE`;

    await tx.$executeRaw`
      UPDATE demandes_vitrine
      SET
        statut = 'TRAITEE',
        observation_admin = ${observationDemande},
        traite_par = ${u.id},
        date_traitement = NOW(),
        updated_at = NOW()
      WHERE id = ${demande.id}
    `;

    await tx.$executeRaw`
      INSERT INTO historique_demandes_vitrine
      (
        demande_id,
        utilisateur_id,
        statut,
        observation
      )
      VALUES
      (
        ${demande.id},
        ${u.id},
        'TRAITEE',
        ${observationDemande}
      )
    `;

    return {
      abonnementId,
      abonnementCode,
      organisationId,
      ecoleId,
    };
  });

  revalidatePath("/dashboard/demandes");
  revalidatePath("/dashboard/saas");
  revalidatePath("/dashboard/organisations");

  redirect(
    `/dashboard/demandes?conversion=ok&code=${encodeURIComponent(
      resultat.abonnementCode
    )}`
  );
}
