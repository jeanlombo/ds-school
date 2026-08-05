import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const TAILLE_MAXIMALE = 5 * 1024 * 1024;
const PREFIXE_URL = "/api/fichiers/ecoles/";

function dossierStockage(): string {
  return (
    process.env.ECOLE_UPLOAD_DIR?.trim() ||
    path.join(
      process.cwd(),
      "storage",
      "ecoles"
    )
  );
}

function nomDepuisUrl(url: string): string | null {
  if (!url.startsWith(PREFIXE_URL)) {
    return null;
  }

  const nom = decodeURIComponent(
    url.slice(PREFIXE_URL.length)
  );

  return /^[a-zA-Z0-9._-]+$/.test(nom)
    ? nom
    : null;
}

export async function enregistrerLogoEcole({
  ecoleId,
  fichier,
  ancienLogo,
}: {
  ecoleId: number;
  fichier: File;
  ancienLogo: string | null;
}): Promise<string> {
  const extension = TYPES.get(fichier.type);

  if (!extension) {
    throw new Error("logo_format");
  }

  if (
    fichier.size <= 0 ||
    fichier.size > TAILLE_MAXIMALE
  ) {
    throw new Error("logo_taille");
  }

  const dossier = dossierStockage();
  await mkdir(dossier, {
    recursive: true,
  });

  const identifiant = crypto
    .randomBytes(8)
    .toString("hex");

  const nomFichier =
    `logo-ecole-${ecoleId}-${Date.now()}-${identifiant}.${extension}`;

  const chemin = path.join(
    dossier,
    nomFichier
  );

  const contenu = Buffer.from(
    await fichier.arrayBuffer()
  );

  try {
    await writeFile(chemin, contenu, {
      flag: "wx",
    });
  } catch (erreur) {
    console.error(
      "Erreur écriture logo école :",
      erreur
    );
    throw new Error("logo_upload");
  }

  if (ancienLogo) {
    await supprimerLogoEcole(ancienLogo);
  }

  return `${PREFIXE_URL}${encodeURIComponent(
    nomFichier
  )}`;
}

export async function supprimerLogoEcole(
  url: string
): Promise<void> {
  const nom = nomDepuisUrl(url);

  if (!nom) {
    return;
  }

  const chemin = path.join(
    dossierStockage(),
    nom
  );

  await unlink(chemin).catch(() => undefined);
}

export async function lireLogoEcole(
  nom: string
): Promise<Buffer | null> {
  if (!/^[a-zA-Z0-9._-]+$/.test(nom)) {
    return null;
  }

  const chemin = path.join(
    dossierStockage(),
    nom
  );

  return readFile(chemin).catch(() => null);
}

export function typeMimeLogo(
  nom: string
): string {
  const extension = path
    .extname(nom)
    .toLowerCase();

  if (
    extension === ".jpg" ||
    extension === ".jpeg"
  ) {
    return "image/jpeg";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "application/octet-stream";
}
