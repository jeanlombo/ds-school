"use server";
import { exigerPermission } from "@/lib/securite/rbac";
import { verifierQuota } from "@/lib/licence";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirOuCreerEcole } from "@/lib/ecole";
const t=(f:FormData,k:string)=>String(f.get(k)??"").trim();
const n=(f:FormData,k:string,d=0)=>{const v=Number(f.get(k));return Number.isFinite(v)?v:d};
const b=(f:FormData,k:string)=>f.get(k)==="on"||f.get(k)==="true";
function id(f:FormData){const v=n(f,"id");if(!Number.isInteger(v)||v<1)throw new Error("Identifiant invalide.");return v}
export async function ajouterEvenement(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_AJOUTER", "app/dashboard/parametres-academiques/actions.ts::ajouterEvenement");await prisma.evenementCalendrier.create({data:{anneeScolaireId:n(f,"anneeScolaireId"),titre:t(f,"titre"),type:t(f,"type"),dateDebut:new Date(t(f,"dateDebut")),dateFin:new Date(t(f,"dateFin")),description:t(f,"description")||null,couleur:t(f,"couleur")||"#1761A8",actif:true}});revalidatePath("/dashboard/parametres-academiques/calendrier")}
export async function supprimerEvenement(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_SUPPRIMER", "app/dashboard/parametres-academiques/actions.ts::supprimerEvenement");await prisma.evenementCalendrier.delete({where:{id:id(f)}});revalidatePath("/dashboard/parametres-academiques/calendrier")}
export async function ajouterPeriode(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_AJOUTER", "app/dashboard/parametres-academiques/actions.ts::ajouterPeriode");await prisma.periodeAcademique.create({data:{anneeScolaireId:n(f,"anneeScolaireId"),nom:t(f,"nom"),type:t(f,"type"),ordre:n(f,"ordre",1),dateDebut:new Date(t(f,"dateDebut")),dateFin:new Date(t(f,"dateFin")),statut:t(f,"statut")||"ACTIVE"}});revalidatePath("/dashboard/parametres-academiques/periodes")}
export async function supprimerPeriode(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_SUPPRIMER", "app/dashboard/parametres-academiques/actions.ts::supprimerPeriode");await prisma.periodeAcademique.delete({where:{id:id(f)}});revalidatePath("/dashboard/parametres-academiques/periodes")}
export async function enregistrerJours(f:FormData){
  await exigerPermission(
    "PARAMETRES_ACADEMIQUES_MODIFIER",
    "app/dashboard/parametres-academiques/actions.ts::enregistrerJours"
  );

  const ecole = await obtenirOuCreerEcole();
  const ecoleId = ecole.id;

  const jours = [
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
    "DIMANCHE"
  ] as const;

  await prisma.$transaction(
    jours.map((jour, ordre) =>
      prisma.jourOuvrable.upsert({
        where: {
          ecoleId_jour: {
            ecoleId,
            jour
          }
        },
        create: {
          ecoleId,
          jour,
          ordre: ordre + 1,
          actif: b(f, jour)
        },
        update: {
          ordre: ordre + 1,
          actif: b(f, jour)
        }
      })
    )
  );

  revalidatePath("/dashboard/parametres-academiques/jours-ouvrables");
  revalidatePath("/dashboard/emploi-du-temps");
  revalidatePath("/dashboard/emploi-du-temps/nouveau");

  redirect("/dashboard/parametres-academiques/jours-ouvrables?succes=1");
}
export async function ajouterCreneau(f:FormData){
  await exigerPermission(
    "PARAMETRES_ACADEMIQUES_AJOUTER",
    "app/dashboard/parametres-academiques/actions.ts::ajouterCreneau"
  );

  const ecole = await obtenirOuCreerEcole();

  await prisma.creneauHoraire.create({
    data:{
      ecoleId: ecole.id,
      nom: t(f,"nom"),
      ordre: n(f,"ordre",1),
      heureDebut: t(f,"heureDebut"),
      heureFin: t(f,"heureFin"),
      actif: true
    }
  });

  revalidatePath("/dashboard/parametres-academiques/creneaux");
  revalidatePath("/dashboard/emploi-du-temps");
  revalidatePath("/dashboard/emploi-du-temps/nouveau");

  redirect("/dashboard/parametres-academiques/creneaux?succes=1");
}
export async function supprimerCreneau(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_SUPPRIMER", "app/dashboard/parametres-academiques/actions.ts::supprimerCreneau");await prisma.creneauHoraire.delete({where:{id:id(f)}});revalidatePath("/dashboard/parametres-academiques/creneaux")}
export async function ajouterPause(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_AJOUTER", "app/dashboard/parametres-academiques/actions.ts::ajouterPause");await prisma.pauseAcademique.create({data:{ecoleId:n(f,"ecoleId"),nom:t(f,"nom"),type:t(f,"type"),heureDebut:t(f,"heureDebut"),heureFin:t(f,"heureFin"),couleur:t(f,"couleur")||"#F59E0B",actif:true}});revalidatePath("/dashboard/parametres-academiques/pauses")}
export async function supprimerPause(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_SUPPRIMER", "app/dashboard/parametres-academiques/actions.ts::supprimerPause");await prisma.pauseAcademique.delete({where:{id:id(f)}});revalidatePath("/dashboard/parametres-academiques/pauses")}
export async function ajouterSalle(f:FormData){
  await exigerPermission(
    "PARAMETRES_ACADEMIQUES_AJOUTER",
    "app/dashboard/parametres-academiques/actions.ts::ajouterSalle"
  );

  const ecole = await obtenirOuCreerEcole();
  const quota = await verifierQuota(ecole.id,"salles");

  if(!quota.autorise){
    throw new Error(quota.message || "Limite de licence atteinte");
  }

  await prisma.salle.create({
    data:{
      ecoleId: ecole.id,
      code: t(f,"code").toUpperCase(),
      nom: t(f,"nom"),
      type: t(f,"type"),
      capacite: n(f,"capacite",40),
      batiment: t(f,"batiment") || null,
      etage: t(f,"etage") || null,
      responsable: t(f,"responsable") || null,
      statut: "ACTIVE"
    }
  });

  revalidatePath("/dashboard/parametres-academiques/salles");
  revalidatePath("/dashboard/emploi-du-temps");
  revalidatePath("/dashboard/emploi-du-temps/nouveau");

  redirect("/dashboard/parametres-academiques/salles?succes=1");
}
export async function supprimerSalle(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_SUPPRIMER", "app/dashboard/parametres-academiques/actions.ts::supprimerSalle");await prisma.salle.delete({where:{id:id(f)}});revalidatePath("/dashboard/parametres-academiques/salles")}
export async function ajouterTypeCours(f:FormData){
  await exigerPermission(
    "PARAMETRES_ACADEMIQUES_AJOUTER",
    "app/dashboard/parametres-academiques/actions.ts::ajouterTypeCours"
  );

  const ecole = await obtenirOuCreerEcole();

  await prisma.typeCours.create({
    data:{
      ecoleId: ecole.id,
      code: t(f,"code").toUpperCase(),
      nom: t(f,"nom"),
      couleur: t(f,"couleur") || "#1761A8",
      description: t(f,"description") || null,
      actif: true
    }
  });

  revalidatePath("/dashboard/parametres-academiques/types-cours");
  revalidatePath("/dashboard/emploi-du-temps");
  revalidatePath("/dashboard/emploi-du-temps/nouveau");

  redirect("/dashboard/parametres-academiques/types-cours?succes=1");
}
export async function supprimerTypeCours(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_SUPPRIMER", "app/dashboard/parametres-academiques/actions.ts::supprimerTypeCours");await prisma.typeCours.delete({where:{id:id(f)}});revalidatePath("/dashboard/parametres-academiques/types-cours")}
export async function enregistrerRegles(f:FormData){
  await exigerPermission("PARAMETRES_ACADEMIQUES_MODIFIER", "app/dashboard/parametres-academiques/actions.ts::enregistrerRegles");const ecoleId=n(f,"ecoleId");await prisma.regleAcademique.upsert({where:{ecoleId},create:{ecoleId,maxCoursJour:n(f,"maxCoursJour",8),maxPeriodesEnseignant:n(f,"maxPeriodesEnseignant",8),maxCoursConsecutifs:n(f,"maxCoursConsecutifs",3),dureeMinEntreCours:n(f,"dureeMinEntreCours",0),dureeMaxPeriode:n(f,"dureeMaxPeriode",120),gestionConflits:b(f,"gestionConflits")},update:{maxCoursJour:n(f,"maxCoursJour",8),maxPeriodesEnseignant:n(f,"maxPeriodesEnseignant",8),maxCoursConsecutifs:n(f,"maxCoursConsecutifs",3),dureeMinEntreCours:n(f,"dureeMinEntreCours",0),dureeMaxPeriode:n(f,"dureeMaxPeriode",120),gestionConflits:b(f,"gestionConflits")}});revalidatePath("/dashboard/parametres-academiques/regles")}
