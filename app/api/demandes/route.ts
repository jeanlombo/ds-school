import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["TARIFICATION", "DEMONSTRATION", "INFORMATION", "ASSISTANCE", "INSCRIPTION"]);

function txt(v: unknown, max = 255) {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = txt(body.type, 30).toUpperCase();
    const nomEtablissement = txt(body.nomEtablissement, 190);
    const typeEtablissement = txt(body.typeEtablissement, 60).toUpperCase();
    const nomResponsable = txt(body.nomResponsable, 190);
    const telephone = txt(body.telephone, 60);
    const email = txt(body.email, 190).toLowerCase();
    const message = txt(body.message, 4000);
    const effectifBrut = Number(body.effectif ?? 0);
    const effectif = Number.isFinite(effectifBrut) && effectifBrut > 0 ? Math.floor(effectifBrut) : null;

    if (!TYPES.has(type)) {
      return NextResponse.json({ ok: false, message: "Type de demande invalide." }, { status: 400 });
    }
    if (!nomEtablissement || !nomResponsable || !telephone) {
      return NextResponse.json({ ok: false, message: "Établissement, responsable et téléphone sont obligatoires." }, { status: 400 });
    }
    if (type === "TARIFICATION" && !effectif) {
      return NextResponse.json({ ok: false, message: "L'effectif est obligatoire pour une demande de tarification." }, { status: 400 });
    }

    const reference = `DSD-${new Date().toISOString().slice(0,10).replaceAll("-", "")}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0].trim().slice(0, 64) || null;

    await prisma.$executeRaw`
      INSERT INTO demandes_vitrine
      (reference_demande,type_demande,nom_etablissement,type_etablissement,effectif,nom_responsable,telephone,email,message,statut,source,adresse_ip)
      VALUES
      (${reference},${type},${nomEtablissement},${typeEtablissement || null},${effectif},${nomResponsable},${telephone},${email || null},${message || null},'NOUVELLE','VITRINE',${ip})
    `;

    return NextResponse.json({ ok: true, reference, message: "Votre demande a bien été enregistrée." });
  } catch (e) {
    console.error("DEMANDE VITRINE", e);
    return NextResponse.json({ ok: false, message: "Impossible d'enregistrer la demande pour le moment." }, { status: 500 });
  }
}
