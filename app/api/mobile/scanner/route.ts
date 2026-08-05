import { NextRequest, NextResponse } from "next/server";
import { exigerPermissionApi } from "@/lib/securite/api";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Direction = "AUTO" | "ENTREE" | "SORTIE";

type PlageHoraire = {
  id: number;
  nom: string;
  type_passage: "ENTREE" | "SORTIE";
  heure_debut: string;
  heure_fin: string;
  jours_semaine: string;
  classe_id: number | null;
  tolerance_doublon_secondes: number;
  fuseau_horaire: string;
};

function extraire(code: string, libelle: string) {
  const expression = new RegExp(
    `${libelle}\\s*:\\s*([^\\n\\r]+)`,
    "i"
  );

  return code.match(expression)?.[1]?.trim() || null;
}

function normaliserCode(code: string) {
  const brut = code.trim();
  const identifiantTexte = extraire(
    brut,
    "Identifiant"
  );
  const matriculeTexte = extraire(
    brut,
    "Matricule"
  );

  const identifiant = identifiantTexte
    ? Number(identifiantTexte)
    : null;

  return {
    brut,
    identifiant:
      identifiant &&
      Number.isInteger(identifiant) &&
      identifiant > 0
        ? identifiant
        : null,
    matricule:
      matriculeTexte ||
      (!brut.includes("\n") ? brut : null),
  };
}

function heureLocale(
  date: Date,
  fuseau: string
) {
  const morceaux =
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: fuseau,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

  const valeur = (type: string) =>
    morceaux.find((item) => item.type === type)
      ?.value || "";

  const jours: Record<string, number> = {
    lun: 1,
    mar: 2,
    mer: 3,
    jeu: 4,
    ven: 5,
    sam: 6,
    dim: 0,
  };

  const jourTexte = valeur("weekday")
    .toLowerCase()
    .slice(0, 3);

  const heure = Number(valeur("hour"));
  const minute = Number(valeur("minute"));
  const seconde = Number(valeur("second"));

  return {
    jour: jours[jourTexte] ?? date.getDay(),
    secondes:
      heure * 3600 + minute * 60 + seconde,
    heureAffichee: `${String(heure).padStart(
      2,
      "0"
    )}:${String(minute).padStart(2, "0")}`,
  };
}

function secondesDepuisMinuit(heure: string) {
  const [h = "0", m = "0", s = "0"] =
    heure.split(":");

  return (
    Number(h) * 3600 +
    Number(m) * 60 +
    Number(s)
  );
}

function dansLaPlage(
  maintenant: number,
  debut: number,
  fin: number
) {
  if (debut <= fin) {
    return maintenant >= debut && maintenant <= fin;
  }

  // Plage traversant minuit, par exemple 21:00 → 01:00.
  return maintenant >= debut || maintenant <= fin;
}

function jourAutorise(
  jours: string,
  jour: number
) {
  return jours
    .split(",")
    .map((valeur) => Number(valeur.trim()))
    .includes(jour);
}

