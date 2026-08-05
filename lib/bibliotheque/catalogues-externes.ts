export type SourceBibliotheque =
  | "INTERNE"
  | "OPEN_LIBRARY"
  | "GUTENBERG";

export type ResultatBibliotheque = {
  id: string;
  source: SourceBibliotheque;
  titre: string;
  auteurs: string[];
  annee: number | null;
  langues: string[];
  couverture: string | null;
  lien: string;
  format: string;
  lectureDisponible: boolean;
  licence: string;
  description?: string | null;
};

type OpenLibraryDocument = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  language?: string[];
  ebook_access?: string;
  public_scan_b?: boolean;
  ia?: string[];
};

type OpenLibraryReponse = {
  docs?: OpenLibraryDocument[];
};

const IDENTITE_APPLICATION =
  process.env.BIBLIOTHEQUE_USER_AGENT?.trim() ||
  "DS-School-Enterprise/1.0";

const CONTACT_APPLICATION =
  process.env.BIBLIOTHEQUE_CONTACT_EMAIL?.trim() ||
  process.env.APP_EMAIL?.trim() ||
  "contact@ds-school.local";

const EN_TETES = {
  Accept: "application/json, application/xml, text/xml;q=0.9, */*;q=0.8",
  "User-Agent": `${IDENTITE_APPLICATION} (${CONTACT_APPLICATION})`,
};

function decoderXml(valeur: string): string {
  return valeur
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) =>
      String.fromCharCode(Number(code))
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contenuBalise(bloc: string, balise: string): string {
  const expression = new RegExp(
    `<${balise}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${balise}>`,
    "i"
  );

  const resultat = bloc.match(expression);
  return resultat ? decoderXml(resultat[1]) : "";
}

function attributsBalise(balise: string): Record<string, string> {
  const attributs: Record<string, string> = {};
  const expression = /([\w:-]+)\s*=\s*["']([^"']*)["']/g;
  let resultat: RegExpExecArray | null;

  while ((resultat = expression.exec(balise))) {
    attributs[resultat[1].toLowerCase()] = decoderXml(resultat[2]);
  }

  return attributs;
}

export async function rechercherOpenLibrary(
  recherche: string,
  langue = "fr",
  limite = 16
): Promise<ResultatBibliotheque[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", recherche);
  url.searchParams.set("lang", langue);
  url.searchParams.set("limit", String(limite));
  url.searchParams.set(
    "fields",
    [
      "key",
      "title",
      "author_name",
      "first_publish_year",
      "cover_i",
      "language",
      "ebook_access",
      "public_scan_b",
      "ia",
    ].join(",")
  );

  const reponse = await fetch(url, {
    headers: EN_TETES,
    next: { revalidate: 3600 },
  });

  if (!reponse.ok) {
    throw new Error(`Open Library indisponible (${reponse.status})`);
  }

  const donnees = (await reponse.json()) as OpenLibraryReponse;

  return (donnees.docs ?? [])
    .filter((document) => document.title && document.key)
    .map((document, index) => {
      const identifiantArchive = document.ia?.[0];
      const lecturePublique =
        document.public_scan_b === true ||
        document.ebook_access === "public";

      return {
        id: `OL-${document.key}-${index}`,
        source: "OPEN_LIBRARY" as const,
        titre: document.title || "Sans titre",
        auteurs: document.author_name ?? [],
        annee: document.first_publish_year ?? null,
        langues: document.language ?? [],
        couverture: document.cover_i
          ? `https://covers.openlibrary.org/b/id/${document.cover_i}-M.jpg`
          : null,
        lien:
          lecturePublique && identifiantArchive
            ? `https://archive.org/details/${encodeURIComponent(
                identifiantArchive
              )}`
            : `https://openlibrary.org${document.key}`,
        format: lecturePublique
          ? "Lecture numérique disponible"
          : "Fiche bibliographique / emprunt éventuel",
        lectureDisponible: lecturePublique,
        licence: lecturePublique
          ? "Accès indiqué comme public par Open Library"
          : "Consulter les conditions de la source",
      };
    });
}

export async function rechercherGutenberg(
  recherche: string,
  limite = 16
): Promise<ResultatBibliotheque[]> {
  const url = new URL(
    "https://www.gutenberg.org/ebooks/search.opds/"
  );
  url.searchParams.set("query", recherche);

  const reponse = await fetch(url, {
    headers: {
      ...EN_TETES,
      Accept: "application/atom+xml, application/xml, text/xml",
    },
    next: { revalidate: 3600 },
  });

  if (!reponse.ok) {
    throw new Error(`Project Gutenberg indisponible (${reponse.status})`);
  }

  const xml = await reponse.text();
  const entrees = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];

  return entrees.slice(0, limite).map((entree, index) => {
    const titre = contenuBalise(entree, "title") || "Sans titre";
    const identifiant = contenuBalise(entree, "id");
    const publie = contenuBalise(entree, "published");
    const description =
      contenuBalise(entree, "summary") ||
      contenuBalise(entree, "content") ||
      null;

    const auteurs = Array.from(
      entree.matchAll(/<author\b[\s\S]*?<\/author>/gi)
    )
      .map((resultat) => contenuBalise(resultat[0], "name"))
      .filter(Boolean);

    const liens = Array.from(entree.matchAll(/<link\b[^>]*\/?\s*>/gi))
      .map((resultat) => attributsBalise(resultat[0]))
      .filter((attributs) => Boolean(attributs.href));

    const lienLecture =
      liens.find(
        (lien) =>
          lien.rel?.includes("acquisition") &&
          (lien.type?.includes("text/html") ||
            lien.type?.includes("epub") ||
            lien.type?.includes("plain"))
      ) ||
      liens.find((lien) => lien.rel === "alternate") ||
      liens[0];

    const couverture =
      liens.find(
        (lien) =>
          lien.rel?.includes("image") ||
          lien.rel?.includes("thumbnail")
      )?.href ?? null;

    const annee = publie ? Number(publie.slice(0, 4)) : null;

    return {
      id: `GUT-${identifiant || index}`,
      source: "GUTENBERG" as const,
      titre,
      auteurs,
      annee: Number.isFinite(annee) ? annee : null,
      langues: [],
      couverture,
      lien:
        lienLecture?.href ||
        identifiant ||
        `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(
          recherche
        )}`,
      format: lienLecture?.type || "Livre électronique",
      lectureDisponible: true,
      licence: "Collection Project Gutenberg — vérifier la législation locale",
      description,
    };
  });
}
