import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermissionApi } from "@/lib/securite/api";
import {
  rechercherGutenberg,
  rechercherOpenLibrary,
  type ResultatBibliotheque,
} from "@/lib/bibliotheque/catalogues-externes";

export const dynamic = "force-dynamic";

type SourceDemandee = "TOUTES" | "INTERNE" | "OPEN_LIBRARY" | "GUTENBERG";

function sourceValide(valeur: string | null): SourceDemandee {
  const source = String(valeur ?? "TOUTES").toUpperCase();

  if (
    source === "INTERNE" ||
    source === "OPEN_LIBRARY" ||
    source === "GUTENBERG"
  ) {
    return source;
  }

  return "TOUTES";
}

async function rechercherCatalogueInterne(
  recherche: string,
  ecoleId: number
): Promise<ResultatBibliotheque[]> {
  const lignes = await prisma.$queryRaw<
    Array<{
      id: number;
      titre: string;
      code_ressource: string;
      type_ressource: string;
      url_couverture: string | null;
      url_fichier: string | null;
      annee_publication: number | null;
      auteur: string | null;
      resume: string | null;
    }>
  >`
    SELECT
      r.id,
      r.titre,
      r.code_ressource,
      r.type_ressource,
      r.url_couverture,
      r.url_fichier,
      r.annee_publication,
      CONCAT_WS(' ', a.nom, a.prenom) AS auteur,
      r.resume
    FROM bibliotheque_ressources r
    LEFT JOIN bibliotheque_auteurs a ON a.id = r.auteur_id
    WHERE r.ecole_id = ${ecoleId}
      AND r.statut = 'PUBLIE'
      AND (
        r.titre LIKE CONCAT('%', ${recherche}, '%')
        OR r.code_ressource LIKE CONCAT('%', ${recherche}, '%')
        OR r.isbn LIKE CONCAT('%', ${recherche}, '%')
        OR r.mots_cles LIKE CONCAT('%', ${recherche}, '%')
        OR r.resume LIKE CONCAT('%', ${recherche}, '%')
      )
    ORDER BY r.created_at DESC
    LIMIT 30
  `;

  return lignes.map((ligne) => ({
    id: `INT-${ligne.id}`,
    source: "INTERNE",
    titre: ligne.titre,
    auteurs: ligne.auteur ? [ligne.auteur] : [],
    annee: ligne.annee_publication,
    langues: ["fr"],
    couverture: ligne.url_couverture,
    lien:
      ligne.url_fichier ||
      `/dashboard/bibliotheque/ressources/${ligne.id}`,
    format: ligne.type_ressource,
    lectureDisponible: true,
    licence: "Ressource autorisée par l’établissement",
    description: ligne.resume,
  }));
}

export async function GET(request: NextRequest) {
  const securite = await exigerPermissionApi(
    "BIBLIOTHEQUE_RESSOURCES_VOIR"
  );

  if (!securite.autorise) {
    return securite.reponse;
  }

  const recherche = String(
    request.nextUrl.searchParams.get("q") ?? ""
  ).trim();
  const langue = String(
    request.nextUrl.searchParams.get("langue") ?? "fr"
  ).trim();
  const source = sourceValide(
    request.nextUrl.searchParams.get("source")
  );

  if (recherche.length < 2) {
    return NextResponse.json(
      {
        ok: false,
        erreur: "SAISIE_TROP_COURTE",
        message: "Saisissez au moins deux caractères.",
      },
      { status: 400 }
    );
  }

  if (recherche.length > 120) {
    return NextResponse.json(
      {
        ok: false,
        erreur: "SAISIE_TROP_LONGUE",
        message: "La recherche est trop longue.",
      },
      { status: 400 }
    );
  }

  const ecole = await obtenirOuCreerEcole();
  const erreurs: string[] = [];

  const taches: Array<Promise<ResultatBibliotheque[]>> = [];

  if (source === "TOUTES" || source === "INTERNE") {
    taches.push(
      rechercherCatalogueInterne(recherche, ecole.id).catch((erreur) => {
        console.error("Recherche interne impossible :", erreur);
        erreurs.push("Catalogue interne indisponible");
        return [];
      })
    );
  }

  if (source === "TOUTES" || source === "OPEN_LIBRARY") {
    taches.push(
      rechercherOpenLibrary(recherche, langue).catch((erreur) => {
        console.error("Open Library impossible :", erreur);
        erreurs.push("Open Library indisponible");
        return [];
      })
    );
  }

  if (source === "TOUTES" || source === "GUTENBERG") {
    taches.push(
      rechercherGutenberg(recherche).catch((erreur) => {
        console.error("Project Gutenberg impossible :", erreur);
        erreurs.push("Project Gutenberg indisponible");
        return [];
      })
    );
  }

  const groupes = await Promise.all(taches);
  const resultats = groupes.flat();

  return NextResponse.json({
    ok: true,
    recherche,
    source,
    total: resultats.length,
    resultats,
    erreurs,
    sourcesComplementaires: [
      {
        nom: "African Storybook",
        description:
          "Livres illustrés ouverts dans de nombreuses langues africaines.",
        lien: "https://www.africanstorybook.org/",
        licence: "Creative Commons CC BY 4.0 indiquée par la plateforme",
      },
    ],
  });
}