async function trouverCarte(
  db: any,
  scan: ReturnType<typeof normaliserCode>
) {
  const candidats = [
    scan.brut.toUpperCase(),
    scan.matricule?.toUpperCase(),
    scan.identifiant
      ? `ELEVE:${scan.identifiant}`
      : null,
  ].filter(Boolean) as string[];

  let carte = await db.carteRfid.findFirst({
    where: {
      OR: candidats.flatMap((code) => [
        { uid: code },
        { numeroInterne: code },
      ]),
    },
  });

  if (
    !carte &&
    (scan.identifiant || scan.matricule)
  ) {
    const eleve = await db.eleve.findFirst({
      where: scan.identifiant
        ? { id: scan.identifiant }
        : { matricule: scan.matricule },
      include: {
        inscriptions: {
          include: {
            classe: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (eleve) {
      const inscription = eleve.inscriptions[0];
      const uid = `ELEVE:${eleve.id}`;
      const nom = [
        eleve.nom,
        eleve.postnom,
        eleve.prenom,
      ]
        .filter(Boolean)
        .join(" ");

      carte = await db.carteRfid.upsert({
        where: {
          uid,
        },
        update: {
          numeroInterne: eleve.matricule,
          nomProprietaire: nom,
          photoProprietaire: eleve.photo,
          classeOuFonction:
            inscription?.classe?.nom || "Élève",
          statut:
            eleve.statut === "actif"
              ? "ACTIVE"
              : "SUSPENDUE",
        },
        create: {
          uid,
          numeroInterne: eleve.matricule,
          typeProprietaire: "ELEVE",
          proprietaireId: eleve.id,
          nomProprietaire: nom,
          photoProprietaire: eleve.photo,
          classeOuFonction:
            inscription?.classe?.nom || "Élève",
          statut:
            eleve.statut === "actif"
              ? "ACTIVE"
              : "SUSPENDUE",
        },
      });
    }
  }

  return carte;
}

async function contexteEleve(
  db: any,
  carte: any
) {
  if (
    carte?.typeProprietaire !== "ELEVE" ||
    !carte.proprietaireId
  ) {
    return {
      classeId: null as number | null,
    };
  }

  const eleve = await db.eleve.findUnique({
    where: {
      id: Number(carte.proprietaireId),
    },
    include: {
      inscriptions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return {
    classeId:
      eleve?.inscriptions?.[0]?.classeId ?? null,
  };
}

export async function POST(
  request: NextRequest
) {
  const securite = await exigerPermissionApi(
    "SAFE_CAMPUS_VOIR"
  );

  if (!securite.autorise) {
    return securite.reponse;
  }

  try {
    const body = await request.json();

    const scan = normaliserCode(
      String(body.uid || "")
    );

    const directionDemandee = String(
      body.direction || "AUTO"
    ).toUpperCase() as Direction;

    const dateDemandee = body.dateScan
      ? new Date(String(body.dateScan))
      : new Date();

    const dateScan = Number.isNaN(
      dateDemandee.getTime()
    )
      ? new Date()
      : dateDemandee;

    if (!scan.brut) {
      return NextResponse.json(
        {
          ok: false,
          message: "Code QR ou UID obligatoire.",
        },
        {
          status: 400,
        }
      );
    }

    const db = prisma as any;
    const ecole = await obtenirOuCreerEcole();
    const carte = await trouverCarte(db, scan);

    const adresseIpSource =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null;

    if (!carte) {
      return NextResponse.json(
        {
          ok: false,
          resultat: "CARTE_INCONNUE",
          message:
            "Carte inconnue — accès refusé.",
        },
        {
          status: 404,
        }
      );
    }

    if (carte.statut !== "ACTIVE") {
      return NextResponse.json(
        {
          ok: false,
          resultat: "CARTE_INACTIVE",
          message: `Accès refusé — carte ${String(
            carte.statut
          ).toLowerCase()}.`,
          personne: {
            nom: carte.nomProprietaire,
            type: carte.typeProprietaire,
            classeOuFonction:
              carte.classeOuFonction,
            photo: carte.photoProprietaire,
          },
        },
        {
          status: 403,
        }
      );
    }

    const contexte = await contexteEleve(
      db,
      carte
    );

    const plages =
      await prisma.$queryRaw<PlageHoraire[]>`
        SELECT
          id,
          nom,
          type_passage,
          TIME_FORMAT(
            heure_debut,
            '%H:%i:%s'
          ) AS heure_debut,
          TIME_FORMAT(
            heure_fin,
            '%H:%i:%s'
          ) AS heure_fin,
          jours_semaine,
          classe_id,
          tolerance_doublon_secondes,
          fuseau_horaire
        FROM safe_campus_plages_horaires
        WHERE ecole_id = ${ecole.id}
          AND actif = 1
          AND (
            classe_id IS NULL
            OR classe_id = ${contexte.classeId}
          )
        ORDER BY
          CASE
            WHEN classe_id IS NOT NULL THEN 0
            ELSE 1
          END,
          heure_debut ASC
      `;

    if (!plages.length) {
      return NextResponse.json(
        {
          ok: false,
          resultat: "CONFIGURATION_ABSENTE",
          message:
            "Aucune plage horaire Safe Campus n’est configurée pour cette classe.",
          personne: {
            nom: carte.nomProprietaire,
            type: carte.typeProprietaire,
            classeOuFonction:
              carte.classeOuFonction,
            photo: carte.photoProprietaire,
          },
        },
        {
          status: 422,
        }
      );
    }

    const fuseau =
      plages[0]?.fuseau_horaire ||
      "Africa/Kinshasa";

    const heure = heureLocale(
      dateScan,
      fuseau
    );

    const plage = plages.find((item) => {
      if (
        !jourAutorise(
          item.jours_semaine,
          heure.jour
        )
      ) {
        return false;
      }

      return dansLaPlage(
        heure.secondes,
        secondesDepuisMinuit(
          item.heure_debut
        ),
        secondesDepuisMinuit(item.heure_fin)
      );
    });

    if (!plage) {
      return NextResponse.json(
        {
          ok: false,
          resultat: "HORS_PLAGE",
          message:
            `Scan refusé à ${heure.heureAffichee} : ` +
            "aucune plage d’entrée ou de sortie n’est ouverte.",
          personne: {
            nom: carte.nomProprietaire,
            type: carte.typeProprietaire,
            classeOuFonction:
              carte.classeOuFonction,
            photo: carte.photoProprietaire,
          },
          dateHeure: dateScan.toISOString(),
        },
        {
          status: 422,
        }
      );
    }

    /*
     * La plage horaire est prioritaire.
     * Cela empêche un deuxième scan pendant la plage d’entrée
     * d’être transformé automatiquement en sortie.
     */
    const direction = plage.type_passage;

    /*
     * Anti-double scan :
     * un même passage dans le délai configuré n’est pas réinséré.
     */
    const depuis = new Date(
      dateScan.getTime() -
        Math.max(
          Number(
            plage.tolerance_doublon_secondes
          ) || 120,
          10
        ) *
          1000
    );

    const doublon =
      await db.passageRfid.findFirst({
        where: {
          carteId: carte.id,
          resultat: "AUTORISE",
          direction,
          dateHeure: {
            gte: depuis,
            lte: dateScan,
          },
        },
        orderBy: {
          dateHeure: "desc",
        },
      });

    if (doublon) {
      return NextResponse.json({
        ok: true,
        resultat: "DEJA_ENREGISTRE",
        message:
          `${direction === "ENTREE" ? "Entrée" : "Sortie"} ` +
          "déjà enregistrée récemment.",
        direction,
        plage: plage.nom,
        doublon: true,
        personne: {
          nom: carte.nomProprietaire,
          type: carte.typeProprietaire,
          classeOuFonction:
            carte.classeOuFonction,
          photo: carte.photoProprietaire,
        },
        dateHeure: doublon.dateHeure,
      });
    }

    const passage =
      await db.passageRfid.create({
        data: {
          carteId: carte.id,
          uidLu: carte.uid,
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
              ? `Entrée enregistrée — ${plage.nom}.`
              : `Sortie enregistrée — ${plage.nom}.`,
          adresseIpSource,
          dateHeure: dateScan,
        },
      });

    return NextResponse.json({
      ok: true,
      resultat: "AUTORISE",
      message:
        direction === "ENTREE"
          ? "Entrée enregistrée."
          : "Sortie enregistrée.",
      direction,
      plage: plage.nom,
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
      error
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
      }
    );
  }
}
