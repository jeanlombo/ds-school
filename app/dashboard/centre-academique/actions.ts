"use server";
import { exigerPermission } from "@/lib/securite/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
const n=(v:FormDataEntryValue|null)=>Number(v||0); const s=(v:FormDataEntryValue|null)=>String(v||'').trim();
async function securiser(){const u=await obtenirUtilisateurConnecte();if(!u)redirect('/connexion');return obtenirOuCreerEcole()}
export async function creerTypeEvaluation(fd:FormData){
  await exigerPermission("ACADEMIQUE_AJOUTER", "app/dashboard/centre-academique/actions.ts::creerTypeEvaluation");const e=await securiser();const nom=s(fd.get('nom')),code=s(fd.get('code')).toUpperCase();if(!nom||!code)redirect('/dashboard/centre-academique/types-evaluations?erreur=champs');await prisma.typeEvaluation.create({data:{ecoleId:e.id,nom,code,coefficientParDefaut:n(fd.get('coefficient'))||1,noteMaxParDefaut:n(fd.get('noteMax'))||20,couleur:s(fd.get('couleur'))||'#1761A8'}}).catch(()=>redirect('/dashboard/centre-academique/types-evaluations?erreur=doublon'));revalidatePath('/dashboard/centre-academique');redirect('/dashboard/centre-academique/types-evaluations?succes=creation')}
export async function supprimerTypeEvaluation(fd:FormData){
  await exigerPermission("ACADEMIQUE_SUPPRIMER", "app/dashboard/centre-academique/actions.ts::supprimerTypeEvaluation");const e=await securiser();await prisma.typeEvaluation.deleteMany({where:{id:n(fd.get('id')),ecoleId:e.id,evaluations:{none:{}}}});revalidatePath('/dashboard/centre-academique');redirect('/dashboard/centre-academique/types-evaluations?succes=suppression')}
export async function creerEvaluation(fd:FormData){
  await exigerPermission("ACADEMIQUE_AJOUTER", "app/dashboard/centre-academique/actions.ts::creerEvaluation");const e=await securiser();const data={ecoleId:e.id,titre:s(fd.get('titre')),typeEvaluationId:n(fd.get('typeEvaluationId')),anneeScolaireId:n(fd.get('anneeScolaireId')),periodeAcademiqueId:n(fd.get('periodeAcademiqueId')),classeId:n(fd.get('classeId')),matiereId:n(fd.get('matiereId')),enseignantId:n(fd.get('enseignantId')),dateEvaluation:new Date(s(fd.get('dateEvaluation'))),noteMax:n(fd.get('noteMax'))||20,coefficient:n(fd.get('coefficient'))||1,dureeMinutes:n(fd.get('dureeMinutes'))||null,description:s(fd.get('description'))||null,statut:'BROUILLON'};if(!data.titre||!data.typeEvaluationId||!data.anneeScolaireId||!data.periodeAcademiqueId||!data.classeId||!data.matiereId||!data.enseignantId)redirect('/dashboard/centre-academique/evaluations/nouvelle?erreur=champs');await prisma.evaluation.create({data});revalidatePath('/dashboard/centre-academique');redirect('/dashboard/centre-academique/evaluations?succes=creation')}
export async function changerStatutEvaluation(fd:FormData){
  await exigerPermission("ACADEMIQUE_CHANGER_STATUT", "app/dashboard/centre-academique/actions.ts::changerStatutEvaluation");const e=await securiser();const statut=s(fd.get('statut'));if(!['BROUILLON','PUBLIEE','CLOTUREE'].includes(statut))return;await prisma.evaluation.updateMany({where:{id:n(fd.get('id')),ecoleId:e.id},data:{statut}});revalidatePath('/dashboard/centre-academique/evaluations')}
export async function supprimerEvaluation(fd:FormData){
  await exigerPermission("ACADEMIQUE_SUPPRIMER", "app/dashboard/centre-academique/actions.ts::supprimerEvaluation");const e=await securiser();await prisma.evaluation.deleteMany({where:{id:n(fd.get('id')),ecoleId:e.id}});revalidatePath('/dashboard/centre-academique');redirect('/dashboard/centre-academique/evaluations?succes=suppression')}
