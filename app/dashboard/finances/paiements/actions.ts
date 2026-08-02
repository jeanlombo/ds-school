"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";

type DetailPaiement = {
  fraisId: number;
  tarifId: number | null;
  montant: number;
  devise: string;
};

type ModePaiement = {
  mode: string;
  montant: number;
  reference?: string;
  telephone?: string;
  banque?: string;
};

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "").trim();
}

function entier(formData: FormData, cle: string): number {
  const valeur = Number(formData.get(cle));
  return Number.isFinite(valeur) ? Math.trunc(valeur) : 0;
}

function decimal(formData: FormData, cle: string): number {
  const valeur = Number(String(formData.get(cle) ?? "0").replace(",", "."));
  return Number.isFinite(valeur) ? valeur : 0;
}

function codeUnique(prefixe: string): string {
  const date = new Date();
  const jour = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const heure = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
  const alea = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefixe}-${jour}-${heure}-${alea}`;
}

async function contexte() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  return { utilisateur, ecole };
}

export async function enregistrerPaiement(formData: FormData) {
  await exigerPermission("FINANCES_ENCAISSER");
  const { utilisateur, ecole } = await contexte();

  const inscriptionId = entier(formData, "inscription_id");
  const anneeScolaireId = entier(formData, "annee_scolaire_id");
  const devise = texte(formData, "devise") || "CDF";
  const observation = texte(formData, "observation") || null;
  const detailsBruts = texte(formData, "details");
  const modesBruts = texte(formData, "modes");

  let details: DetailPaiement[] = [];
  let modes: ModePaiement[] = [];

  try {
    details = JSON.parse(detailsBruts);
    modes = JSON.parse(modesBruts);
  } catch {
    redirect("/dashboard/finances/paiements/nouveau?erreur=donnees");
  }

  details = details
    .filter((d) => Number(d.montant) > 0 && Number(d.fraisId) > 0)
    .map((d) => ({
      fraisId: Number(d.fraisId),
      tarifId: d.tarifId ? Number(d.tarifId) : null,
      montant: Number(d.montant),
      devise: String(d.devise || devise),
    }));

  modes = modes
    .filter((m) => Number(m.montant) > 0 && String(m.mode || "").trim())
    .map((m) => ({
      mode: String(m.mode),
      montant: Number(m.montant),
      reference: String(m.reference || "").trim() || undefined,
      telephone: String(m.telephone || "").trim() || undefined,
      banque: String(m.banque || "").trim() || undefined,
    }));

  if (!inscriptionId || !anneeScolaireId || !details.length || !modes.length) {
    redirect("/dashboard/finances/paiements/nouveau?erreur=champs");
  }

  const totalDetails = details.reduce((s, d) => s + d.montant, 0);
  const totalModes = modes.reduce((s, m) => s + m.montant, 0);

  if (Math.abs(totalDetails - totalModes) > 0.01) {
    redirect("/dashboard/finances/paiements/nouveau?erreur=equilibre");
  }

  const inscription = await prisma.inscription.findFirst({
    where: {
      id: inscriptionId,
      anneeScolaireId,
      eleve: { ecoleId: ecole.id },
    },
    include: {
      eleve: true,
      classe: true,
      anneeScolaire: true,
    },
  });

  if (!inscription) {
    redirect("/dashboard/finances/paiements/nouveau?erreur=inscription");
  }

  const sessionCaisse = await prisma.$queryRaw<Array<{ id: number; devise: string }>>`
    SELECT id, devise
    FROM sessions_caisse_scolaire
    WHERE ecole_id = ${ecole.id}
      AND utilisateur_nom = ${utilisateur.nom}
      AND statut = 'OUVERTE'
    ORDER BY date_ouverture DESC
    LIMIT 1
  `;

  if (!sessionCaisse.length) {
    redirect("/dashboard/finances/paiements/nouveau?erreur=caisse");
  }

  const numeroPaiement = codeUnique("PAY");
  const numeroRecu = codeUnique("REC");
  const codeVerification = crypto.randomBytes(16).toString("hex").toUpperCase();

  const enTetes = await headers();
  const adresseIp =
    enTetes.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    enTetes.get("x-real-ip") ||
    null;
  const appareil = enTetes.get("user-agent") || null;

  const modePrincipal =
    modes.length > 1 ? "MIXTE" : modes[0].mode;

  const paiementId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO paiements_scolaires
      (
        ecole_id, inscription_id, annee_scolaire_id,
        session_caisse_id, numero_paiement, date_paiement,
        montant_total, devise, mode_paiement,
        reference_transaction, observation, statut,
        cree_par, adresse_ip, appareil
      )
      VALUES
      (
        ${ecole.id}, ${inscriptionId}, ${anneeScolaireId},
        ${sessionCaisse[0].id}, ${numeroPaiement}, NOW(),
        ${totalDetails}, ${devise}, ${modePrincipal},
        ${modes[0]?.reference ?? null}, ${observation}, 'VALIDE',
        ${utilisateur.nom}, ${adresseIp}, ${appareil}
      )
    `;

    const lignesId = await tx.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM paiements_scolaires
      WHERE numero_paiement = ${numeroPaiement}
      LIMIT 1
    `;
    const idPaiement = lignesId[0]?.id;
    if (!idPaiement) throw new Error("Paiement introuvable après insertion.");

    for (const detail of details) {
      await tx.$executeRaw`
        INSERT INTO details_paiements_scolaires
        (
          paiement_id, frais_id, tarif_id, montant, devise
        )
        VALUES
        (
          ${idPaiement}, ${detail.fraisId}, ${detail.tarifId},
          ${detail.montant}, ${detail.devise}
        )
      `;
    }

    for (const mode of modes) {
      await tx.$executeRaw`
        INSERT INTO modes_paiements_scolaires
        (
          paiement_id, mode_paiement, montant, devise,
          reference_transaction, telephone, banque
        )
        VALUES
        (
          ${idPaiement}, ${mode.mode}, ${mode.montant}, ${devise},
          ${mode.reference ?? null}, ${mode.telephone ?? null},
          ${mode.banque ?? null}
        )
      `;
    }

    await tx.$executeRaw`
      INSERT INTO recus_scolaires
      (
        ecole_id, paiement_id, numero_recu,
        statut, code_verification, date_emission
      )
      VALUES
      (
        ${ecole.id}, ${idPaiement}, ${numeroRecu},
        'VALIDE', ${codeVerification}, NOW()
      )
    `;

    await tx.$executeRaw`
      INSERT INTO mouvements_caisse_scolaire
      (
        ecole_id, session_caisse_id, paiement_id,
        type_mouvement, libelle, montant, devise,
        reference_mouvement, observation, cree_par,
        date_mouvement
      )
      VALUES
      (
        ${ecole.id}, ${sessionCaisse[0].id}, ${idPaiement},
        'ENTREE',
        ${`Paiement scolaire - ${inscription.eleve.matricule}`},
        ${totalDetails}, ${devise},
        ${numeroPaiement}, ${observation}, ${utilisateur.nom},
        NOW()
      )
    `;

    await tx.historiqueEleve.create({
      data: {
        eleveId: inscription.eleveId,
        type: "PAIEMENT_SCOLAIRE",
        auteur: utilisateur.nom,
        details: JSON.stringify({
          paiementId: idPaiement,
          numeroPaiement,
          numeroRecu,
          montant: totalDetails,
          devise,
          classe: inscription.classe.nom,
          anneeScolaire: inscription.anneeScolaire.libelle,
        }),
      },
    });

    return idPaiement;
  });

  revalidatePath("/dashboard/finances/paiements");
  revalidatePath("/dashboard/finances/recus");
  revalidatePath("/dashboard/finances/caisse");
  revalidatePath("/dashboard/finances/rapports");

  redirect(
    `/dashboard/finances/paiements/${paiementId}?succes=creation`
  );
}

export async function annulerPaiement(formData: FormData) {
  await exigerPermission("FINANCES_ANNULER");
  const { utilisateur, ecole } = await contexte();

  const paiementId = entier(formData, "paiement_id");
  const motif = texte(formData, "motif_annulation");

  if (!paiementId || !motif) {
    redirect(`/dashboard/finances/paiements/${paiementId}?erreur=motif`);
  }

  const paiement = await prisma.$queryRaw<
    Array<{
      id: number;
      eleve_id: number;
      session_caisse_id: number | null;
      numero_paiement: string;
      montant_total: number;
      devise: string;
      statut: string;
    }>
  >`
    SELECT
      p.id,
      i.eleve_id,
      p.session_caisse_id,
      p.numero_paiement,
      p.montant_total,
      p.devise,
      p.statut
    FROM paiements_scolaires p
    INNER JOIN inscriptions i ON i.id = p.inscription_id
    WHERE p.id = ${paiementId}
      AND p.ecole_id = ${ecole.id}
    LIMIT 1
  `;

  const ligne = paiement[0];
  if (!ligne || ligne.statut !== "VALIDE") {
    redirect(`/dashboard/finances/paiements/${paiementId}?erreur=statut`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE paiements_scolaires
      SET
        statut = 'ANNULE',
        motif_annulation = ${motif},
        annule_par = ${utilisateur.nom},
        date_annulation = NOW(),
        updated_at = NOW()
      WHERE id = ${paiementId}
        AND ecole_id = ${ecole.id}
    `;

    await tx.$executeRaw`
      UPDATE recus_scolaires
      SET statut = 'ANNULE'
      WHERE paiement_id = ${paiementId}
        AND ecole_id = ${ecole.id}
    `;

    if (ligne.session_caisse_id) {
      await tx.$executeRaw`
        INSERT INTO mouvements_caisse_scolaire
        (
          ecole_id, session_caisse_id, paiement_id,
          type_mouvement, libelle, montant, devise,
          reference_mouvement, observation, cree_par,
          date_mouvement
        )
        VALUES
        (
          ${ecole.id}, ${ligne.session_caisse_id}, ${paiementId},
          'SORTIE',
          ${`Annulation ${ligne.numero_paiement}`},
          ${ligne.montant_total}, ${ligne.devise},
          ${ligne.numero_paiement}, ${motif}, ${utilisateur.nom},
          NOW()
        )
      `;
    }

    await tx.historiqueEleve.create({
      data: {
        eleveId: ligne.eleve_id,
        type: "PAIEMENT_SCOLAIRE_ANNULE",
        auteur: utilisateur.nom,
        details: JSON.stringify({
          paiementId,
          numeroPaiement: ligne.numero_paiement,
          montant: Number(ligne.montant_total),
          devise: ligne.devise,
          motif,
        }),
      },
    });
  });

  revalidatePath("/dashboard/finances/paiements");
  revalidatePath(`/dashboard/finances/paiements/${paiementId}`);
  revalidatePath("/dashboard/finances/recus");
  revalidatePath("/dashboard/finances/caisse");
  revalidatePath("/dashboard/finances/rapports");

  redirect(`/dashboard/finances/paiements/${paiementId}?succes=annulation`);
}
