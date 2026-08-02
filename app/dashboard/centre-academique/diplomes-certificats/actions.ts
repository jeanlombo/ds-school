"use server";
import { exigerPermission } from "@/lib/securite/rbac";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";

function texte(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function nombre(value: FormDataEntryValue | null) {
  return Number(value ?? 0);
}

function creerNumero(type: string, codeEcole: string, idEleve: number) {
  const prefixe: Record<string, string> = {
    DIPLOME_FIN_ETUDES: "DIP",
    CERTIFICAT_REUSSITE: "CER",
    ATTESTATION_SCOLARITE: "SCO",
    ATTESTATION_FREQUENTATION: "FRE",
    ATTESTATION_BONNE_CONDUITE: "CON",
    ATTESTATION_TRANSFERT: "TRA",
  };

  const date = new Date();
  const annee = date.getFullYear();
  const sequence = `${Date.now()}`.slice(-8);
  return `${prefixe[type] ?? "DOC"}-${codeEcole}-${annee}-${idEleve}-${sequence}`.toUpperCase();
}

export async function creerDocument(formData: FormData) {
  await exigerPermission("ACADEMIQUE_AJOUTER", "app/dashboard/centre-academique/diplomes-certificats/actions.ts::creerDocument");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const inscriptionId = nombre(formData.get("inscriptionId"));
  const type = texte(formData.get("type"));
  const mention = texte(formData.get("mention"));
  const session = texte(formData.get("session"));
  const motif = texte(formData.get("motif"));
  const signataire = texte(formData.get("signataire")) || ecole.directeur || utilisateur.nom;

  const inscription = await prisma.inscription.findFirst({
    where: {
      id: inscriptionId,
      eleve: { ecoleId: ecole.id },
      anneeScolaire: { ecoleId: ecole.id },
    },
    include: {
      eleve: true,
      classe: true,
      anneeScolaire: true,
    },
  });

  if (!inscription || !type) {
    redirect("/dashboard/centre-academique/diplomes-certificats/nouveau?erreur=1");
  }

  const numero = creerNumero(type, ecole.code, inscription.eleveId);
  const codeVerification = crypto.randomBytes(18).toString("hex").toUpperCase();

  const document = await prisma.documentAcademique.create({
    data: {
      ecoleId: ecole.id,
      eleveId: inscription.eleveId,
      inscriptionId: inscription.id,
      classeId: inscription.classeId,
      anneeScolaireId: inscription.anneeScolaireId,
      type,
      numero,
      codeVerification,
      mention: mention || null,
      session: session || null,
      motif: motif || null,
      signataire,
      statut: "VALIDE",
      creePar: utilisateur.email,
    },
  });

  await prisma.historiqueEleve.create({
    data: {
      eleveId: inscription.eleveId,
      type: "DOCUMENT_ACADEMIQUE_DELIVRE",
      auteur: utilisateur.email,
      details: JSON.stringify({
        documentId: document.id,
        numero,
        type,
        anneeScolaire: inscription.anneeScolaire.libelle,
        classe: inscription.classe.nom,
      }),
    },
  });

  revalidatePath("/dashboard/centre-academique/diplomes-certificats");
  redirect(`/dashboard/centre-academique/diplomes-certificats/${document.id}?nouveau=1`);
}

export async function annulerDocument(formData: FormData) {
  await exigerPermission("ACADEMIQUE_ANNULER", "app/dashboard/centre-academique/diplomes-certificats/actions.ts::annulerDocument");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const id = nombre(formData.get("id"));

  const document = await prisma.documentAcademique.findFirst({
    where: { id, ecoleId: ecole.id },
  });

  if (!document) {
    redirect("/dashboard/centre-academique/diplomes-certificats?erreur=introuvable");
  }

  await prisma.$transaction([
    prisma.documentAcademique.update({
      where: { id },
      data: {
        statut: "ANNULE",
        dateAnnulation: new Date(),
        annulePar: utilisateur.email,
      },
    }),
    prisma.historiqueEleve.create({
      data: {
        eleveId: document.eleveId,
        type: "DOCUMENT_ACADEMIQUE_ANNULE",
        auteur: utilisateur.email,
        details: JSON.stringify({
          documentId: document.id,
          numero: document.numero,
          type: document.type,
        }),
      },
    }),
  ]);

  revalidatePath("/dashboard/centre-academique/diplomes-certificats");
  revalidatePath(`/dashboard/centre-academique/diplomes-certificats/${id}`);
  redirect("/dashboard/centre-academique/diplomes-certificats?succes=annulation");
}
