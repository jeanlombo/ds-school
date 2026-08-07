import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { obtenirUtilisateurConnecte } from "@/lib/session";

export const COOKIE_ECOLE_ACTIVE = "ds_school_ecole_active";

export type EcoleAccessible = {
  id: number;
  nom: string;
  code: string;
  ville: string | null;
};

export async function listerEcolesAccessibles(): Promise<EcoleAccessible[]> {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) return [];

  if (utilisateur.superAdministrateur) {
    return prisma.$queryRaw<EcoleAccessible[]>`
      SELECT id, nom, code, ville
      FROM ecoles
      WHERE statut = 'active'
      ORDER BY nom ASC
    `;
  }

  const directes = await prisma.$queryRaw<EcoleAccessible[]>`
    SELECT DISTINCT e.id, e.nom, e.code, e.ville
    FROM ecoles e
    INNER JOIN utilisateurs_etablissements ue
      ON ue.ecole_id = e.id
     AND ue.actif = 1
    WHERE ue.utilisateur_id = ${utilisateur.id}
      AND e.statut = 'active'
    ORDER BY e.nom ASC
  `;

  const groupe = await prisma.$queryRaw<EcoleAccessible[]>`
    SELECT DISTINCT e.id, e.nom, e.code, e.ville
    FROM ecoles e
    INNER JOIN organisation_etablissements oe ON oe.ecole_id = e.id
    INNER JOIN utilisateurs_organisations uo
      ON uo.organisation_id = oe.organisation_id
     AND uo.actif = 1
    WHERE uo.utilisateur_id = ${utilisateur.id}
      AND e.statut = 'active'
    ORDER BY e.nom ASC
  `;

  const fusion = new Map<number, EcoleAccessible>();
  [...directes, ...groupe].forEach((e) => fusion.set(Number(e.id), {...e, id:Number(e.id)}));

  // Compatibilité avec les anciens comptes avant leur rattachement.
  if (fusion.size === 0) {
    const premiere = await prisma.ecole.findFirst({
      where: { statut: "active" },
      orderBy: { id: "asc" },
      select: { id:true, nom:true, code:true, ville:true },
    });
    if (premiere) fusion.set(premiere.id, premiere);
  }

  return [...fusion.values()];
}

export async function obtenirEcoleActive() {
  const accessibles = await listerEcolesAccessibles();
  if (!accessibles.length) return null;

  const magasin = await cookies();
  const idCookie = Number(magasin.get(COOKIE_ECOLE_ACTIVE)?.value ?? 0);
  return accessibles.find((e) => e.id === idCookie) ?? accessibles[0];
}

export async function verifierAccesEcole(ecoleId: number): Promise<boolean> {
  const accessibles = await listerEcolesAccessibles();
  return accessibles.some((e) => e.id === ecoleId);
}
