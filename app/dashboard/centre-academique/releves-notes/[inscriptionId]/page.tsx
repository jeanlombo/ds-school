import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { calculerResultats } from "../../resultats/calculs";
import BoutonImprimer from "../BoutonImprimer";
import styles from "../releves.module.css";
import { terminologieSection } from "@/lib/terminologie-academique";

export const dynamic="force-dynamic";
type Props={params:Promise<{inscriptionId:string}>;searchParams:Promise<{classeId?:string;periodeId?:string}>};
function codeDocument(ecole:string,annee:string,inscriptionId:number,periodeId:number){return `${ecole}-REL-${annee.replace(/[^0-9]/g,'').slice(-4)||'AN'}-${String(inscriptionId).padStart(6,'0')}-${String(periodeId).padStart(3,'0')}`.toUpperCase()}
export default async function Page({params,searchParams}:Props){
 const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect('/connexion');
 const ecole=await obtenirOuCreerEcole(); const route=await params; const q=await searchParams;
 const inscriptionId=Number(route.inscriptionId),classeId=Number(q.classeId??0),periodeId=Number(q.periodeId??0); if(!inscriptionId||!classeId||!periodeId) notFound();
 const [inscription,periode,synthese]=await Promise.all([
  prisma.inscription.findFirst({where:{id:inscriptionId,classeId,eleve:{ecoleId:ecole.id}},include:{eleve:true,classe:{include:{section:true}},anneeScolaire:true}}),
  prisma.periodeAcademique.findFirst({where:{id:periodeId,anneeScolaire:{ecoleId:ecole.id}},include:{anneeScolaire:true}}),
  calculerResultats(ecole.id,classeId,periodeId)
 ]);
 if(!inscription||!periode) notFound(); const ligne=synthese.lignes.find(l=>l.inscriptionId===inscriptionId); if(!ligne) notFound();
 const t=terminologieSection(inscription.classe.section.nom,ecole.typeEtablissement);
 const numero=codeDocument(ecole.code,periode.anneeScolaire.libelle,inscriptionId,periodeId);
 const verification=`DS School | ${numero} | ${ligne.matricule} | ${ligne.moyenne.toFixed(2)}%`;
 const qr=`https://quickchart.io/qr?size=170&text=${encodeURIComponent(verification)}`;
 return <main className={styles.documentPage}>
  <div className={styles.toolbar}><Link href={`/dashboard/centre-academique/releves-notes?classeId=${classeId}&periodeId=${periodeId}`}><ArrowLeft size={18}/>Retour à la liste</Link><BoutonImprimer/></div>
  <article className={styles.document}>
   <header className={styles.docHeader}><div className={styles.logo}>{ecole.logo?<img src={ecole.logo} alt="Logo"/>:<span>DS</span>}</div><div><small>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</small><h1>{ecole.nom}</h1><p>{ecole.slogan||'Excellence · Discipline · Innovation'}</p><h2>RELEVÉ OFFICIEL DE NOTES</h2></div><div className={styles.number}><small>N° DU RELEVÉ</small><strong>{numero}</strong><span>{t.periodeMaj} {periode.anneeScolaire.libelle}</span></div></header>
   <section className={styles.identity}><div><small>Nom complet</small><strong>{inscription.eleve.nom} {inscription.eleve.postnom??''} {inscription.eleve.prenom}</strong></div><div><small>Matricule</small><strong>{ligne.matricule}</strong></div><div><small>Sexe</small><strong>{inscription.eleve.sexe}</strong></div><div><small>{t.structureMaj}</small><strong>{inscription.classe.nom}</strong></div><div><small>{t.sectionMaj}</small><strong>{inscription.classe.section.nom}</strong></div><div><small>Période</small><strong>{periode.nom}</strong></div></section>
   <section className={styles.docSection}><div className={styles.sectionTitle}><h3>Résultats académiques</h3><span>{ligne.matieres.length} {t.cours}(s)</span></div><table className={styles.docTable}><thead><tr><th>N°</th><th>{t.coursMaj}</th><th>Évaluations</th><th>Moyenne / 100</th><th>Appréciation</th></tr></thead><tbody>{ligne.matieres.map((m,i)=><tr key={m.matiereId}><td>{i+1}</td><td>{m.nom}</td><td>{m.evaluations}</td><td><strong>{m.moyenne.toFixed(2)}</strong></td><td>{m.moyenne>=80?'Excellent':m.moyenne>=70?'Très bien':m.moyenne>=60?'Bien':m.moyenne>=50?'Assez bien':'À renforcer'}</td></tr>)}</tbody></table></section>
   <section className={styles.summary}><article><small>Moyenne générale</small><strong>{ligne.moyenne.toFixed(2)}%</strong></article><article><small>Rang</small><strong>{ligne.rang}<sup>e</sup> / {synthese.lignes.length}</strong></article><article><small>Mention</small><strong>{ligne.mention}</strong></article><article><small>Décision</small><strong>{ligne.decision}</strong></article></section>
   <section className={styles.bottom}><div className={styles.signature}><p>Fait à {ecole.ville||'____________'}, le {new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date())}</p><strong>{ecole.directeur||'Le Directeur des études'}</strong><span>Signature et cachet</span></div><div className={styles.verify}><img src={qr} alt="QR de vérification"/><div><strong><CheckCircle2 size={16}/> Vérification du document</strong><p>{numero}</p><small>Le code lisible reste disponible même si l’image QR ne se charge pas hors connexion.</small></div></div></section>
   <footer><span>{ecole.adresse||''} {ecole.ville||''}</span><span>{ecole.telephone||''} · {ecole.email||''}</span><span>Généré par DS School Enterprise</span></footer>
  </article>
 </main>
}