export async function enregistrerNotes(fd:FormData){
  await exigerPermission("ACADEMIQUE_MODIFIER", "app/dashboard/centre-academique/actions.ts::enregistrerNotes");const e=await securiser();const evaluationId=n(fd.get('evaluationId'));const ev=await prisma.evaluation.findFirst({where:{id:evaluationId,ecoleId:e.id},select:{noteMax:true}});if(!ev)redirect('/dashboard/centre-academique/notes?erreur=evaluation');const ops=[];for(const [key,val] of fd.entries()){if(!key.startsWith('note_'))continue;const inscriptionId=Number(key.slice(5));const brut=String(val).trim();const absence=fd.get(`absent_${inscriptionId}`)==='on';const note=absence?null:Number(brut);if(!absence&&(brut===''||Number.isNaN(note)||note<0||note>Number(ev.noteMax)))continue;ops.push(prisma.note.upsert({where:{evaluationId_inscriptionId:{evaluationId,inscriptionId}},create:{evaluationId,inscriptionId,note,absent:absence,appreciation:s(fd.get(`appreciation_${inscriptionId}`))||null},update:{note,absent:absence,appreciation:s(fd.get(`appreciation_${inscriptionId}`))||null}}))}await prisma.$transaction(ops);await prisma.evaluation.update({where:{id:evaluationId},data:{statut:'PUBLIEE'}});revalidatePath('/dashboard/centre-academique');redirect(`/dashboard/centre-academique/notes?evaluationId=${evaluationId}&succes=enregistrement`)}
export async function enregistrerRegles(fd:FormData){
  await exigerPermission("ACADEMIQUE_MODIFIER", "app/dashboard/centre-academique/actions.ts::enregistrerRegles");const e=await securiser();await prisma.regleEvaluation.upsert({where:{ecoleId:e.id},create:{ecoleId:e.id,seuilReussite:n(fd.get('seuilReussite'))||50,mentionExcellent:n(fd.get('mentionExcellent'))||80,mentionTresBien:n(fd.get('mentionTresBien'))||70,mentionBien:n(fd.get('mentionBien'))||60,mentionAssezBien:n(fd.get('mentionAssezBien'))||50,arrondiDecimales:n(fd.get('arrondiDecimales'))||2},update:{seuilReussite:n(fd.get('seuilReussite'))||50,mentionExcellent:n(fd.get('mentionExcellent'))||80,mentionTresBien:n(fd.get('mentionTresBien'))||70,mentionBien:n(fd.get('mentionBien'))||60,mentionAssezBien:n(fd.get('mentionAssezBien'))||50,arrondiDecimales:n(fd.get('arrondiDecimales'))||2}});revalidatePath('/dashboard/centre-academique');redirect('/dashboard/centre-academique/regles?succes=enregistrement')}


export async function creerModeleBulletin(fd: FormData) {
  await exigerPermission("ACADEMIQUE_AJOUTER", "app/dashboard/centre-academique/actions.ts::creerModeleBulletin");
  const e = await securiser();
  const nom = s(fd.get("nom"));
  const code = s(fd.get("code")).toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
  if (!nom || !code) redirect("/dashboard/centre-academique/modeles-bulletins/nouveau?erreur=champs");
  const parDefaut = fd.get("parDefaut") === "on";
  await prisma.$transaction(async (tx) => {
    if (parDefaut) await tx.modeleBulletin.updateMany({ where: { ecoleId: e.id }, data: { parDefaut: false } });
    const modele = await tx.modeleBulletin.create({ data: {
      ecoleId: e.id, nom, code, niveau: s(fd.get("niveau")) || null,
      orientation: s(fd.get("orientation")) || "PORTRAIT",
      formatPapier: s(fd.get("formatPapier")) || "A4",
      couleurPrincipale: s(fd.get("couleurPrincipale")) || "#1761A8",
      couleurSecondaire: s(fd.get("couleurSecondaire")) || "#F4B400",
      titreDocument: s(fd.get("titreDocument")) || "BULLETIN SCOLAIRE",
      afficherLogo: fd.get("afficherLogo") === "on", afficherPhoto: fd.get("afficherPhoto") === "on",
      afficherClassement: fd.get("afficherClassement") === "on", afficherAbsences: fd.get("afficherAbsences") === "on",
      afficherQrCode: fd.get("afficherQrCode") === "on", afficherCachet: fd.get("afficherCachet") === "on",
      signature1: s(fd.get("signature1")) || null, signature2: s(fd.get("signature2")) || null,
      signature3: s(fd.get("signature3")) || null, textePiedPage: s(fd.get("textePiedPage")) || null,
      fondDocument: s(fd.get("fondDocument")) || null, parDefaut,
      configuration: { colonnes: ["matiere", "note", "coefficient", "moyenne", "appreciation"] }
    }});
    await tx.versionModeleBulletin.create({ data: { modeleBulletinId: modele.id, numeroVersion: 1, configuration: modele.configuration as any, commentaire: "Création du modèle" } });
  }).catch(() => redirect("/dashboard/centre-academique/modeles-bulletins/nouveau?erreur=doublon"));
  revalidatePath("/dashboard/centre-academique/modeles-bulletins");
  redirect("/dashboard/centre-academique/modeles-bulletins?succes=creation");
}

