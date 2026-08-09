import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ligne = {
  id: number;
  code_abonnement: string;
  formule: string | null;
  montant: unknown;
  devise: string | null;
  statut: string | null;
  date_expiration: Date | null;
  date_echeance_paiement: Date | null;
  client: string | null;
  total_paye: unknown;
  total_en_attente: unknown;
};

function dateSansHeure(date: Date | null): string | null {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const code = String(body.codeAbonnement ?? "")
      .trim()
      .toUpperCase();

    const contact = String(body.contact ?? "")
      .trim()
      .toLowerCase();

    if (!code || !contact) {
      return NextResponse.json(
        {
          ok: false,
          message: "Code d’abonnement et contact obligatoires.",
        },
        { status: 400 }
      );
    }

    const lignes = await prisma.$queryRaw<Ligne[]>`
      SELECT
        a.id,
        a.code_abonnement,
        a.formule,
        a.montant,
        a.devise,
        a.statut,
        a.date_expiration,
        a.date_echeance_paiement,
        o.nom AS client,

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
      INNER JOIN organisations_clientes o
        ON o.id = a.organisation_id
      WHERE UPPER(a.code_abonnement) = ${code}
        AND (
          LOWER(COALESCE(o.email, '')) = ${contact}
          OR LOWER(COALESCE(o.telephone, '')) = ${contact}
        )
      LIMIT 1
    `;

    if (!lignes.length) {
      return NextResponse.json(
        {
          ok: false,
          message: "Abonnement introuvable ou coordonnées non reconnues.",
        },
        { status: 404 }
      );
    }

    const ligne = lignes[0];

    const montant = Number(ligne.montant ?? 0);
    const totalPaye = Number(ligne.total_paye ?? 0);
    const totalEnAttente = Number(ligne.total_en_attente ?? 0);

    const soldeRestant = Math.max(0, montant - totalPaye);
    const disponibleNouveauPaiement = Math.max(
      0,
      montant - totalPaye - totalEnAttente
    );

    const echeance = ligne.date_echeance_paiement
      ? new Date(ligne.date_echeance_paiement)
      : null;

    if (echeance) {
      echeance.setHours(23, 59, 59, 999);
    }

    const echeanceExpiree =
      Boolean(echeance) &&
      new Date().getTime() > (echeance?.getTime() ?? 0) &&
      soldeRestant > 0;

    let statutFinancier = "NON_PAYE";

    if (soldeRestant <= 0) {
      statutFinancier = "SOLDE";
    } else if (echeanceExpiree && totalPaye > 0) {
      statutFinancier = "PARTIEL_EXPIRE";
    } else if (echeanceExpiree) {
      statutFinancier = "ECHEANCE_EXPIREE";
    } else if (totalPaye > 0) {
      statutFinancier = "PARTIEL";
    } else if (totalEnAttente > 0) {
      statutFinancier = "PAIEMENT_EN_ATTENTE";
    }

    return NextResponse.json({
      ok: true,
      abonnement: {
        id: Number(ligne.id),
        code: ligne.code_abonnement,
        client: ligne.client ?? "Client DIGIGROUPE",
        formule: ligne.formule ?? "Personnalisée",
        montant,
        devise: ligne.devise || "USD",
        statut: ligne.statut || "EN_ATTENTE",
        dateExpiration: ligne.date_expiration
          ? new Date(ligne.date_expiration).toISOString()
          : null,

        dateEcheancePaiement: dateSansHeure(ligne.date_echeance_paiement),
        totalPaye,
        totalEnAttente,
        soldeRestant,
        disponibleNouveauPaiement,
        statutFinancier,
        paiementBloque: echeanceExpiree || soldeRestant <= 0,
        echeanceExpiree,
      },
    });
  } catch (erreur: unknown) {
    console.error("ERREUR VERIFICATION PAIEMENT ABONNEMENT:", erreur);

    return NextResponse.json(
      {
        ok: false,
        message: "Erreur interne pendant la vérification.",
        diagnostic:
          process.env.NODE_ENV !== "production" && erreur instanceof Error
            ? erreur.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
