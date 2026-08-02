import { prisma } from "@/lib/prisma";

export type DemandePlanification = {
  ecoleId: number;
  anneeScolaireId: number;
  classeId: number;
  matiereId: number;
  enseignantId: number;
  salleId: number | null;
  typeCoursId: number | null;
  volumeHebdomadaire: number;
};

export type CreneauDisponible = {
  jour: string;
  creneauId: number;
  ordre: number;
};

export async function verifierDisponibiliteEnseignant(
  ecoleId: number,
  enseignantId: number,
  jour: string,
  creneauId: number
): Promise<boolean> {
  const disponibilites = await prisma.$queryRaw<
    Array<{ total: bigint | number }>
  >`
    SELECT COUNT(*) AS total
    FROM disponibilites_enseignants
    WHERE ecole_id = ${ecoleId}
      AND enseignant_id = ${enseignantId}
      AND jour = ${jour}
      AND creneau_horaire_id = ${creneauId}
      AND disponible = 1
  `;

  // En l’absence de configuration, l’enseignant est considéré disponible.
  const configurations = await prisma.$queryRaw<
    Array<{ total: bigint | number }>
  >`
    SELECT COUNT(*) AS total
    FROM disponibilites_enseignants
    WHERE ecole_id = ${ecoleId}
      AND enseignant_id = ${enseignantId}
  `;

  if (Number(configurations[0]?.total ?? 0) === 0) {
    return true;
  }

  return Number(disponibilites[0]?.total ?? 0) > 0;
}

export async function detecterConflit(params: {
  ecoleId: number;
  anneeScolaireId: number;
  classeId: number;
  enseignantId: number;
  salleId: number | null;
  jour: string;
  creneauId: number;
}): Promise<string | null> {
  const conflitClasse =
    await prisma.seanceEmploiTemps.findFirst({
      where: {
        ecoleId: params.ecoleId,
        anneeScolaireId: params.anneeScolaireId,
        classeId: params.classeId,
        jour: params.jour,
        creneauHoraireId: params.creneauId,
        statut: "ACTIVE",
      },
      select: { id: true },
    });

  if (conflitClasse) {
    return "CONFLIT_CLASSE";
  }

  const conflitEnseignant =
    await prisma.seanceEmploiTemps.findFirst({
      where: {
        ecoleId: params.ecoleId,
        anneeScolaireId: params.anneeScolaireId,
        enseignantId: params.enseignantId,
        jour: params.jour,
        creneauHoraireId: params.creneauId,
        statut: "ACTIVE",
      },
      select: { id: true },
    });

  if (conflitEnseignant) {
    return "CONFLIT_ENSEIGNANT";
  }

  if (params.salleId) {
    const conflitSalle =
      await prisma.seanceEmploiTemps.findFirst({
        where: {
          ecoleId: params.ecoleId,
          anneeScolaireId: params.anneeScolaireId,
          salleId: params.salleId,
          jour: params.jour,
          creneauHoraireId: params.creneauId,
          statut: "ACTIVE",
        },
        select: { id: true },
      });

    if (conflitSalle) {
      return "CONFLIT_SALLE";
    }
  }

  const disponible =
    await verifierDisponibiliteEnseignant(
      params.ecoleId,
      params.enseignantId,
      params.jour,
      params.creneauId
    );

  if (!disponible) {
    return "ENSEIGNANT_INDISPONIBLE";
  }

  return null;
}

export async function genererEmploiDuTemps(
  demande: DemandePlanification
): Promise<{
  creees: number;
  manquantes: number;
}> {
  const [jours, creneaux] = await Promise.all([
    prisma.jourOuvrable.findMany({
      where: {
        ecoleId: demande.ecoleId,
        actif: true,
      },
      orderBy: { ordre: "asc" },
    }),
    prisma.creneauHoraire.findMany({
      where: {
        ecoleId: demande.ecoleId,
        actif: true,
      },
      orderBy: { ordre: "asc" },
    }),
  ]);

  const candidats: CreneauDisponible[] = [];

  for (const jour of jours) {
    for (const creneau of creneaux) {
      candidats.push({
        jour: jour.jour,
        creneauId: creneau.id,
        ordre: creneau.ordre,
      });
    }
  }

  let creees = 0;

  for (const candidat of candidats) {
    if (creees >= demande.volumeHebdomadaire) {
      break;
    }

    const conflit = await detecterConflit({
      ecoleId: demande.ecoleId,
      anneeScolaireId:
        demande.anneeScolaireId,
      classeId: demande.classeId,
      enseignantId: demande.enseignantId,
      salleId: demande.salleId,
      jour: candidat.jour,
      creneauId: candidat.creneauId,
    });

    if (conflit) {
      continue;
    }

    await prisma.seanceEmploiTemps.create({
      data: {
        ecoleId: demande.ecoleId,
        anneeScolaireId:
          demande.anneeScolaireId,
        classeId: demande.classeId,
        matiereId: demande.matiereId,
        enseignantId: demande.enseignantId,
        creneauHoraireId:
          candidat.creneauId,
        salleId: demande.salleId,
        typeCoursId: demande.typeCoursId,
        jour: candidat.jour,
        observations:
          "Générée automatiquement par DS School",
        statut: "ACTIVE",
      },
    });

    creees += 1;
  }

  return {
    creees,
    manquantes: Math.max(
      0,
      demande.volumeHebdomadaire - creees
    ),
  };
}
