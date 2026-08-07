import { readdir, stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export type RessourceLicence =
  | "eleves"
  | "enseignants"
  | "utilisateurs"
  | "parents"
  | "classes"
  | "sections"
  | "salles";

export type LicenceEcole = {
  id: number;
  ecoleId: number;
  codeLicence: string | null;
  formule: string | null;
  quotaPersonnalise: boolean;
  planStandard: string | null;
  versionLogiciel: string | null;
  observations: string | null;
  dateDebut: Date | null;
  dateExpiration: Date | null;
  statut: "actif" | "expire" | "suspendu" | "en_attente";
  maxEleves: number;
  maxEnseignants: number;
  maxUtilisateurs: number;
  maxParents: number;
  maxClasses: number;
  maxSections: number;
  maxSalles: number;
  stockageMaxGo: number;
  smsMax: number;
  emailsMax: number;
  elevesIllimite: boolean;
  enseignantsIllimite: boolean;
  utilisateursIllimite: boolean;
  stockageIllimite: boolean;
};

type LicenceSql = {
  id: bigint | number;
  ecole_id: bigint | number;
  code_licence: string | null;
  formule: string | null;
  quota_personnalise: bigint | number | boolean | null;
  plan_standard: string | null;
  version_logiciel: string | null;
  observations: string | null;
  date_debut: Date | null;
  date_expiration: Date | null;
  statut: "actif" | "expire" | "suspendu" | "en_attente";
  max_eleves: number | null;
  max_enseignants: number | null;
  max_utilisateurs: number | null;
  max_parents: number | null;
  max_classes: number | null;
  max_sections: number | null;
  max_salles: number | null;
  stockage_max_go: number | null;
  sms_max: number | null;
  emails_max: number | null;
  eleves_illimite: bigint | number | boolean | null;
  enseignants_illimite: bigint | number | boolean | null;
  utilisateurs_illimite: bigint | number | boolean | null;
  stockage_illimite: bigint | number | boolean | null;
};

export type ControleQuota = {
  autorise: boolean;
  ressource: RessourceLicence;
  utilise: number;
  maximum: number;
  pourcentage: number;
  illimite: boolean;
  avertissement: boolean;
  message?: string;
};

export type UtilisationAbonnement = {
  licence: LicenceEcole;
  eleves: ControleQuota;
  enseignants: ControleQuota;
  utilisateurs: ControleQuota;
  parents: ControleQuota;
  classes: ControleQuota;
  sections: ControleQuota;
  salles: ControleQuota;
  stockage: {
    utiliseGo: number;
    maximumGo: number;
    pourcentage: number;
    illimite: boolean;
    avertissement: boolean;
    bloque: boolean;
  };
};

const nombre = (v: unknown, defaut = 0) => {
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : defaut;
};
const booleen = (v: unknown) => v === true || nombre(v) === 1;

function normaliserLicence(l: LicenceSql): LicenceEcole {
  return {
    id: nombre(l.id),
    ecoleId: nombre(l.ecole_id),
    codeLicence: l.code_licence,
    formule: l.formule,
    quotaPersonnalise: booleen(l.quota_personnalise),
    planStandard: l.plan_standard,
    versionLogiciel: l.version_logiciel,
    observations: l.observations,
    dateDebut: l.date_debut ? new Date(l.date_debut) : null,
    dateExpiration: l.date_expiration ? new Date(l.date_expiration) : null,
    statut: l.statut,
    maxEleves: nombre(l.max_eleves, 300),
    maxEnseignants: nombre(l.max_enseignants, 30),
    maxUtilisateurs: nombre(l.max_utilisateurs, 10),
    maxParents: nombre(l.max_parents, 300),
    maxClasses: nombre(l.max_classes, 20),
    maxSections: nombre(l.max_sections, 10),
    maxSalles: nombre(l.max_salles, 50),
    stockageMaxGo: nombre(l.stockage_max_go, 5),
    smsMax: nombre(l.sms_max),
    emailsMax: nombre(l.emails_max),
    elevesIllimite: booleen(l.eleves_illimite),
    enseignantsIllimite: booleen(l.enseignants_illimite),
    utilisateursIllimite: booleen(l.utilisateurs_illimite),
    stockageIllimite: booleen(l.stockage_illimite),
  };
}

export async function obtenirLicence(ecoleId: number): Promise<LicenceEcole | null> {
  const lignes = await prisma.$queryRaw<LicenceSql[]>`
    SELECT * FROM licences
    WHERE ecole_id = ${ecoleId}
    ORDER BY id DESC
    LIMIT 1
  `;
  return lignes[0] ? normaliserLicence(lignes[0]) : null;
}

export async function obtenirOuInitialiserLicence(ecoleId: number): Promise<LicenceEcole> {
  const existante = await obtenirLicence(ecoleId);
  if (existante) return existante;

  const code = `DS-${ecoleId}-${Date.now().toString(36).toUpperCase()}`;
  await prisma.$executeRaw`
    INSERT INTO licences
    (
      ecole_id, code_licence, formule, quota_personnalise, plan_standard,
      version_logiciel, observations, date_debut, date_expiration, statut,
      max_eleves, max_enseignants, max_utilisateurs, max_parents,
      max_classes, max_sections, max_salles, stockage_max_go,
      sms_max, emails_max, eleves_illimite, enseignants_illimite,
      utilisateurs_illimite, stockage_illimite, created_at, updated_at
    )
    VALUES
    (
      ${ecoleId}, ${code}, 'Standard', 0, 'Standard',
      '1.0', 'Licence initialisée automatiquement par DS School.',
      CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'actif',
      300, 30, 10, 300, 20, 10, 50, 5,
      0, 0, 0, 0, 0, 0, NOW(), NOW()
    )
  `;

  const creee = await obtenirLicence(ecoleId);
  if (!creee) throw new Error("Impossible d'initialiser la licence de l'établissement.");
  return creee;
}

async function compter(ecoleId: number, ressource: RessourceLicence): Promise<number> {
  switch (ressource) {
    case "eleves":
      return prisma.eleve.count({ where: { ecoleId, statut: "actif" } });
    case "enseignants":
      return prisma.enseignant.count({ where: { ecoleId, statut: "actif" } });
    case "classes":
      return prisma.classe.count({ where: { ecoleId, statut: "active" } });
    case "sections":
      return prisma.section.count({ where: { ecoleId, statut: "active" } });
    case "salles":
      return prisma.salle.count({ where: { ecoleId, statut: "ACTIVE" } });
    case "parents": {
      const lignes = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total FROM parents
        WHERE ecole_id = ${ecoleId} AND actif = 1
      `;
      return nombre(lignes[0]?.total);
    }
    case "utilisateurs": {
      const lignes = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total FROM utilisateurs_securite
        WHERE ecole_id = ${ecoleId} AND UPPER(statut) = 'ACTIF'
      `;
      return nombre(lignes[0]?.total);
    }
  }
}

function parametresQuota(licence: LicenceEcole, ressource: RessourceLicence) {
  switch (ressource) {
    case "eleves": return { maximum: licence.maxEleves, illimite: licence.elevesIllimite };
    case "enseignants": return { maximum: licence.maxEnseignants, illimite: licence.enseignantsIllimite };
    case "utilisateurs": return { maximum: licence.maxUtilisateurs, illimite: licence.utilisateursIllimite };
    case "parents": return { maximum: licence.maxParents, illimite: false };
    case "classes": return { maximum: licence.maxClasses, illimite: false };
    case "sections": return { maximum: licence.maxSections, illimite: false };
    case "salles": return { maximum: licence.maxSalles, illimite: false };
  }
}

function licenceUtilisable(licence: LicenceEcole) {
  if (licence.statut !== "actif") {
    return `La licence de cet établissement est ${licence.statut}. Contactez DIGIGROUPE.`;
  }
  if (licence.dateExpiration) {
    const fin = new Date(licence.dateExpiration);
    fin.setHours(23, 59, 59, 999);
    if (fin < new Date()) return "L'abonnement de cet établissement est expiré. Contactez DIGIGROUPE pour le renouveler.";
  }
  return null;
}

export async function verifierQuota(ecoleId: number, ressource: RessourceLicence): Promise<ControleQuota> {
  const licence = await obtenirOuInitialiserLicence(ecoleId);
  const problemeLicence = licenceUtilisable(licence);
  const { maximum, illimite } = parametresQuota(licence, ressource);
  const utilise = await compter(ecoleId, ressource);
  const pourcentage = illimite ? 0 : maximum > 0 ? Math.min(100, Math.round((utilise / maximum) * 100)) : 100;

  if (problemeLicence) {
    return { autorise: false, ressource, utilise, maximum, pourcentage, illimite, avertissement: true, message: problemeLicence };
  }
  if (illimite) {
    return { autorise: true, ressource, utilise, maximum, pourcentage: 0, illimite: true, avertissement: false };
  }
  if (maximum <= 0 || utilise >= maximum) {
    return {
      autorise: false, ressource, utilise, maximum, pourcentage: 100, illimite: false, avertissement: true,
      message: `Vous avez atteint la limite de votre abonnement (${utilise}/${maximum}). Contactez DIGIGROUPE pour augmenter votre capacité.`,
    };
  }
  return { autorise: true, ressource, utilise, maximum, pourcentage, illimite: false, avertissement: pourcentage >= 90 };
}

async function tailleDossier(dossier: string): Promise<number> {
  try {
    const elements = await readdir(dossier, { withFileTypes: true });
    let total = 0;
    for (const element of elements) {
      const cible = path.join(dossier, element.name);
      if (element.isDirectory()) total += await tailleDossier(cible);
      else if (element.isFile()) total += (await stat(cible)).size;
    }
    return total;
  } catch {
    return 0;
  }
}

export async function obtenirStockageUtiliseGo(): Promise<number> {
  const octets = await tailleDossier(path.join(process.cwd(), "public", "uploads"));
  return Math.round((octets / (1024 ** 3)) * 100) / 100;
}

export async function obtenirUtilisationAbonnement(ecoleId: number): Promise<UtilisationAbonnement> {
  const licence = await obtenirOuInitialiserLicence(ecoleId);
  const [eleves, enseignants, utilisateurs, parents, classes, sections, salles, utiliseGo] = await Promise.all([
    verifierQuota(ecoleId, "eleves"), verifierQuota(ecoleId, "enseignants"), verifierQuota(ecoleId, "utilisateurs"),
    verifierQuota(ecoleId, "parents"), verifierQuota(ecoleId, "classes"), verifierQuota(ecoleId, "sections"),
    verifierQuota(ecoleId, "salles"), obtenirStockageUtiliseGo(),
  ]);
  const maximumGo = licence.stockageMaxGo;
  const illimite = licence.stockageIllimite;
  const pourcentage = illimite ? 0 : maximumGo > 0 ? Math.min(100, Math.round((utiliseGo / maximumGo) * 100)) : 100;
  return {
    licence, eleves, enseignants, utilisateurs, parents, classes, sections, salles,
    stockage: { utiliseGo, maximumGo, pourcentage, illimite, avertissement: !illimite && pourcentage >= 90, bloque: !illimite && pourcentage >= 100 },
  };
}

export async function moduleLicenceActif(ecoleId: number, module: string): Promise<boolean> {
  const licence = await obtenirOuInitialiserLicence(ecoleId);
  const lignes = await prisma.$queryRaw<Array<{ actif: bigint | number | boolean }>>`
    SELECT actif FROM licence_modules
    WHERE licence_id = ${licence.id} AND module = ${module}
    ORDER BY id DESC LIMIT 1
  `;
  // Absence de configuration = module autorisé pour préserver la compatibilité des écoles existantes.
  return lignes.length === 0 ? true : booleen(lignes[0].actif);
}
