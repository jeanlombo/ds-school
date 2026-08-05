import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { exigerPermissionApi } from "@/lib/securite/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Direction = "AUTO" | "ENTREE" | "SORTIE";

function debutDuJour(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function normaliserDirection(value: unknown): Direction {
  const direction = String(value ?? "AUTO")
    .trim()
    .toUpperCase();

  if (direction === "ENTREE" || direction === "SORTIE") {
    return direction;
  }

  return "AUTO";
}

function obtenirAdresseIp(
  request: NextRequest,
): string | null {
  const forwardedFor =
    request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return (
      forwardedFor.split(",")[0]?.trim() || null
    );
  }

  return request.headers.get("x-real-ip");
}

async function determinerDirectionAutomatique(
  db: any,
  filtre: Record<string, unknown>,
): Promise<"ENTREE" | "SORTIE"> {
  const dernierPassage =
    await db.passageRfid.findFirst({
      where: {
        ...filtre,
        resultat: "AUTORISE",
        dateHeure: {
          gte: debutDuJour(),
        },
      },
      orderBy: {
        dateHeure: "desc",
      },
      select: {
        direction: true,
      },
    });

  return !dernierPassage ||
    dernierPassage.direction === "SORTIE"
    ? "ENTREE"
    : "SORTIE";
}

