import { redirect } from "next/navigation";
import { Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../documents/documents.module.css";
export const dynamic="force-dynamic";
export default async function Page(){await exigerPermission("DOCUMENTS_ACADEMIQUES_REIMPRIMER");const utilisateur=await obtenirUtilisateurConnecte();if(!utilisateur)redirect("/connexion");const ecole=await obtenirOuCreerEcole();const lignes=await prisma.$queryRaw<Array<{numero_document:string;libelle:string;format_impression:string;imprime_par:string;adresse_ip:string|null;created_at:Date}>>`SELECT d.numero_document,d.libelle,r.format_impression,r.imprime_par,r.adresse_ip,r.created_at FROM reimpressions_documents_academiques r INNER JOIN documents_academiques_enterprise d ON d.id=r.document_id WHERE r.ecole_id=${ecole.id} ORDER BY r.created_at DESC LIMIT 1000`;return <AdminShell utilisateur={utilisateur} titre="Historique des réimpressions" description="Traçabilité des impressions."><section className={styles.panel}><h2><Printer size={20}/> Réimpressions</h2><div className={styles.tableWrap}><table><thead><tr><th>Document</th><th>Libellé</th><th>Format</th><th>Utilisateur</th><th>IP</th><th>Date</th></tr></thead><tbody>{lignes.map((l,i)=><tr key={`${l.numero_document}-${i}`}><td>{l.numero_document}</td><td>{l.libelle}</td><td>{l.format_impression}</td><td>{l.imprime_par}</td><td>{l.adresse_ip??'—'}</td><td>{new Date(l.created_at).toLocaleString('fr-FR')}</td></tr>)}</tbody></table></div></section></AdminShell>}
