import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Abonnement = {
  id:number;
  organisation_id:number;
  montant:unknown;
  devise:string;
  code_abonnement:string;
};

function referencePaiement() {
  const date = new Date();
  const p = (n:number) => String(n).padStart(2,"0");
  const stamp =
    `${date.getFullYear()}${p(date.getMonth()+1)}${p(date.getDate())}` +
    `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
  const aleatoire = Math.random().toString(36).slice(2,8).toUpperCase();
  return `DSPAY-${stamp}-${aleatoire}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const abonnementId = Number(body.abonnementId);
    const montant = Number(body.montant);
    const modePaiement = String(body.modePaiement ?? "").trim().toUpperCase();
    const comptePaiement = String(body.comptePaiement ?? "").trim();

    if (!Number.isInteger(abonnementId) || abonnementId <= 0 || !(montant > 0) || !modePaiement || !comptePaiement) {
      return NextResponse.json({ ok:false, message:"Informations de paiement incomplètes." }, { status:400 });
    }

    const abonnements = await prisma.$queryRaw<Abonnement[]>`
      SELECT id,organisation_id,montant,devise,code_abonnement
      FROM abonnements_clients
      WHERE id=${abonnementId}
      LIMIT 1
    `;

    if (!abonnements.length) {
      return NextResponse.json({ ok:false, message:"Abonnement introuvable." }, { status:404 });
    }

    const abonnement = abonnements[0];
    const reference = referencePaiement();

    /*
     * IMPORTANT :
     * Le statut reste EN_ATTENTE.
     * Cette route ne simule jamais une confirmation Mobile Money / Carte.
     * La validation doit venir d'un webhook de la passerelle choisie
     * ou du processus administratif DIGIGROUPE existant.
     */
    await prisma.$executeRaw`
      INSERT INTO paiements_abonnements_clients
        (abonnement_id,organisation_id,montant,devise,mode_paiement,reference_paiement,date_paiement,statut,observations)
      VALUES(
        ${abonnement.id},
        ${abonnement.organisation_id},
        ${montant},
        ${abonnement.devise || "USD"},
        ${modePaiement},
        ${reference},
        NOW(),
        'EN_ATTENTE',
        ${`Paiement en ligne initié depuis la vitrine. Compte/numéro déclaré : ${comptePaiement}`}
      )
    `;

    return NextResponse.json({
      ok:true,
      reference,
      statut:"EN_ATTENTE",
      message:"Demande de paiement enregistrée.",
    });
  } catch (erreur) {
    console.error("INITIATION PAIEMENT ABONNEMENT:", erreur);
    return NextResponse.json({ ok:false, message:"Erreur interne pendant l’initiation du paiement." }, { status:500 });
  }
}