export async function modifierModeleBulletin(fd: FormData) {
  await exigerPermission("ACADEMIQUE_MODIFIER", "app/dashboard/centre-academique/actions.ts::modifierModeleBulletin");
  const e = await securiser(); const id = n(fd.get("id"));
  const modele = await prisma.modeleBulletin.findFirst({ where: { id, ecoleId: e.id } });
  if (!modele) redirect("/dashboard/centre-academique/modeles-bulletins?erreur=introuvable");
  const parDefaut = fd.get("parDefaut") === "on";
  const colonnes = ["matiere","interrogation","devoir","examen","note","coefficient","moyenne","place","appreciation"].filter(c => fd.get(`colonne_${c}`) === "on");
  await prisma.$transaction(async tx => {
    if (parDefaut) await tx.modeleBulletin.updateMany({ where: { ecoleId: e.id, NOT: { id } }, data: { parDefaut: false } });
    const version = modele.version + 1;
    const configuration = { colonnes };
    await tx.modeleBulletin.update({ where: { id }, data: {
      nom: s(fd.get("nom")), niveau: s(fd.get("niveau")) || null,
      orientation: s(fd.get("orientation")) || "PORTRAIT", formatPapier: s(fd.get("formatPapier")) || "A4",
      couleurPrincipale: s(fd.get("couleurPrincipale")) || "#1761A8", couleurSecondaire: s(fd.get("couleurSecondaire")) || "#F4B400",
      titreDocument: s(fd.get("titreDocument")) || "BULLETIN SCOLAIRE",
      afficherLogo: fd.get("afficherLogo") === "on", afficherPhoto: fd.get("afficherPhoto") === "on",
      afficherClassement: fd.get("afficherClassement") === "on", afficherAbsences: fd.get("afficherAbsences") === "on",
      afficherQrCode: fd.get("afficherQrCode") === "on", afficherCachet: fd.get("afficherCachet") === "on",
      signature1: s(fd.get("signature1")) || null, signature2: s(fd.get("signature2")) || null,
      signature3: s(fd.get("signature3")) || null, textePiedPage: s(fd.get("textePiedPage")) || null,
      fondDocument: s(fd.get("fondDocument")) || null, actif: fd.get("actif") === "on", parDefaut, version, configuration
    }});
    await tx.versionModeleBulletin.create({ data: { modeleBulletinId: id, numeroVersion: version, configuration, commentaire: "Mise à jour du modèle" } });
  });
  revalidatePath(`/dashboard/centre-academique/modeles-bulletins/${id}`);
  revalidatePath("/dashboard/centre-academique/modeles-bulletins");
  redirect(`/dashboard/centre-academique/modeles-bulletins/${id}?succes=enregistrement`);
}

export async function dupliquerModeleBulletin(fd: FormData) {
  await exigerPermission("ACADEMIQUE_MODIFIER", "app/dashboard/centre-academique/actions.ts::dupliquerModeleBulletin");
  const e = await securiser(); const id=n(fd.get("id"));
  const source=await prisma.modeleBulletin.findFirst({where:{id,ecoleId:e.id}});
  if(!source) return;
  let code=`${source.code}_COPIE`; let i=2;
  while(await prisma.modeleBulletin.findFirst({where:{ecoleId:e.id,code}})){code=`${source.code}_COPIE_${i++}`}
  const {id:_,createdAt,updatedAt,versions,...data}=source as any;
  await prisma.modeleBulletin.create({data:{...data,code,nom:`${source.nom} (copie)`,parDefaut:false,version:1}});
  revalidatePath("/dashboard/centre-academique/modeles-bulletins");
}

export async function supprimerModeleBulletin(fd: FormData) {
  await exigerPermission("ACADEMIQUE_SUPPRIMER", "app/dashboard/centre-academique/actions.ts::supprimerModeleBulletin");
  const e=await securiser(); const id=n(fd.get("id"));
  await prisma.modeleBulletin.deleteMany({where:{id,ecoleId:e.id,parDefaut:false}});
  revalidatePath("/dashboard/centre-academique/modeles-bulletins");
}
