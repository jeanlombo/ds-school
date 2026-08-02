import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LigneResultat = {
  inscriptionId: number;
  eleveId: number;
  matricule: string;
  nomComplet: string;
  moyenne: number;
  rang: number;
  mention: string;
  decision: string;
  evaluationsNotees: number;
  evaluationsAttendues: number;
  tauxCompletion: number;
  matieres: Array<{
    matiereId: number;
    nom: string;
    moyenne: number;
    evaluations: number;
  }>;
};

export type SyntheseResultats = {
  lignes: LigneResultat[];
  moyenneClasse: number;
  meilleureMoyenne: number;
  plusFaibleMoyenne: number;
  tauxReussite: number;
  admis: number;
  ajournes: number;
  evaluationsPubliees: number;
};

type Regle = {
  seuilReussite: Prisma.Decimal | number;
  mentionExcellent: Prisma.Decimal | number;
  mentionTresBien: Prisma.Decimal | number;
  mentionBien: Prisma.Decimal | number;
  mentionAssezBien: Prisma.Decimal | number;
  arrondiDecimales: number;
} | null;

function arrondir(valeur: number, decimales: number): number {
  const precision = 10 ** Math.max(0, Math.min(4, decimales));
  return Math.round((valeur + Number.EPSILON) * precision) / precision;
}

function determinerMention(moyenne: number, regle: Regle): string {
  const excellent = Number(regle?.mentionExcellent ?? 80);
  const tresBien = Number(regle?.mentionTresBien ?? 70);
  const bien = Number(regle?.mentionBien ?? 60);
  const assezBien = Number(regle?.mentionAssezBien ?? 50);

  if (moyenne >= excellent) return "Excellent";
  if (moyenne >= tresBien) return "Très bien";
  if (moyenne >= bien) return "Bien";
  if (moyenne >= assezBien) return "Assez bien";
  return "Insuffisant";
}

function attribuerRangs(lignes: Omit<LigneResultat, "rang">[]): LigneResultat[] {
  const triees = [...lignes].sort((a, b) => {
    if (b.moyenne !== a.moyenne) return b.moyenne - a.moyenne;
    return a.nomComplet.localeCompare(b.nomComplet, "fr");
  });

  let rangPrecedent = 0;
  let moyennePrecedente: number | null = null;

  return triees.map((ligne, index) => {
    const rang =
      moyennePrecedente !== null && ligne.moyenne === moyennePrecedente
        ? rangPrecedent
        : index + 1;

    rangPrecedent = rang;
    moyennePrecedente = ligne.moyenne;

    return { ...ligne, rang };
  });
}

export async function calculerResultats(
  ecoleId: number,
  classeId: number,
  periodeId: number,
): Promise<SyntheseResultats> {
  if (!classeId || !periodeId) {
    return {
      lignes: [],
      moyenneClasse: 0,
      meilleureMoyenne: 0,
      plusFaibleMoyenne: 0,
      tauxReussite: 0,
      admis: 0,
      ajournes: 0,
      evaluationsPubliees: 0,
    };
  }

  const [regle, inscriptions, evaluations] = await Promise.all([
    prisma.regleEvaluation.findUnique({ where: { ecoleId } }),
    prisma.inscription.findMany({
      where: {
        classeId,
        statut: "inscrit",
        anneeScolaire: { ecoleId },
      },
      include: { eleve: true },
      orderBy: [{ eleve: { nom: "asc" } }, { eleve: { prenom: "asc" } }],
    }),
    prisma.evaluation.findMany({
      where: {
        ecoleId,
        classeId,
        periodeAcademiqueId: periodeId,
        publiee: true,
      },
      include: {
        matiere: true,
        notes: true,
      },
      orderBy: [
        { matiere: { nom: "asc" } },
        { dateEvaluation: "asc" },
      ],
    }),
  ]);

  const decimales = regle?.arrondiDecimales ?? 2;
  const seuilReussite = Number(regle?.seuilReussite ?? 50);
  const evaluationsAttendues = evaluations.length;

  const lignesSansRang: Omit<LigneResultat, "rang">[] = inscriptions.map(
    (inscription) => {
      let sommePonderee = 0;
      let sommeCoefficients = 0;
      let evaluationsNotees = 0;

      const detailsMatieres = new Map<
        number,
        { nom: string; somme: number; coefficients: number; evaluations: number }
      >();

      for (const evaluation of evaluations) {
        const note = evaluation.notes.find(
          (element) => element.eleveId === inscription.eleveId,
        );

        if (!note || note.absent || note.valeur === null) continue;

        const bareme = Number(evaluation.bareme);
        const coefficient = Number(evaluation.coefficient);

        if (bareme <= 0 || coefficient <= 0) continue;

        const pourcentage = (Number(note.valeur) / bareme) * 100;
        sommePonderee += pourcentage * coefficient;
        sommeCoefficients += coefficient;
        evaluationsNotees += 1;

        const detail = detailsMatieres.get(evaluation.matiereId) ?? {
          nom: evaluation.matiere.nom,
          somme: 0,
          coefficients: 0,
          evaluations: 0,
        };

        detail.somme += pourcentage * coefficient;
        detail.coefficients += coefficient;
        detail.evaluations += 1;
        detailsMatieres.set(evaluation.matiereId, detail);
      }

      const moyenneBrute =
        sommeCoefficients > 0 ? sommePonderee / sommeCoefficients : 0;
      const moyenne = arrondir(moyenneBrute, decimales);

      const matieres = Array.from(detailsMatieres.entries())
        .map(([matiereId, detail]) => ({
          matiereId,
          nom: detail.nom,
          moyenne: arrondir(
            detail.coefficients > 0 ? detail.somme / detail.coefficients : 0,
            decimales,
          ),
          evaluations: detail.evaluations,
        }))
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

      return {
        inscriptionId: inscription.id,
        eleveId: inscription.eleveId,
        matricule: inscription.eleve.matricule,
        nomComplet: `${inscription.eleve.nom} ${inscription.eleve.prenom}`.trim(),
        moyenne,
        mention: determinerMention(moyenne, regle),
        decision: moyenne >= seuilReussite ? "Admis" : "Ajourné",
        evaluationsNotees,
        evaluationsAttendues,
        tauxCompletion:
          evaluationsAttendues > 0
            ? arrondir((evaluationsNotees / evaluationsAttendues) * 100, 0)
            : 0,
        matieres,
      };
    },
  );

  const lignes = attribuerRangs(lignesSansRang);
  const moyennes = lignes.map((ligne) => ligne.moyenne);
  const admis = lignes.filter((ligne) => ligne.decision === "Admis").length;
  const ajournes = lignes.length - admis;

  return {
    lignes,
    moyenneClasse:
      lignes.length > 0
        ? arrondir(
            moyennes.reduce((total, moyenne) => total + moyenne, 0) /
              lignes.length,
            decimales,
          )
        : 0,
    meilleureMoyenne: moyennes.length > 0 ? Math.max(...moyennes) : 0,
    plusFaibleMoyenne: moyennes.length > 0 ? Math.min(...moyennes) : 0,
    tauxReussite:
      lignes.length > 0 ? arrondir((admis / lignes.length) * 100, 1) : 0,
    admis,
    ajournes,
    evaluationsPubliees: evaluations.length,
  };
}
