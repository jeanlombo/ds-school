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
  client: string | null;
};

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

    console.log("=== VERIFICATION ABONNEMENT ===");
    console.log("Code :", code);
    console.log("Contact :", contact);

    const lignes = await prisma.$queryRaw<Ligne[]>`
      SELECT
        a.id,
        a.code_abonnement,
        a.formule,
        a.montant,
        a.devise,
        a.statut,
        a.date_expiration,
        o.nom AS client
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

    console.log("Résultat abonnement :", lignes);

    if (!lignes.length) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Abonnement introuvable ou coordonnées non reconnues.",
        },
        { status: 404 }
      );
    }

    const abonnement = lignes[0];

    return NextResponse.json({
      ok: true,
      abonnement: {
        id: Number(abonnement.id),
        code: abonnement.code_abonnement,
        client: abonnement.client ?? "Client DIGIGROUPE",
        formule: abonnement.formule ?? "Personnalisée",
        montant: Number(abonnement.montant ?? 0),
        devise: abonnement.devise || "USD",
        statut: abonnement.statut || "ACTIF",
        dateExpiration: abonnement.date_expiration
          ? new Date(abonnement.date_expiration).toISOString()
          : null,
      },
    });
  } catch (erreur: unknown) {
    console.error("======================================");
    console.error("ERREUR VERIFICATION PAIEMENT ABONNEMENT");
    console.error(erreur);
    console.error("======================================");

    const messageTechnique =
      erreur instanceof Error
        ? erreur.message
        : "Erreur SQL/Prisma inconnue";

    return NextResponse.json(
      {
        ok: false,
        message: "Erreur interne pendant la vérification.",
        diagnostic:
          process.env.NODE_ENV !== "production"
            ? messageTechnique
            : undefined,
      },
      { status: 500 }
    );
  }
}