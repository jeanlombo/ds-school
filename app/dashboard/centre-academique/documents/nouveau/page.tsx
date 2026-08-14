import { redirect } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import { creerDocumentAcademique } from "../actions";
import styles from "../documents.module.css";
export const dynamic="force-dynamic";
export default async function Page(){
  await exigerPermission("DOCUMENTS_ACADEMIQUES_CREER");
  const utilisateur=await obtenirUtilisateurConnecte(); if(!utilisateur) redirect("/connexion");
  const ecole=await obtenirOuCreerEcole();
  const inscriptions=await prisma.inscription.findMany({where:{classe:{ecoleId:ecole.id},statut:{in:["inscrit","admis","promu","redouble"]}},include:{eleve:true,classe:true,anneeScolaire:true},orderBy:[{eleve:{nom:"asc"}},{eleve:{prenom:"asc"}}]});
  return <AdminShell utilisateur={utilisateur} titre="Nouveau document académique" description="Créez un document avec numéro unique."><section className={styles.panel}><form action={creerDocumentAcademique} className={styles.formulaire}><label className={styles.large}><span>Apprenant et inscription *</span><select name="inscription_id" required defaultValue=""><option value="" disabled>Sélectionner</option>{inscriptions.map(i=><option key={i.id} value={i.id}>{i.eleve.nom} {i.eleve.postnom??''} {i.eleve.prenom} — {i.classe.nom} — {i.anneeScolaire.libelle}</option>)}</select></label><label><span>Type *</span><select name="type_document" required defaultValue=""><option value="" disabled>Sélectionner</option><option value="DIPLOME">Diplôme</option><option value="CERTIFICAT">Certificat</option><option value="ATTESTATION">Attestation</option><option value="RELEVE_NOTES">Relevé de notes</option><option value="BONNE_CONDUITE">Bonne conduite</option><option value="FREQUENTATION">Fréquentation</option><option value="TRANSFERT">Transfert</option></select></label><label><span>Date d’émission</span><input type="date" name="date_emission" defaultValue={new Date().toISOString().slice(0,10)}/></label><label className={styles.large}><span>Libellé officiel *</span><input name="libelle" required placeholder="Certificat de réussite"/></label><label><span>Mention</span><input name="mention"/></label><label><span>Session</span><input name="session"/></label><label className={styles.large}><span>Motif / précision</span><textarea name="motif" rows={4}/></label><button type="submit"><FilePlus2 size={18}/>Créer le document</button></form></section></AdminShell>;
}
