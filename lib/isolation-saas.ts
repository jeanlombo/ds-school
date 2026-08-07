import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { exigerEcoleActive, verifierAccesEcole, obtenirOrganisationDeLEcole } from "@/lib/multi-etablissement";

export async function contexteSaas(){
  const utilisateur=await obtenirUtilisateurConnecte();
  if(!utilisateur) throw new Error("AUTHENTIFICATION_REQUISE");
  const ecole=await exigerEcoleActive();
  if(!utilisateur.superAdministrateur && !(await verifierAccesEcole(ecole.id)))
    throw new Error("ACCES_ETABLISSEMENT_REFUSE");
  const organisation=await obtenirOrganisationDeLEcole(ecole.id);
  return {utilisateur,ecole,organisation};
}

export async function verifierQuotaUtilisateurs(ecoleId:number){
  const licences=await prisma.$queryRaw<{max_utilisateurs:number|null;utilisateurs_illimite:number}[]>`
    SELECT max_utilisateurs,utilisateurs_illimite FROM licences
    WHERE ecole_id=${ecoleId} AND statut='actif'
      AND (date_expiration IS NULL OR date_expiration>=CURDATE())
    ORDER BY id DESC LIMIT 1`;
  const licence=licences[0];
  if(!licence) throw new Error("Aucune licence active pour cet établissement.");
  if(Number(licence.utilisateurs_illimite)===1) return;

  const c=await prisma.$queryRaw<{n:bigint}[]>`
    SELECT COUNT(DISTINCT ue.utilisateur_id) n
    FROM utilisateurs_etablissements ue
    JOIN utilisateurs u ON u.id=ue.utilisateur_id
    WHERE ue.ecole_id=${ecoleId} AND ue.actif=1 AND u.statut='actif'`;
  const actuel=Number(c[0]?.n ?? 0), maximum=Number(licence.max_utilisateurs ?? 0);
  if(maximum>0 && actuel>=maximum)
    throw new Error(`Quota utilisateurs atteint (${actuel}/${maximum}). Contactez DIGIGROUPE pour augmenter la capacité.`);
}

export async function journaliserIsolation(action:string,ressource:string,autorise=true,details?:string){
  try{
    const u=await obtenirUtilisateurConnecte();
    const e=await exigerEcoleActive().catch(()=>null);
    const o=e?await obtenirOrganisationDeLEcole(e.id):null;
    await prisma.$executeRaw`
      INSERT INTO journal_isolation_saas(utilisateur_id,organisation_id,ecole_id,action,ressource,autorise,details)
      VALUES(${u?.id??null},${o?.id??null},${e?.id??null},${action},${ressource},${autorise?1:0},${details??null})`;
  }catch{}
}
