import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const NOM_COOKIE_SESSION = "ds_school_session";
const DUREE_SESSION_MS = 8 * 60 * 60 * 1000;

function hacherJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

export async function creerSession(utilisateurId: number): Promise<string> {
  const jeton = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      jetonHash: hacherJeton(jeton),
      utilisateurId,
      expireAt: new Date(Date.now() + DUREE_SESSION_MS),
    },
  });
  return jeton;
}

async function chargerSecurite(email: string) {
  const comptes = await prisma.$queryRaw<Array<{
    id: number;
    role_code: string;
  }>>`
    SELECT us.id, rs.code AS role_code
    FROM utilisateurs_securite us
    INNER JOIN utilisateurs_roles_securite ur
      ON ur.utilisateur_id = us.id
      AND ur.actif = 1
      AND ur.principal = 1
    INNER JOIN roles_securite rs
      ON rs.id = ur.role_id
      AND rs.actif = 1
    WHERE LOWER(us.email) = LOWER(${email})
      AND UPPER(us.statut) = 'ACTIF'
    LIMIT 1
  `;

  const compte = comptes[0];

  if (!compte) {
    return {
      permissions: [] as string[],
      superAdministrateur: false,
      utilisateurSecuriteId: null as number | null,
    };
  }

  if (compte.role_code === "SUPER_ADMIN") {
    return {
      permissions: ["*"],
      superAdministrateur: true,
      utilisateurSecuriteId: compte.id,
    };
  }

  const lignes = await prisma.$queryRaw<Array<{
    code: string;
    decision: "AUTORISER" | "REFUSER";
    source: "ROLE" | "UTILISATEUR";
  }>>`
    SELECT p.code, 'AUTORISER' AS decision, 'ROLE' AS source
    FROM utilisateurs_roles_securite ur
    INNER JOIN roles_permissions_securite rp ON rp.role_id = ur.role_id
    INNER JOIN permissions_securite p
      ON p.id = rp.permission_id
      AND p.actif = 1
    WHERE ur.utilisateur_id = ${compte.id}
      AND ur.actif = 1

    UNION ALL

    SELECT p.code, up.decision, 'UTILISATEUR' AS source
    FROM utilisateurs_permissions_securite up
    INNER JOIN permissions_securite p
      ON p.id = up.permission_id
      AND p.actif = 1
    WHERE up.utilisateur_id = ${compte.id}
      AND up.actif = 1
  `;

  const permissions = new Set<string>();

  for (const ligne of lignes) {
    if (ligne.source === "ROLE" && ligne.decision === "AUTORISER") {
      permissions.add(ligne.code);
    }
  }

  for (const ligne of lignes) {
    if (ligne.source !== "UTILISATEUR") continue;
    if (ligne.decision === "REFUSER") permissions.delete(ligne.code);
    else permissions.add(ligne.code);
  }

  return {
    permissions: [...permissions],
    superAdministrateur: false,
    utilisateurSecuriteId: compte.id,
  };
}

export async function obtenirUtilisateurConnecte() {
  const magasinCookies = await cookies();
  const jeton = magasinCookies.get(NOM_COOKIE_SESSION)?.value;
  if (!jeton) return null;

  const session = await prisma.session.findUnique({
    where: { jetonHash: hacherJeton(jeton) },
    include: {
      utilisateur: {
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          statut: true,
        },
      },
    },
  });

  if (
    !session ||
    session.expireAt <= new Date() ||
    session.utilisateur.statut !== "actif"
  ) {
    if (session) {
      await prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => undefined);
    }
    return null;
  }

  try {
    const securite = await chargerSecurite(session.utilisateur.email);

    return {
      ...session.utilisateur,
      permissions: securite.permissions,
      superAdministrateur: securite.superAdministrateur,
      utilisateurSecuriteId: securite.utilisateurSecuriteId,
    };
  } catch (erreur) {
    console.error("Erreur RBAC stricte :", erreur);

    return {
      ...session.utilisateur,
      permissions: [] as string[],
      superAdministrateur: false,
      utilisateurSecuriteId: null,
    };
  }
}

export async function supprimerSession(jeton?: string): Promise<void> {
  if (!jeton) return;
  await prisma.session.deleteMany({
    where: { jetonHash: hacherJeton(jeton) },
  });
}
