"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

const txt = (formData: FormData, cle: string) =>
  String(formData.get(cle) ?? "").trim();

const num = (formData: FormData, cle: string) =>
  Number(
    String(formData.get(cle) ?? "0").replace(",", ".")
  );

function normaliserCode(valeur: string) {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " ET ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase()
    .slice(0, 80);
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

async function codeUnique(
  ecoleId: number,
  demande: string,
  libelle: string,
  exclure = 0
) {
  const base =
    normaliserCode(demande || libelle) || "FRAIS";

  let code = base;
  let numero = 1;

  while (true) {
    const resultats = await prisma.$queryRaw<
      Array<{ total: bigint }>
    >`
      SELECT COUNT(*) AS total
      FROM frais_scolaires
      WHERE ecole_id = ${ecoleId}
        AND code = ${code}
        AND (${exclure} = 0 OR id <> ${exclure})
    `;

    if (Number(resultats[0]?.total ?? 0) === 0) {
      return code;
    }

    code = `${base}_${String(numero++)
      .padStart(3, "0")}`.slice(0, 80);
  }
}

export async function creerFrais(
  formData: FormData
) {
  await exigerPermission("FINANCES_FRAIS_AJOUTER");

  const { utilisateur, ecole } = await contexte();

  const libelle = txt(formData, "libelle");
  const famille = txt(formData, "famille");
  const nature = txt(formData, "nature");
  const periodicite = txt(formData, "periodicite");

  const montantInitial = num(
    formData,
    "montant_initial"
  );

  const anneeScolaireId = Number(
    formData.get("annee_scolaire_id") ?? 0
  );

  const classeBrute = Number(
    formData.get("classe_id") ?? 0
  );

  const classeId =
    classeBrute > 0 ? classeBrute : null;

  const deviseInitiale =
    txt(formData, "devise_initiale").toUpperCase() ||
    "CDF";

  if (
    !libelle ||
    !famille ||
    !nature ||
    !periodicite
  ) {
    redirect(
      "/dashboard/finances/frais-scolaires/nouveau?erreur=champs"
    );
  }

  if (
    !Number.isFinite(montantInitial) ||
    montantInitial <= 0
  ) {
    redirect(
      "/dashboard/finances/frais-scolaires/nouveau?erreur=montant"
    );
  }

  if (
    !Number.isInteger(anneeScolaireId) ||
    anneeScolaireId <= 0
  ) {
    redirect(
      "/dashboard/finances/frais-scolaires/nouveau?erreur=annee"
    );
  }

  if (!["CDF", "USD"].includes(deviseInitiale)) {
    redirect(
      "/dashboard/finances/frais-scolaires/nouveau?erreur=devise"
    );
  }

  const annee = await prisma.anneeScolaire.findFirst({
    where: {
      id: anneeScolaireId,
      ecoleId: ecole.id,
    },
    select: {
      id: true,
    },
  });

  if (!annee) {
    redirect(
      "/dashboard/finances/frais-scolaires/nouveau?erreur=annee"
    );
  }

  if (classeId) {
    const classe = await prisma.classe.findFirst({
      where: {
        id: classeId,
        ecoleId: ecole.id,
        statut: "active",
      },
      select: {
        id: true,
      },
    });

    if (!classe) {
      redirect(
        "/dashboard/finances/frais-scolaires/nouveau?erreur=classe"
      );
    }
  }

  const code = await codeUnique(
    ecole.id,
    txt(formData, "code"),
    libelle
  );

  const penalite =
    formData.get("penalite_active") === "on"
      ? 1
      : 0;

  const tarifActif =
    formData.get("tarif_actif") === "on"
      ? 1
      : 0;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO frais_scolaires
      (
        ecole_id,
        code,
        libelle,
        famille,
        nature,
        categorie,
        periodicite,
        description,
        obligatoire,
        actif,
        penalite_active,
        type_penalite,
        valeur_penalite,
        delai_grace_jours,
        cree_par
      )
      VALUES
      (
        ${ecole.id},
        ${code},
        ${libelle},
        ${famille},
        ${nature},
        ${nature},
        ${periodicite},
        ${txt(formData, "description") || null},
        ${
          formData.get("obligatoire") === "on"
            ? 1
            : 0
        },
        ${
          formData.get("actif") === "on"
            ? 1
            : 0
        },
        ${penalite},
        ${
          penalite
            ? txt(formData, "type_penalite")
            : null
        },
        ${
          penalite
            ? num(formData, "valeur_penalite")
            : 0
        },
        ${
          penalite
            ? num(formData, "delai_grace_jours")
            : 0
        },
        ${utilisateur.nom}
      )
    `;

    const ids = await tx.$queryRaw<
      Array<{ id: bigint | number }>
    >`
      SELECT LAST_INSERT_ID() AS id
    `;

    const fraisId = Number(ids[0]?.id ?? 0);

    if (!fraisId) {
      throw new Error(
        "Impossible de récupérer le frais créé."
      );
    }

    await tx.$executeRaw`
      INSERT INTO tarifs_frais_scolaires
      (
        ecole_id,
        frais_id,
        annee_scolaire_id,
        classe_id,
        montant,
        devise,
        date_echeance,
        actif,
        cree_par
      )
      VALUES
      (
        ${ecole.id},
        ${fraisId},
        ${anneeScolaireId},
        ${classeId},
        ${montantInitial},
        ${deviseInitiale},
        ${txt(formData, "date_echeance") || null},
        ${tarifActif},
        ${utilisateur.nom}
      )
    `;
  });

  revalidatePath("/dashboard/finances");
  revalidatePath(
    "/dashboard/finances/frais-scolaires"
  );
  revalidatePath(
    "/dashboard/finances/paiements/nouveau"
  );

  redirect(
    "/dashboard/finances/frais-scolaires?succes=creation_tarif"
  );
}

export async function modifierFrais(
  id: number,
  formData: FormData
) {
  await exigerPermission("FINANCES_FRAIS_MODIFIER");

  const { utilisateur, ecole } = await contexte();

  const libelle = txt(formData, "libelle");
  const famille = txt(formData, "famille");
  const nature = txt(formData, "nature");

  if (!libelle || !famille || !nature) {
    redirect(
      `/dashboard/finances/frais-scolaires/${id}?erreur=champs`
    );
  }

  const code = await codeUnique(
    ecole.id,
    txt(formData, "code"),
    libelle,
    id
  );

  const penalite =
    formData.get("penalite_active") === "on"
      ? 1
      : 0;

  await prisma.$executeRaw`
    UPDATE frais_scolaires
    SET
      code = ${code},
      libelle = ${libelle},
      famille = ${famille},
      nature = ${nature},
      categorie = ${nature},
      periodicite = ${txt(
        formData,
        "periodicite"
      )},
      description = ${
        txt(formData, "description") || null
      },
      obligatoire = ${
        formData.get("obligatoire") === "on"
          ? 1
          : 0
      },
      actif = ${
        formData.get("actif") === "on"
          ? 1
          : 0
      },
      penalite_active = ${penalite},
      type_penalite = ${
        penalite
          ? txt(formData, "type_penalite")
          : null
      },
      valeur_penalite = ${
        penalite
          ? num(formData, "valeur_penalite")
          : 0
      },
      delai_grace_jours = ${
        penalite
          ? num(formData, "delai_grace_jours")
          : 0
      },
      modifie_par = ${utilisateur.nom},
      updated_at = NOW()
    WHERE id = ${id}
      AND ecole_id = ${ecole.id}
  `;

  revalidatePath(
    "/dashboard/finances/frais-scolaires"
  );
  revalidatePath(
    `/dashboard/finances/frais-scolaires/${id}`
  );

  redirect(
    `/dashboard/finances/frais-scolaires/${id}?succes=modification`
  );
}

export async function enregistrerTarif(
  fraisId: number,
  formData: FormData
) {
  await exigerPermission("FINANCES_TARIFS_GERER");

  const { utilisateur, ecole } = await contexte();

  const classeBrute = Number(
    formData.get("classe_id") ?? 0
  );

  const classeId =
    classeBrute > 0 ? classeBrute : null;

  const montant = num(formData, "montant");

  if (!Number.isFinite(montant) || montant <= 0) {
    redirect(
      `/dashboard/finances/frais-scolaires/${fraisId}?erreur=montant`
    );
  }

  await prisma.$executeRaw`
    INSERT INTO tarifs_frais_scolaires
    (
      ecole_id,
      frais_id,
      annee_scolaire_id,
      classe_id,
      montant,
      devise,
      date_echeance,
      actif,
      cree_par
    )
    VALUES
    (
      ${ecole.id},
      ${fraisId},
      ${Number(
        formData.get("annee_scolaire_id")
      )},
      ${classeId},
      ${montant},
      ${txt(formData, "devise") || "CDF"},
      ${txt(formData, "date_echeance") || null},
      ${
        formData.get("actif") === "on"
          ? 1
          : 0
      },
      ${utilisateur.nom}
    )
    ON DUPLICATE KEY UPDATE
      montant = VALUES(montant),
      devise = VALUES(devise),
      date_echeance = VALUES(date_echeance),
      actif = VALUES(actif),
      modifie_par = ${utilisateur.nom},
      updated_at = NOW()
  `;

  revalidatePath(
    `/dashboard/finances/frais-scolaires/${fraisId}`
  );
  revalidatePath(
    "/dashboard/finances/paiements/nouveau"
  );

  redirect(
    `/dashboard/finances/frais-scolaires/${fraisId}?succes=tarif`
  );
}

export async function supprimerTarif(
  fraisId: number,
  tarifId: number
) {
  await exigerPermission(
    "FINANCES_TARIFS_SUPPRIMER"
  );

  const { ecole } = await contexte();

  await prisma.$executeRaw`
    DELETE FROM tarifs_frais_scolaires
    WHERE id = ${tarifId}
      AND frais_id = ${fraisId}
      AND ecole_id = ${ecole.id}
  `;

  revalidatePath(
    `/dashboard/finances/frais-scolaires/${fraisId}`
  );
  revalidatePath(
    "/dashboard/finances/paiements/nouveau"
  );
}

export async function basculerStatutFrais(
  id: number,
  actif: boolean
) {
  await exigerPermission("FINANCES_FRAIS_MODIFIER");

  const { utilisateur, ecole } = await contexte();

  await prisma.$executeRaw`
    UPDATE frais_scolaires
    SET
      actif = ${actif ? 0 : 1},
      modifie_par = ${utilisateur.nom},
      updated_at = NOW()
    WHERE id = ${id}
      AND ecole_id = ${ecole.id}
  `;

  revalidatePath(
    "/dashboard/finances/frais-scolaires"
  );
  revalidatePath(
    "/dashboard/finances/paiements/nouveau"
  );
}
