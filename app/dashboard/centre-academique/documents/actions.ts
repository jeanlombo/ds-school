"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import { calculerEmpreinteDocument, creerCodeVerification, genererNumeroDocument } from "@/lib/documents/moteur";

const texte=(fd:FormData,c:string)=>String(fd.get(c)??"").trim();
const entier=(fd:FormData,c:string)=>Number(fd.get(c)??0);

export async function creerDocumentAcademique(fd: FormData) {
  await exigerPermission("DOCUMENTS_ACADEMIQUES_CREER");
  const utilisateur=await obtenirUtilisateurConnecte();
  if(!utilisateur) redirect("/connexion");
  const ecole=await obtenirOuCreerEcole();

  const inscriptionId=entier(fd,"inscription_id");
  const typeDocument=texte(fd,"type_document");
  const libelle=texte(fd,"libelle");
  const dateEmission=texte(fd,"date_emission")||new Date().toISOString().slice(0,10);
  const mention=texte(fd,"mention")||null;
  const session=texte(fd,"session")||null;
  const motif=texte(fd,"motif")||null;

  const inscription=await prisma.inscription.findFirst({
    where:{id:inscriptionId,classe:{ecoleId:ecole.id}},
    include:{eleve:true,classe:true,anneeScolaire:true}
  });
  if(!inscription||!typeDocument||!libelle) redirect("/dashboard/centre-academique/documents/nouveau?erreur=champs");

  const numero=await genererNumeroDocument(ecole.id,typeDocument);
  const codeVerification=creerCodeVerification();
  const empreinte=calculerEmpreinteDocument({
    ecoleId:ecole.id,eleveId:inscription.eleveId,numero,type:typeDocument,dateEmission
  });

  await prisma.$executeRaw`
    INSERT INTO documents_academiques_enterprise
    (ecole_id,eleve_id,inscription_id,type_document,libelle,numero_document,code_verification,empreinte_securite,date_emission,mention,session,motif,statut,cree_par,created_at,updated_at)
    VALUES
    (${ecole.id},${inscription.eleveId},${inscription.id},${typeDocument},${libelle},${numero},${codeVerification},${empreinte},${dateEmission},${mention},${session},${motif},'VALIDE',${utilisateur.nom},NOW(),NOW())
  `;

  const ids=await prisma.$queryRaw<Array<{id:number}>>`
    SELECT id FROM documents_academiques_enterprise
    WHERE ecole_id=${ecole.id} AND numero_document=${numero} LIMIT 1
  `;
  const id=ids[0]?.id;
  if(!id) throw new Error("Document créé mais identifiant introuvable.");

  await prisma.$executeRaw`
    INSERT INTO historique_documents_academiques
    (ecole_id,document_id,action,details,utilisateur_nom,created_at)
    VALUES (${ecole.id},${id},'CREATION',${`Document ${numero} créé`},${utilisateur.nom},NOW())
  `;

  revalidatePath("/dashboard/centre-academique/documents");
  redirect(`/dashboard/centre-academique/documents/${id}?succes=creation`);
}

export async function annulerDocumentAcademique(documentId:number,fd:FormData){
  await exigerPermission("DOCUMENTS_ACADEMIQUES_ANNULER");
  const utilisateur=await obtenirUtilisateurConnecte();
  if(!utilisateur) redirect("/connexion");
  const ecole=await obtenirOuCreerEcole();
  const motif=texte(fd,"motif_annulation");
  if(!motif) redirect(`/dashboard/centre-academique/documents/${documentId}?erreur=motif`);

  await prisma.$executeRaw`
    UPDATE documents_academiques_enterprise
    SET statut='ANNULE',motif_annulation=${motif},annule_par=${utilisateur.nom},annule_le=NOW(),updated_at=NOW()
    WHERE id=${documentId} AND ecole_id=${ecole.id} AND statut='VALIDE'
  `;
  await prisma.$executeRaw`
    INSERT INTO historique_documents_academiques
    (ecole_id,document_id,action,details,utilisateur_nom,created_at)
    VALUES (${ecole.id},${documentId},'ANNULATION',${motif},${utilisateur.nom},NOW())
  `;
  revalidatePath("/dashboard/centre-academique/documents");
  revalidatePath(`/dashboard/centre-academique/documents/${documentId}`);
  redirect(`/dashboard/centre-academique/documents/${documentId}?succes=annulation`);
}

export async function enregistrerReimpression(documentId:number,format:string){
  await exigerPermission("DOCUMENTS_ACADEMIQUES_REIMPRIMER");
  const utilisateur=await obtenirUtilisateurConnecte();
  if(!utilisateur) redirect("/connexion");
  const ecole=await obtenirOuCreerEcole();
  const h=await headers();
  const ip=h.get("x-forwarded-for")?.split(",")[0]?.trim()||h.get("x-real-ip")||null;
  const appareil=h.get("user-agent")||null;
  await prisma.$executeRaw`
    INSERT INTO reimpressions_documents_academiques
    (ecole_id,document_id,format_impression,imprime_par,adresse_ip,appareil,created_at)
    VALUES (${ecole.id},${documentId},${format},${utilisateur.nom},${ip},${appareil},NOW())
  `;
}
