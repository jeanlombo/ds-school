import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const TYPES_AUTORISES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const TAILLE_MAXIMALE = 3 * 1024 * 1024;
const PREFIXE_URL = "/api/fichiers/eleves/";

function dossierStockage(): string {
  return (
    process.env.ELEVE_UPLOAD_DIR?.trim() ||
    path.join(
      process.env.ECOLE_UPLOAD_DIR
        ? path.dirname(process.env.ECOLE_UPLOAD_DIR)
        : path.join(process.cwd(), "storage"),
      "eleves"
    )
  );
}

function nomDepuisUrl(url: string): string | null {
  if (url.startsWith(PREFIXE_URL)) {
    const nom = decodeURIComponent(
      url.slice(PREFIXE_URL.length)
    );

    return /^[a-zA-Z0-9._-]+$/.test(nom)
      ? nom
      : null;
  }

  return null;
}

export async function enregistrerPhotoEleve({
  eleveId,
  fichier,
  anciennePhoto,
}: {
  eleveId: number;
  fichier: FormDataEntryValue | null;
  anciennePhoto: string | null;
}): Promise<string | null> {
  if (!(fichier instanceof File) || fichier.size === 0) {
    return null;
  }

  const extension = TYPES_AUTORISES.get(fichier.type);

  if (!extension) {
    throw new Error("photo_format");
  }

  if (
    fichier.size <= 0 ||
    fichier.size > TAILLE_MAXIMALE
  ) {
    throw new Error("photo_taille");
  }

  const dossier = dossierStockage();

  await mkdir(dossier, {
    recursive: true,
  });

  const identifiant = crypto
    .randomBytes(8)
    .toString("hex");

  const nomFichier =
    `photo-eleve-${eleveId}-${Date.now()}-${identifiant}.${extension}`;

  const chemin = path.join(
    dossier,
    nomFichier
  );

  try {
    await writeFile(
      chemin,
      Buffer.from(await fichier.arrayBuffer()),
      {
        flag: "wx",
      }
    );
  } catch (erreur) {
    console.error(
      "Erreur écriture photo élève :",
      erreur
    );
    throw new Error("photo_upload");
  }

  if (anciennePhoto) {
    await supprimerPhotoEleve(anciennePhoto);
  }

  return `${PREFIXE_URL}${encodeURIComponent(
    nomFichier
  )}`;
}

export async function supprimerPhotoEleve(
  url: string
): Promise<void> {
  const nom = nomDepuisUrl(url);

  if (!nom) {
    return;
  }

  await unlink(
    path.join(dossierStockage(), nom)
  ).catch(() => undefined);
}

export async function lirePhotoEleve(
  nom: string
): Promise<Buffer | null> {
  if (!/^[a-zA-Z0-9._-]+$/.test(nom)) {
    return null;
  }

  return readFile(
    path.join(dossierStockage(), nom)
  ).catch(() => null);
}

export function typeMimePhotoEleve(
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
