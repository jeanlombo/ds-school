import { NextResponse } from "next/server";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function exigerPermissionApi(code: string) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) return { autorise: false as const, reponse: NextResponse.json({ ok:false, erreur:"NON_CONNECTE" }, { status:401 }) };
  const autorise = utilisateur.superAdministrateur || utilisateur.permissions?.includes("*") || utilisateur.permissions?.includes(code);
  if (autorise) return { autorise: true as const, utilisateur };
  await prisma.$executeRaw`INSERT INTO journal_audit_securite (utilisateur_id,utilisateur_nom,action,module,description,niveau,created_at) VALUES (${utilisateur.utilisateurSecuriteId},${utilisateur.nom},'ACCES_API_REFUSE','API',${`Permission refusée : ${code}`},'IMPORTANT',NOW())`.catch(()=>undefined);
  return { autorise:false as const, reponse:NextResponse.json({ ok:false, erreur:"ACCES_REFUSE", permission:code }, { status:403 }) };
}

export function exigerCleApiSafeCampus(request: Request) {
  const attendue = process.env.SAFE_CAMPUS_API_KEY;
  const recue = request.headers.get("x-api-key");
  if (!attendue || !recue || recue !== attendue) return NextResponse.json({ok:false,erreur:"CLE_API_INVALIDE"},{status:401});
  return null;
}
