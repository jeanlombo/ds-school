import Link from "next/link";
import { redirect } from "next/navigation";
import { FileCheck2, Search, ShieldCheck, Users } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { calculerResultats } from "../resultats/calculs";
import styles from "./releves.module.css";
import { terminologieSection, terminologieNeutre } from "@/lib/terminologie-academique";

export const dynamic = "force-dynamic";

type Props={searchParams:Promise<{classeId?:string;periodeId?:string;recherche?:string}>};

export default async function Page({searchParams}:Props){
 const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect('/connexion');
 const ecole=await obtenirOuCreerEcole(); const q=await searchParams;
 const [classes,periodes]=await Promise.all([
  prisma.classe.findMany({where:{ecoleId:ecole.id,statut:'active'},include:{section:true},orderBy:[{section:{nom:'asc'}},{nom:'asc'}]}),
  prisma.periodeAcademique.findMany({where:{anneeScolaire:{ecoleId:ecole.id}},include:{anneeScolaire:true},orderBy:[{anneeScolaire:{dateDebut:'desc'}},{ordre:'desc'}]})
 ]);
 const classeId=Number(q.classeId??0)||classes[0]?.id||0;
 const periodesClasse=periodes;
 const periodeId=Number(q.periodeId??0)||periodesClasse[0]?.id||0;
 const synthese=classeId&&periodeId?await calculerResultats(ecole.id,classeId,periodeId):null;
 const recherche=(q.recherche??'').trim().toLowerCase();
 const lignes=(synthese?.lignes??[]).filter(l=>!recherche||l.nomComplet.toLowerCase().includes(recherche)||l.matricule.toLowerCase().includes(recherche));
 const classe=classes.find(c=>c.id===classeId); const periode=periodes.find(p=>p.id===periodeId); const t=classe?terminologieSection(classe.section.nom,ecole.typeEtablissement):terminologieNeutre();
 return <AdminShell utilisateur={utilisateur} titre="Relevés de notes officiels" description="Générez des relevés académiques sécurisés et imprimables.">
  <div className={styles.page}><RetourDashboard/>
   <section className={styles.hero}><div><span>Documents académiques officiels</span><h2>Relevés de notes Enterprise</h2><p>Consultez les résultats consolidés, générez un numéro unique et imprimez un relevé avec code de vérification.</p></div><FileCheck2 size={82}/></section>
   <section className={styles.filters}><form><label><span>Classe / Promotion</span><select name="classeId" defaultValue={classeId}>{classes.map(c=><option key={c.id} value={c.id}>{c.nom} — {c.section.nom}</option>)}</select></label><label><span>Période</span><select name="periodeId" defaultValue={periodeId}>{periodes.map(p=><option key={p.id} value={p.id}>{p.anneeScolaire.libelle} — {p.nom}</option>)}</select></label><label><span>Recherche</span><input name="recherche" defaultValue={q.recherche??''} placeholder="Nom ou matricule"/></label><button><Search size={17}/>Afficher</button></form></section>
   <section className={styles.kpis}><article><Users/><div><small>{t.personnePlurielMaj}</small><strong>{lignes.length}</strong></div></article><article><ShieldCheck/><div><small>{t.structureMaj}</small><strong>{classe?.nom??'—'}</strong></div></article><article><FileCheck2/><div><small>Période</small><strong>{periode?.nom??'—'}</strong></div></article><article><FileCheck2/><div><small>Relevés disponibles</small><strong>{lignes.length}</strong></div></article></section>
   <section className={styles.panel}><div className={styles.panelHead}><div><span>Liste officielle</span><h3>{classe?.nom??'Classe'} · {periode?.anneeScolaire.libelle??''}</h3></div></div><div className={styles.tableWrap}><table><thead><tr><th>Rang</th><th>Matricule</th><th>{t.personneMaj}</th><th>Moyenne</th><th>Mention</th><th>Décision</th><th>Action</th></tr></thead><tbody>{lignes.map(l=><tr key={l.inscriptionId}><td>{l.rang}</td><td>{l.matricule}</td><td><strong>{l.nomComplet}</strong></td><td>{l.moyenne.toFixed(2)}%</td><td>{l.mention}</td><td>{l.decision}</td><td><Link className={styles.open} href={`/dashboard/centre-academique/releves-notes/${l.inscriptionId}?classeId=${classeId}&periodeId=${periodeId}`}>Ouvrir le relevé</Link></td></tr>)}</tbody></table>{lignes.length===0&&<div className={styles.empty}>Aucun dossier trouvé pour cette sélection.</div>}</div></section>
  </div>
 </AdminShell>
}
