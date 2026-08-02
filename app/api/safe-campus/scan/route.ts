import { exigerCleApiSafeCampus } from "@/lib/securite/api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function debutDuJour() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(request: NextRequest) {
  const refusApi = exigerCleApiSafeCampus(request);
  if (refusApi) return refusApi;
  try {
    const body = await request.json();
    const uid = String(body.uid || "").trim().toUpperCase();
    const lecteurId = body.lecteurId ? Number(body.lecteurId) : null;
    const directionDemandee = String(body.direction || "AUTO").toUpperCase();

    if (!uid) {
      return NextResponse.json(
        { ok: false, resultat: "REFUSE", message: "UID obligatoire." },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const carte = await db.carteRfid.findUnique({ where: { uid } });

    if (!carte) {
      const passage = await db.passageRfid.create({
        data: {
          uidLu: uid,
          lecteurId,
          direction: directionDemandee === "SORTIE" ? "SORTIE" : "ENTREE",
          resultat: "CARTE_INCONNUE",
          message: "Carte inconnue.",
          adresseIpSource:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            null,
        },
      });

      return NextResponse.json({
        ok: false,
        resultat: passage.resultat,
        message: "Carte inconnue — accès refusé.",
        dateHeure: passage.dateHeure,
      });
    }

    if (carte.statut !== "ACTIVE") {
      const passage = await db.passageRfid.create({
        data: {
          carteId: carte.id,
          lecteurId,
          uidLu: uid,
          typeProprietaire: carte.typeProprietaire,
          proprietaireId: carte.proprietaireId,
          nomProprietaire: carte.nomProprietaire,
          photoProprietaire: carte.photoProprietaire,
          classeOuFonction: carte.classeOuFonction,
          direction: directionDemandee === "SORTIE" ? "SORTIE" : "ENTREE",
          resultat: "CARTE_INACTIVE",
          message: `Carte ${carte.statut.toLowerCase()}.`,
        },
      });

      return NextResponse.json({
        ok: false,
        resultat: passage.resultat,
        message: `Accès refusé — carte ${carte.statut.toLowerCase()}.`,
        personne: {
          nom: carte.nomProprietaire,
          type: carte.typeProprietaire,
          classeOuFonction: carte.classeOuFonction,
          photo: carte.photoProprietaire,
        },
        dateHeure: passage.dateHeure,
      });
    }

    let direction = directionDemandee;

    if (directionDemandee === "AUTO") {
      const dernier = await db.passageRfid.findFirst({
        where: {
          carteId: carte.id,
          resultat: "AUTORISE",
          dateHeure: { gte: debutDuJour() },
        },
        orderBy: { dateHeure: "desc" },
      });

      direction = !dernier || dernier.direction === "SORTIE" ? "ENTREE" : "SORTIE";
    }

    if (lecteurId) {
      await db.lecteurRfid.update({
        where: { id: lecteurId },
        data: { derniereActivite: new Date() },
      }).catch(() => null);
    }

    const passage = await db.passageRfid.create({
      data: {
        carteId: carte.id,
        lecteurId,
        uidLu: uid,
        typeProprietaire: carte.typeProprietaire,
        proprietaireId: carte.proprietaireId,
        nomProprietaire: carte.nomProprietaire,
        photoProprietaire: carte.photoProprietaire,
        classeOuFonction: carte.classeOuFonction,
        direction,
        resultat: "AUTORISE",
        message: direction === "ENTREE" ? "Entrée autorisée." : "Sortie autorisée.",
        adresseIpSource:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          null,
      },
    });

    return NextResponse.json({
      ok: true,
      resultat: "AUTORISE",
      message: direction === "ENTREE" ? "Bienvenue !" : "Sortie enregistrée.",
      direction,
      personne: {
        nom: carte.nomProprietaire,
        type: carte.typeProprietaire,
        classeOuFonction: carte.classeOuFonction,
        photo: carte.photoProprietaire,
      },
      dateHeure: passage.dateHeure,
    });
  } catch (error) {
    console.error("SAFE CAMPUS SCAN ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        resultat: "ERREUR",
        message: "Erreur interne pendant la lecture RFID.",
      },
      { status: 500 }
    );
  }
}
