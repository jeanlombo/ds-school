import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Ban, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { annulerDocumentAcademique } from "../actions";
import BoutonImprimer from "./BoutonImprimer";
import styles from "../documents.module.css";
export const dynamic="force-dynamic";
type Props={params:Promise<{id:string}>;searchParams:Promise<{succes?:string;erreur?:string}>};
export default async function Page({params,searchParams}:Props){
  await exigerPermission("DOCUMENTS_ACADEMIQUES_VOIR");
  const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect("/connexion");
  const ecole=await obtenirOuCreerEcole(); const {id}=await params; const query=await searchParams; const documentId=Number(id); if(!Number.isInteger(documentId)) notFound();
  const lignes=await prisma.$queryRaw<Array<{id:number;numero_document:string;type_document:string;libelle:string;code_verification:string;empreinte_securite:string;date_emission:Date;mention:string|null;session:string|null;motif:string|null;statut:string;motif_annulation:string|null;matricule:string;nom_complet:string;classe_nom:string|null;annee_libelle:string|null;cree_par:string;created_at:Date}>>`
    SELECT d.id,d.numero_document,d.type_document,d.libelle,d.code_verification,d.empreinte_securite,d.date_emission,d.mention,d.session,d.motif,d.statut,d.motif_annulation,e.matricule,CONCAT_WS(' ',e.nom,e.postnom,e.prenom) AS nom_complet,c.nom AS classe_nom,a.libelle AS annee_libelle,d.cree_par,d.created_at
    FROM documents_academiques_enterprise d INNER JOIN eleves e ON e.id=d.eleve_id LEFT JOIN inscriptions i ON i.id=d.inscription_id LEFT JOIN classes c ON c.id=i.classe_id LEFT JOIN annees_scolaires a ON a.id=i.annee_scolaire_id
    WHERE d.id=${documentId} AND d.ecole_id=${ecole.id} LIMIT 1
  `;
  const d=lignes[0]; if(!d) notFound(); const annuler=annulerDocumentAcademique.bind(null,d.id);
  return <AdminShell utilisateur={utilisateur} titre={d.libelle} description={`Document ${d.numero_document}`}><Link href="/dashboard/centre-academique/documents" className={styles.retour}><ArrowLeft size={17}/>Retour au registre</Link>{query.succes&&<div className={styles.succes}>Opération réalisée avec succès.</div>}{query.erreur==='motif'&&<div className={styles.erreur}>Le motif d’annulation est obligatoire.</div>}<section className={styles.fiche}>{d.statut==='ANNULE'&&<div className={styles.filigrane}>DOCUMENT ANNULÉ</div>}<header><div><small>DS SCHOOL ENTERPRISE</small><h1>{ecole.nom}</h1><p>{d.libelle}</p></div><div><ShieldCheck size={34}/><strong>{d.numero_document}</strong><small>{d.statut}</small></div></header><section className={styles.identite}><h2>{d.nom_complet}</h2><p>Matricule : {d.matricule}</p><p>Classe : {d.classe_nom??'—'}</p><p>Année scolaire : {d.annee_libelle??'—'}</p></section><section className={styles.meta}><div><small>Type</small><strong>{d.type_document}</strong></div><div><small>Date</small><strong>{new Date(d.date_emission).toLocaleDateString('fr-FR')}</strong></div><div><small>Mention</small><strong>{d.mention??'—'}</strong></div><div><small>Session</small><strong>{d.session??'—'}</strong></div></section>{d.motif&&<p className={styles.motif}>{d.motif}</p>}<section className={styles.securite}><div><small>Code de vérification</small><strong>{d.code_verification}</strong></div><div><small>Empreinte SHA-256</small><code>{d.empreinte_securite}</code></div></section><footer>Créé par {d.cree_par} le {new Date(d.created_at).toLocaleString('fr-FR')}</footer></section><section className={styles.actionsDocument}><BoutonImprimer documentId={d.id}/>{d.statut==='VALIDE'&&<form action={annuler}><input name="motif_annulation" required placeholder="Motif d’annulation"/><button type="submit"><Ban size={17}/>Annuler le document</button></form>}</section></AdminShell>;
}
