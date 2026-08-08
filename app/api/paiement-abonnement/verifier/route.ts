import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ligne = {
  id: number;
  code_abonnement: string;
  formule: string | null;
  montant: unknown;
  devise: string;
  statut: string;
  date_expiration: Date | null;
  client: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body.codeAbonnement ?? "").trim().toUpperCase();
    const contact = String(body.contact ?? "").trim().toLowerCase();

    if (!code || !contact) {
      return NextResponse.json({ ok:false, message:"Code d’abonnement et contact obligatoires." }, { status:400 });
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
        o.nom AS client
      FROM abonnements_clients a
      INNER JOIN organisations_clientes o ON o.id = a.organisation_id
      WHERE UPPER(a.code_abonnement) = ${code}
        AND (
          LOWER(COALESCE(o.email,'')) = ${contact}
          OR LOWER(COALESCE(o.telephone,'')) = ${contact}
        )
      LIMIT 1
    `;

    if (!lignes.length) {
      return NextResponse.json(
        { ok:false, message:"Abonnement introuvable ou coordonnées non reconnues." },
        { status:404 },
      );
    }

    const a = lignes[0];

    return NextResponse.json({
      ok:true,
      abonnement:{
        id:a.id,
        code:a.code_abonnement,
        client:a.client,
        formule:a.formule ?? "Personnalisée",
        montant:Number(a.montant ?? 0),
        devise:a.devise || "USD",
        statut:a.statut,
        dateExpiration:a.date_expiration ? new Date(a.date_expiration).toISOString() : null,
      }
    });
  } catch (erreur) {
    console.error("VERIFICATION PAIEMENT ABONNEMENT:", erreur);
    return NextResponse.json({ ok:false, message:"Erreur interne pendant la vérification." }, { status:500 });
  }
}
