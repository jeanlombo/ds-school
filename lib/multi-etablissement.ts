import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { obtenirUtilisateurConnecte } from "@/lib/session";

export const COOKIE_ECOLE_ACTIVE = "ds_school_ecole_active";

export type EcoleAccessible = { id:number; nom:string; code:string; ville:string|null };

async function installationEncoreMonoClient(): Promise<boolean> {
  try {
    const r=await prisma.$queryRaw<{n:bigint}[]>`SELECT COUNT(*) n FROM organisations_clientes`;
    return Number(r[0]?.n ?? 0) === 0;
  } catch { return true; }
}

export async function listerEcolesAccessibles(): Promise<EcoleAccessible[]> {
  const utilisateur=await obtenirUtilisateurConnecte();
  if(!utilisateur) return [];

  if(utilisateur.superAdministrateur){
    return prisma.$queryRaw<EcoleAccessible[]>`
      SELECT id,nom,code,ville FROM ecoles WHERE statut='active' ORDER BY nom`;
  }

  const directes=await prisma.$queryRaw<EcoleAccessible[]>`
    SELECT DISTINCT e.id,e.nom,e.code,e.ville
    FROM ecoles e
    JOIN utilisateurs_etablissements ue ON ue.ecole_id=e.id AND ue.actif=1
    WHERE ue.utilisateur_id=${utilisateur.id} AND e.statut='active'`;

  const groupe=await prisma.$queryRaw<EcoleAccessible[]>`
    SELECT DISTINCT e.id,e.nom,e.code,e.ville
    FROM ecoles e
    JOIN organisation_etablissements oe ON oe.ecole_id=e.id
    JOIN utilisateurs_organisations uo ON uo.organisation_id=oe.organisation_id AND uo.actif=1
    WHERE uo.utilisateur_id=${utilisateur.id} AND e.statut='active'`;

  const m=new Map<number,EcoleAccessible>();
  [...directes,...groupe].forEach(e=>m.set(Number(e.id),{...e,id:Number(e.id)}));

  // Compatibilité uniquement tant qu'aucun client SaaS n'a été créé.
  if(m.size===0 && await installationEncoreMonoClient()){
    const e=await prisma.ecole.findFirst({where:{statut:"active"},orderBy:{id:"asc"},select:{id:true,nom:true,code:true,ville:true}});
    if(e) m.set(e.id,e);
  }
  return [...m.values()].sort((a,b)=>a.nom.localeCompare(b.nom,"fr"));
}

export async function obtenirEcoleActive(){
  const accessibles=await listerEcolesAccessibles();
  if(!accessibles.length) return null;
  const c=await cookies();
  const id=Number(c.get(COOKIE_ECOLE_ACTIVE)?.value ?? 0);
  return accessibles.find(e=>e.id===id) ?? accessibles[0];
}

export async function verifierAccesEcole(ecoleId:number){
  return (await listerEcolesAccessibles()).some(e=>e.id===ecoleId);
}

export async function exigerEcoleActive(){
  const e=await obtenirEcoleActive();
  if(!e) throw new Error("Aucun établissement autorisé pour ce compte.");
  return e;
}

export async function obtenirOrganisationDeLEcole(ecoleId:number){
  const r=await prisma.$queryRaw<{id:number;nom:string}[]>`
    SELECT o.id,o.nom FROM organisations_clientes o
    JOIN organisation_etablissements oe ON oe.organisation_id=o.id
    WHERE oe.ecole_id=${ecoleId} LIMIT 1`;
  return r[0] ?? null;
}
