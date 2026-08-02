import { exigerPermissionApi } from "@/lib/securite/api";
import prisma from "@/lib/prisma";

function csv(valeur: unknown): string {
  const texte = String(valeur ?? "");
  return `"${texte.replaceAll('"', '""')}"`;
}

export async function GET() {
  const securite = await exigerPermissionApi("MATIERES_EXPORTER");
  if (!securite.autorise) return securite.reponse;
  const matieres = await prisma.matiere.findMany({
    orderBy: { nom: "asc" },
  });

  const lignes = [
    [
      "Code",
      "Matière",
      "Département",
      "Coefficient",
      "Volume horaire hebdomadaire",
      "Statut",
      "Description",
    ]
      .map(csv)
      .join(";"),
    ...matieres.map((matiere) =>
      [
        matiere.code,
        matiere.nom,
        matiere.departement || "",
        matiere.coefficient.toString(),
        matiere.volumeHoraireHebdomadaire,
        matiere.statut === "ACTIF" ? "Active" : "Inactive",
        matiere.description || "",
      ]
        .map(csv)
        .join(";")
    ),
  ];

  const contenu = "\uFEFF" + lignes.join("\r\n");

  return new Response(contenu, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="DS_School_Matieres.csv"',
      "Cache-Control": "no-store",
    },
  });
}
