import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";

export type DestinationAutorisee = {
  permission: string;
  href: string;
};

export type ElementMenuProtege<T = unknown> = T & {
  permission: string;
};

export type PerimetrePermission = Readonly<{
  ecoleId?: number;
  classeId?: number;
  anneeScolaireId?: number;
  utilisateurId?: number;
  module?: string;
  ressource?: string;
  action?: string;
}>;

const DESTINATIONS_AUTORISEES: DestinationAutorisee[] = [
  {
    permission: "DASHBOARD_VOIR",
    href: "/dashboard",
  },
  {
    permission: "ANNEES_SCOLAIRES_VOIR",
    href: "/dashboard/annees-scolaires",
  },
  {
    permission: "SECTIONS_VOIR",
    href: "/dashboard/sections",
  },
  {
    permission: "CLASSES_VOIR",
    href: "/dashboard/classes",
  },
  {
    permission: "ELEVES_VOIR",
    href: "/dashboard/eleves",
  },
  {
    permission: "PARENTS_VOIR",
    href: "/dashboard/parents",
  },
  {
    permission: "ENSEIGNANTS_VOIR",
    href: "/dashboard/enseignants",
  },
  {
    permission: "MATIERES_VOIR",
    href: "/dashboard/matieres",
  },
  {
    permission: "PARAMETRES_ACADEMIQUES_VOIR",
    href: "/dashboard/parametres-academiques",
  },
  {
    permission: "EMPLOI_DU_TEMPS_VOIR",
    href: "/dashboard/emploi-du-temps",
  },
  {
    permission: "ACADEMIQUE_VOIR",
    href: "/dashboard/centre-academique",
  },
  {
    permission: "CRM_VOIR",
    href: "/dashboard/crm",
  },
  {
    permission: "SAFE_CAMPUS_VOIR",
    href: "/dashboard/safe-campus",
  },

  {
    permission: "FINANCES_VOIR",
    href: "/dashboard/finances",
  },
  {
    permission: "FINANCES_CATEGORIES_VOIR",
    href: "/dashboard/finances/categories-frais",
  },
  {
    permission: "FINANCES_FRAIS_VOIR",
    href: "/dashboard/finances/frais-scolaires",
  },
  {
    permission: "FINANCES_PAIEMENTS_VOIR",
    href: "/dashboard/finances/paiements",
  },
  {
    permission: "FINANCES_RECUS_VOIR",
    href: "/dashboard/finances/recus",
  },
  {
    permission: "FINANCES_CAISSE_VOIR",
    href: "/dashboard/finances/caisse",
  },
  {
    permission: "FINANCES_ECHEANCIERS_VOIR",
    href: "/dashboard/finances/echeanciers",
  },
  {
    permission: "FINANCES_BOURSES_REMISES_VOIR",
    href: "/dashboard/finances/bourses-remises",
  },
  {
    permission: "FINANCES_RAPPORTS_VOIR",
    href: "/dashboard/finances/rapports",
  },

  {
    permission: "SECURITE_VOIR",
    href: "/dashboard/securite",
  },
  {
    permission: "PARAMETRES_VOIR",
    href: "/dashboard/parametres",
  },
];

function contientPermission(
  permissions: Iterable<string>,
  code: string
): boolean {
  const codes = permissions instanceof Set
    ? permissions
    : new Set(permissions);

  return codes.has("*") || codes.has(code);
}

async function journaliserAccesRefuse(
  utilisateur: Awaited<ReturnType<typeof obtenirUtilisateurConnecte>>,
  code: string,
  contexte?: string
): Promise<void> {
  if (!utilisateur) return;

  const description = [
    `Permission refusée : ${code}`,
    contexte ? `Contexte : ${contexte}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  await prisma.$executeRaw`
    INSERT INTO journal_audit_securite
    (
      utilisateur_id,
      utilisateur_nom,
      action,
      module,
      description,
      niveau,
      created_at
    )
    VALUES
    (
      ${utilisateur.utilisateurSecuriteId},
      ${utilisateur.nom},
      'ACCES_REFUSE',
      'RBAC',
      ${description},
      'IMPORTANT',
      NOW()
    )
  `.catch((erreur) => {
    console.error(
      "Impossible de journaliser l’accès refusé :",
      erreur
    );
  });
}

/**
 * Vérifie si l’utilisateur connecté possède une permission.
 */
export async function aPermission(
  code: string,
  _perimetre?: PerimetrePermission
): Promise<boolean> {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) return false;
  if (utilisateur.superAdministrateur) return true;

  return contientPermission(
    utilisateur.permissions ?? [],
    code
  );
}

/**
 * Vérifie une permission à partir d’un jeu de permissions déjà chargé.
 * Utile dans les composants serveur et les menus.
 */
export function possedePermission(
  permissions: Iterable<string>,
  code: string,
  superAdministrateur = false
): boolean {
  if (superAdministrateur) return true;

  return contientPermission(permissions, code);
}

/**
 * Exige une permission. En cas de refus :
 * - journalise la tentative ;
 * - redirige vers la page 403.
 */
export async function exigerPermission(
  code: string,
  contexte?: string
): Promise<void> {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  if (
    utilisateur.superAdministrateur ||
    contientPermission(
      utilisateur.permissions ?? [],
      code
    )
  ) {
    return;
  }

  await journaliserAccesRefuse(
    utilisateur,
    code,
    contexte
  );

  redirect(
    `/acces-refuse?permission=${encodeURIComponent(code)}`
  );
}

/**
 * Retourne les permissions effectives de l’utilisateur connecté.
 */
export async function obtenirCodesPermissions(): Promise<
  Set<string>
> {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    return new Set<string>();
  }

  if (utilisateur.superAdministrateur) {
    return new Set<string>(["*"]);
  }

  return new Set<string>(
    utilisateur.permissions ?? []
  );
}

/**
 * Retourne la première destination autorisée pour l’utilisateur.
 * Cette fonction est utilisée par le Dashboard lorsqu’un compte
 * ne possède pas DASHBOARD_VOIR.
 */
export function premiereDestinationAutorisee(
  permissions: Iterable<string>,
  superAdministrateur = false
): string | null {
  if (superAdministrateur) {
    return "/dashboard";
  }

  const codes = permissions instanceof Set
    ? permissions
    : new Set(permissions);

  if (codes.has("*")) {
    return "/dashboard";
  }

  for (const destination of DESTINATIONS_AUTORISEES) {
    if (codes.has(destination.permission)) {
      return destination.href;
    }
  }

  return null;
}

/**
 * Filtre une liste d’éléments de menu selon leurs permissions.
 */
export function filtrerElementsAutorises<
  T extends ElementMenuProtege
>(
  elements: readonly T[],
  permissions: Iterable<string>,
  superAdministrateur = false
): T[] {
  return elements.filter((element) =>
    possedePermission(
      permissions,
      element.permission,
      superAdministrateur
    )
  );
}

/**
 * Vérifie plusieurs permissions.
 */
export function possedeToutesPermissions(
  permissions: Iterable<string>,
  codes: string[],
  superAdministrateur = false
): boolean {
  if (superAdministrateur) return true;

  return codes.every((code) =>
    contientPermission(permissions, code)
  );
}

/**
 * Vérifie qu’au moins une permission est accordée.
 */
export function possedeUnePermission(
  permissions: Iterable<string>,
  codes: string[],
  superAdministrateur = false
): boolean {
  if (superAdministrateur) return true;

  return codes.some((code) =>
    contientPermission(permissions, code)
  );
}