import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const LONGUEUR_CLE = 64;

export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const sel = randomBytes(16).toString("hex");
  const cle = (await scrypt(motDePasse, sel, LONGUEUR_CLE)) as Buffer;
  return `scrypt:${sel}:${cle.toString("hex")}`;
}

export async function verifierMotDePasse(
  motDePasse: string,
  valeurStockee: string,
): Promise<boolean> {
  const [algorithme, sel, hashHex] = valeurStockee.split(":");
  if (algorithme !== "scrypt" || !sel || !hashHex) return false;

  const hashStocke = Buffer.from(hashHex, "hex");
  const hashPropose = (await scrypt(motDePasse, sel, hashStocke.length)) as Buffer;

  return hashStocke.length === hashPropose.length && timingSafeEqual(hashStocke, hashPropose);
}
