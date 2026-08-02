import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Ban, FileBadge2, FileCheck2, Plus, Search, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import styles from "./documents.module.css";

export const dynamic="force-dynamic";
type Props={searchParams:Promise<{q?:string;type?:string;statut?:string}>};
export default async function Page({searchParams}:Props){
  await exigerPermission("DOCUMENTS_ACADEMIQUES_VOIR");
  const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect("/connexion");
  const ecole=await obtenirOuCreerEcole(); const p=await searchParams;
  const q=String(p.q??"").trim(), type=String(p.type??"").trim(), statut=String(p.statut??"").trim();
  const docs=await prisma.$queryRaw<Array<{id:number;numero_document:string;type_document:string;libelle:string;date_emission:Date;statut:string;matricule:string;nom_complet:string;classe_nom:string|null;annee_libelle:string|null;reimpressions:bigint|number}>>`
    SELECT d.id,d.numero_document,d.type_document,d.libelle,d.date_emission,d.statut,e.matricule,
      CONCAT_WS(' ',e.nom,e.postnom,e.prenom) AS nom_complet,c.nom AS classe_nom,a.libelle AS annee_libelle,
      (SELECT COUNT(*) FROM reimpressions_documents_academiques r WHERE r.document_id=d.id) AS reimpressions
    FROM documents_academiques_enterprise d
    INNER JOIN eleves e ON e.id=d.eleve_id
    LEFT JOIN inscriptions i ON i.id=d.inscription_id
    LEFT JOIN classes c ON c.id=i.classe_id
    LEFT JOIN annees_scolaires a ON a.id=i.annee_scolaire_id
    WHERE d.ecole_id=${ecole.id}
      AND (${q}='' OR d.numero_document LIKE CONCAT('%',${q},'%') OR e.matricule LIKE CONCAT('%',${q},'%') OR e.nom LIKE CONCAT('%',${q},'%') OR e.prenom LIKE CONCAT('%',${q},'%'))
      AND (${type}='' OR d.type_document=${type})
      AND (${statut}='' OR d.statut=${statut})
    ORDER BY d.created_at DESC LIMIT 500
  `;
  const total=docs.length, valides=docs.filter(d=>d.statut==='VALIDE').length, annules=docs.filter(d=>d.statut==='ANNULE').length, reimp=docs.reduce((s,d)=>s+Number(d.reimpressions),0);
  return <AdminShell utilisateur={utilisateur} titre="Centre des documents sécurisés" description="Diplômes, certificats, attestations, numérotation et historique." action={<Link href="/dashboard/centre-academique/documents/nouveau" className={styles.boutonPrimaire}><Plus size={18}/>Nouveau document</Link>}>
    <section className={styles.hero}><div><span>PHASE 5.1 — MOTEUR ENTERPRISE</span><h2>Certification académique sécurisée</h2><p>Gérez les documents officiels, leur numérotation, leur statut et leur historique.</p></div><Award size={74}/></section>
    <section className={styles.stats}><article><FileBadge2/><div><small>Total</small><strong>{total}</strong></div></article><article><FileCheck2/><div><small>Valides</small><strong>{valides}</strong></div></article><article><Ban/><div><small>Annulés</small><strong>{annules}</strong></div></article><article><ShieldCheck/><div><small>Réimpressions</small><strong>{reimp}</strong></div></article></section>
    <section className={styles.panel}><form className={styles.filtres}><label className={styles.recherche}><Search size={18}/><input name="q" defaultValue={q} placeholder="Numéro, matricule ou nom..."/></label><select name="type" defaultValue={type}><option value="">Tous les types</option><option value="DIPLOME">Diplôme</option><option value="CERTIFICAT">Certificat</option><option value="ATTESTATION">Attestation</option><option value="RELEVE_NOTES">Relevé de notes</option></select><select name="statut" defaultValue={statut}><option value="">Tous les statuts</option><option value="VALIDE">Valides</option><option value="ANNULE">Annulés</option><option value="SUSPENDU">Suspendus</option></select><button type="submit">Filtrer</button></form></section>
    <section className={styles.panel}><div className={styles.tableWrap}><table><thead><tr><th>Numéro</th><th>Document</th><th>Élève</th><th>Classe</th><th>Date</th><th>Statut</th><th>Réimpressions</th><th>Action</th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td><strong>{d.numero_document}</strong></td><td>{d.libelle}<small>{d.type_document}</small></td><td>{d.nom_complet}<small>{d.matricule}</small></td><td>{d.classe_nom??'—'}<small>{d.annee_libelle??'—'}</small></td><td>{new Date(d.date_emission).toLocaleDateString('fr-FR')}</td><td>{d.statut}</td><td>{Number(d.reimpressions)}</td><td><Link href={`/dashboard/centre-academique/documents/${d.id}`}>Ouvrir</Link></td></tr>)}</tbody></table></div></section>
  </AdminShell>;
}
