import { redirect } from "next/navigation";
import { Ban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../documents/documents.module.css";
export const dynamic="force-dynamic";
export default async function Page(){await exigerPermission("DOCUMENTS_ACADEMIQUES_VOIR");const utilisateur=await obtenirUtilisateurConnecte();if(!utilisateur)redirect("/connexion");const ecole=await obtenirOuCreerEcole();const docs=await prisma.$queryRaw<Array<{numero_document:string;libelle:string;nom_complet:string;motif_annulation:string|null;annule_par:string|null;annule_le:Date|null}>>`SELECT d.numero_document,d.libelle,CONCAT_WS(' ',e.nom,e.postnom,e.prenom) AS nom_complet,d.motif_annulation,d.annule_par,d.annule_le FROM documents_academiques_enterprise d INNER JOIN eleves e ON e.id=d.eleve_id WHERE d.ecole_id=${ecole.id} AND d.statut='ANNULE' ORDER BY d.annule_le DESC`;return <AdminShell utilisateur={utilisateur} titre="Documents annulés" description="Registre officiel des documents invalidés."><section className={styles.panel}><h2><Ban size={20}/> Documents annulés</h2><div className={styles.tableWrap}><table><thead><tr><th>Numéro</th><th>Document</th><th>Élève</th><th>Motif</th><th>Annulé par</th><th>Date</th></tr></thead><tbody>{docs.map(d=><tr key={d.numero_document}><td>{d.numero_document}</td><td>{d.libelle}</td><td>{d.nom_complet}</td><td>{d.motif_annulation??'—'}</td><td>{d.annule_par??'—'}</td><td>{d.annule_le?new Date(d.annule_le).toLocaleString('fr-FR'):'—'}</td></tr>)}</tbody></table></div></section></AdminShell>}