export async function POST(
  request: NextRequest,
) {
  const securite =
    await exigerPermissionApi(
      "SAFE_CAMPUS_VOIR",
    );

  if (!securite.autorise) {
    return securite.reponse;
  }

  try {
    const body = (await request.json()) as {
      uid?: unknown;
      direction?: unknown;
    };

    const codeNormalise = String(
      body.uid ?? "",
    )
      .trim()
      .toUpperCase();

    const directionDemandee =
      normaliserDirection(body.direction);

    const adresseIpSource =
      obtenirAdresseIp(request);

    const db = prisma as any;

    if (!codeNormalise) {
      return NextResponse.json(
        {
          ok: false,
          resultat: "CODE_MANQUANT",
          message:
            "Code QR ou UID obligatoire.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 1. Recherche d'abord un élève
     * à partir du matricule contenu dans le QR.
     */
    const eleve = await db.eleve.findFirst({
      where: {
        matricule: codeNormalise,
      },
      include: {
        inscriptions: {
          include: {
            classe: {
              include: {
                section: true,
              },
            },
            anneeScolaire: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (eleve) {
      const inscription =
        eleve.inscriptions?.[0] ?? null;

      const nomComplet = [
        eleve.nom,
        eleve.postnom,
        eleve.prenom,
      ]
        .filter(Boolean)
        .join(" ");

      const classeOuFonction =
        inscription?.classe
          ? [
              inscription.classe.nom,
              inscription.classe.section?.nom,
            ]
              .filter(Boolean)
              .join(" — ")
          : "Élève";

      const direction =
        directionDemandee === "AUTO"
          ? await determinerDirectionAutomatique(
              db,
              {
                typeProprietaire: "ELEVE",
                proprietaireId: eleve.id,
              },
            )
          : directionDemandee;

      const passage =
        await db.passageRfid.create({
          data: {
            uidLu: codeNormalise,
            typeProprietaire: "ELEVE",
            proprietaireId: eleve.id,
            nomProprietaire: nomComplet,
            photoProprietaire:
              eleve.photo ?? null,
            classeOuFonction,
            direction,
            resultat: "AUTORISE",
            message:
              direction === "ENTREE"
                ? "Entrée autorisée par QR élève."
                : "Sortie enregistrée par QR élève.",
            adresseIpSource,
          },
        });

      return NextResponse.json({
        ok: true,
        resultat: "AUTORISE",
        message:
          direction === "ENTREE"
            ? "Bienvenue ! Entrée enregistrée."
            : "Sortie enregistrée.",
        direction,
        modeScan: "QR_MATRICULE",
        personne: {
          id: eleve.id,
          matricule: eleve.matricule,
          nom: nomComplet,
          type: "ELEVE",
          classeOuFonction,
          photo: eleve.photo ?? null,
        },
        dateHeure: passage.dateHeure,
      });
    }

    /*
     * 2. Si aucun élève ne correspond,
     * recherche d'une carte RFID/NFC.
     */
    const carte =
      await db.carteRfid.findUnique({
        where: {
          uid: codeNormalise,
        },
      });

    if (!carte) {
      const passage =
        await db.passageRfid.create({
          data: {
            uidLu: codeNormalise,
            direction:
              directionDemandee === "SORTIE"
                ? "SORTIE"
                : "ENTREE",
            resultat: "CARTE_INCONNUE",
            message:
              "Code QR ou carte inconnu.",
            adresseIpSource,
          },
        });

      return NextResponse.json(
        {
          ok: false,
          resultat: passage.resultat,
          message:
            "Carte ou QR inconnu — accès refusé.",
          dateHeure: passage.dateHeure,
        },
        {
          status: 404,
        },
      );
    }

    if (carte.statut !== "ACTIVE") {
      const passage =
        await db.passageRfid.create({
          data: {
            carteId: carte.id,
            uidLu: codeNormalise,
            typeProprietaire:
              carte.typeProprietaire,
            proprietaireId:
              carte.proprietaireId,
            nomProprietaire:
              carte.nomProprietaire,
            photoProprietaire:
              carte.photoProprietaire,
            classeOuFonction:
              carte.classeOuFonction,
            direction:
              directionDemandee === "SORTIE"
                ? "SORTIE"
                : "ENTREE",
            resultat: "CARTE_INACTIVE",
            message: `Carte ${String(
              carte.statut,
            ).toLowerCase()}.`,
            adresseIpSource,
          },
        });

      return NextResponse.json(
        {
          ok: false,
          resultat: passage.resultat,
          message: `Accès refusé — carte ${String(
            carte.statut,
          ).toLowerCase()}.`,
          personne: {
            nom: carte.nomProprietaire,
            type: carte.typeProprietaire,
            classeOuFonction:
              carte.classeOuFonction,
            photo:
              carte.photoProprietaire,
          },
          dateHeure: passage.dateHeure,
        },
        {
          status: 403,
        },
      );
    }

    const direction =
      directionDemandee === "AUTO"
        ? await determinerDirectionAutomatique(
            db,
            {
              carteId: carte.id,
            },
          )
        : directionDemandee;

    const passage =
      await db.passageRfid.create({
        data: {
          carteId: carte.id,
          uidLu: codeNormalise,
          typeProprietaire:
            carte.typeProprietaire,
          proprietaireId:
            carte.proprietaireId,
          nomProprietaire:
            carte.nomProprietaire,
          photoProprietaire:
            carte.photoProprietaire,
          classeOuFonction:
            carte.classeOuFonction,
          direction,
          resultat: "AUTORISE",
          message:
            direction === "ENTREE"
              ? "Entrée autorisée par carte."
              : "Sortie enregistrée par carte.",
          adresseIpSource,
        },
      });

    return NextResponse.json({
      ok: true,
      resultat: "AUTORISE",
      message:
        direction === "ENTREE"
          ? "Bienvenue ! Entrée enregistrée."
          : "Sortie enregistrée.",
      direction,
      modeScan: "RFID_NFC",
      personne: {
        nom: carte.nomProprietaire,
        type: carte.typeProprietaire,
        classeOuFonction:
          carte.classeOuFonction,
        photo: carte.photoProprietaire,
      },
      dateHeure: passage.dateHeure,
    });
  } catch (error) {
    console.error(
      "MOBILE SCANNER ERROR:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        resultat: "ERREUR",
        message:
          "Erreur interne pendant le scan.",
      },
      {
        status: 500,
      },
    );
  }
}