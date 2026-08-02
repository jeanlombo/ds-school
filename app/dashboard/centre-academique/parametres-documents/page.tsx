import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { enregistrerParametresDocuments } from "./actions";
import styles from "../documents/documents.module.css";
export const dynamic="force-dynamic";
export default async function Page(){await exigerPermission("DOCUMENTS_PARAMETRES_GERER");const utilisateur=await obtenirUtilisateurConnecte();if(!utilisateur)redirect("/connexion");const ecole=await obtenirOuCreerEcole();const lignes=await prisma.$queryRaw<Array<{prefixe:string;longueur_sequence:number;couleur_officielle:string}>>`SELECT prefixe,longueur_sequence,couleur_officielle FROM parametres_documents_academiques WHERE ecole_id=${ecole.id} LIMIT 1`;const r=lignes[0];return <AdminShell utilisateur={utilisateur} titre="Paramètres des documents" description="Numérotation et identité visuelle."><section className={styles.panel}><form action={enregistrerParametresDocuments} className={styles.formulaire}><label><span>Préfixe *</span><input name="prefixe" required defaultValue={r?.prefixe??'DSS'}/></label><label><span>Longueur séquence *</span><input type="number" min="4" max="12" name="longueur_sequence" required defaultValue={r?.longueur_sequence??7}/></label><label><span>Couleur officielle</span><input type="color" name="couleur_officielle" defaultValue={r?.couleur_officielle??'#5B2A86'}/></label><button type="submit"><Settings size={18}/>Enregistrer</button></form></section></AdminShell>}
