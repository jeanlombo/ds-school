import { exigerPermissionApi } from "@/lib/securite/api";
import { NextResponse } from "next/server";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { terminologieSection } from "@/lib/terminologie-academique";

function csv(valeur: unknown) {
  return `"${String(valeur ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const securite = await exigerPermissionApi("ELEVES_EXPORTER");
  if (!securite.autorise) return securite.reponse;
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) return NextResponse.redirect(new URL("/connexion", request.url));

  const ecole = await obtenirOuCreerEcole();
  const url = new URL(request.url);
  const recherche = url.searchParams.get("q")?.trim() || "";
  const classeId = Number(url.searchParams.get("classe")) || 0;
  const sectionId = Number(url.searchParams.get("section")) || 0;
  const sexe = url.searchParams.get("sexe") || "";
  const statut = url.searchParams.get("statut") ?? "actif";

  const where: any = {
    ecoleId: ecole.id,
    ...(statut ? { statut } : {}),
    ...(sexe ? { sexe } : {}),
    ...(recherche ? { OR: [
      { matricule: { contains: recherche } }, { nom: { contains: recherche } },
      { postnom: { contains: recherche } }, { prenom: { contains: recherche } }
    ] } : {}),
    ...((classeId || sectionId) ? { inscriptions: { some: {
      ...(classeId ? { classeId } : {}),
      ...(sectionId ? { classe: { sectionId } } : {})
    } } } : {})
  };

  const eleves = await prisma.eleve.findMany({
    where,
    include: {
      inscriptions: { include: { classe: { include: { section: true } }, anneeScolaire: true }, orderBy: { createdAt: "desc" }, take: 1 },
      responsables: { where: { principal: true }, take: 1 }
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }]
  });

  const lignes = [["Matricule", "Nom", "Postnom", "Prénom", "Sexe", "Date de naissance", "Classe / Promotion", "Section", "Année scolaire / académique", "Responsable", "Téléphone", "Statut"],
    ...eleves.map(e => {
      const inscription = e.inscriptions[0];
      const responsable = e.responsables[0];
      const t = terminologieSection(inscription?.classe.section.nom, ecole.typeEtablissement);
      return [e.matricule, e.nom, e.postnom || "", e.prenom, e.sexe === "M" ? t.masculin : t.feminin, e.dateNaissance.toISOString().slice(0, 10), inscription?.classe.nom || "", inscription?.classe.section.nom || "", inscription?.anneeScolaire.libelle || "", responsable?.nom || "", responsable?.telephone || e.telephoneUrgence || "", e.statut];
    })
  ];

  const contenu = "\ufeff" + lignes.map(ligne => ligne.map(csv).join(";")).join("\r\n");
  return new NextResponse(contenu, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="apprenants-filtres-${new Date().toISOString().slice(0, 10)}.csv"`
  }});
}