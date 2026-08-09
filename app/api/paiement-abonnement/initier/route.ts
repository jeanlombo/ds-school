import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Abonnement = {
  id: number;
  organisation_id: number;
  montant: unknown;
  devise: string;
  code_abonnement: string;
  date_echeance_paiement: Date | null;
  total_paye: unknown;
  total_en_attente: unknown;
};

function referencePaiement() {
  const date = new Date();
  const p = (n: number) => String(n).padStart(2, "0");

  const stamp =
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;

  const aleatoire = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `DSPAY-${stamp}-${aleatoire}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const abonnementId = Number(body.abonnementId);
    const montant = Number(body.montant);

    const modePaiement = String(body.modePaiement ?? "")
      .trim()
      .toUpperCase();

    const comptePaiement = String(body.comptePaiement ?? "").trim();
    const numeroCaisse = String(body.numeroCaisse ?? "").trim();

    const estMobileMoney = [
      "MPESA",
      "AIRTEL_MONEY",
      "ORANGE_MONEY",
    ].includes(modePaiement);

    if (
      !Number.isInteger(abonnementId) ||
      abonnementId <= 0 ||
      !(montant > 0) ||
      !modePaiement ||
      !comptePaiement ||
      (estMobileMoney && !numeroCaisse)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informations de paiement incomplètes.",
        },
        { status: 400 }
      );
    }

    const abonnements = await prisma.$queryRaw<Abonnement[]>`
      SELECT
        a.id,
        a.organisation_id,
        a.montant,
        a.devise,
        a.code_abonnement,
        a.date_echeance_paiement,

        COALESCE((
          SELECT SUM(p.montant)
          FROM paiements_abonnements_clients p
          WHERE p.abonnement_id = a.id
            AND UPPER(p.statut) = 'VALIDE'
        ), 0) AS total_paye,

        COALESCE((
          SELECT SUM(p.montant)
          FROM paiements_abonnements_clients p
          WHERE p.abonnement_id = a.id
            AND UPPER(p.statut) = 'EN_ATTENTE'
        ), 0) AS total_en_attente

      FROM abonnements_clients a
      WHERE a.id = ${abonnementId}
      LIMIT 1
    `;

    if (!abonnements.length) {
      return NextResponse.json(
        {
          ok: false,
          message: "Abonnement introuvable.",
        },
        { status: 404 }
      );
    }

    const abonnement = abonnements[0];

    const montantAbonnement = Number(abonnement.montant ?? 0);
    const totalPaye = Number(abonnement.total_paye ?? 0);
    const totalEnAttente = Number(abonnement.total_en_attente ?? 0);

    const soldeRestant = Math.max(0, montantAbonnement - totalPaye);

    if (soldeRestant <= 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Cet abonnement est déjà soldé.",
        },
        { status: 409 }
      );
    }

    if (abonnement.date_echeance_paiement) {
      const echeance = new Date(abonnement.date_echeance_paiement);
      echeance.setHours(23, 59, 59, 999);

      if (new Date().getTime() > echeance.getTime()) {
        return NextResponse.json(
          {
            ok: false,
            code: "ECHEANCE_EXPIREE",
            message:
              "L’échéance accordée pour solder cet abonnement est dépassée. Contactez DIGIGROUPE pour une prolongation.",
          },
          { status: 403 }
        );
      }
    }

    const disponible = Math.max(
      0,
      montantAbonnement - totalPaye - totalEnAttente
    );

    if (disponible <= 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Un ou plusieurs paiements sont déjà en attente pour couvrir le solde restant. Attendez leur validation ou contactez DIGIGROUPE.",
        },
        { status: 409 }
      );
    }

    if (montant > disponible + 0.00001) {
      return NextResponse.json(
        {
          ok: false,
          message: `Le montant dépasse le solde actuellement disponible (${disponible.toLocaleString(
            "fr-FR"
          )} ${abonnement.devise || "USD"}).`,
        },
        { status: 400 }
      );
    }

    const reference = referencePaiement();

    const observations = [
      "Paiement en ligne initié depuis la vitrine.",
      `Compte/numéro client déclaré : ${comptePaiement}`,
      estMobileMoney
        ? `Numéro caisse/marchand déclaré : ${numeroCaisse}`
        : "",
      montant < soldeRestant
        ? `Versement partiel. Solde avant validation : ${soldeRestant} ${
            abonnement.devise || "USD"
          }.`
        : "Versement destiné à solder l'abonnement.",
    ]
      .filter(Boolean)
      .join(" | ");

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
        ${abonnement.id},
        ${abonnement.organisation_id},
        ${montant},
        ${abonnement.devise || "USD"},
        ${modePaiement},
        ${reference},
        NOW(),
        'EN_ATTENTE',
        ${observations}
      )
    `;

    return NextResponse.json({
      ok: true,
      reference,
      statut: "EN_ATTENTE",
      montant,
      devise: abonnement.devise || "USD",
      message:
        montant < soldeRestant
          ? "Versement partiel enregistré. Il reste soumis à validation DIGIGROUPE."
          : "Demande de paiement enregistrée. Elle reste soumise à validation DIGIGROUPE.",
    });
  } catch (erreur) {
    console.error("INITIATION PAIEMENT ABONNEMENT:", erreur);

    return NextResponse.json(
      {
        ok: false,
        message: "Erreur interne pendant l’initiation du paiement.",
      },
      { status: 500 }
    );
  }
}
