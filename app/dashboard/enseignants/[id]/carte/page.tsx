import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import QRCodeEnseignant from "@/components/enseignants/QRCodeEnseignant";
import BoutonImprimer from "@/components/enseignants/BoutonImprimer";
import styles from "@/components/enseignants/carte.module.css";

type Props = { params: Promise<{ id: string }> };

export default async function CarteEnseignant({ params }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte(); if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole(); const { id } = await params;
  const e = await prisma.enseignant.findFirst({ where: { id: Number(id), ecoleId: ecole.id } });
  if (!e) redirect("/dashboard/enseignants");
  const verification = `${ecole.code}|ENSEIGNANT|${e.id}|${e.matricule}|${e.nom} ${e.prenom}|${e.statut}`;

  return <main className={styles.page}>
    <div className={styles.outils}><Link href={`/dashboard/enseignants/${e.id}`}><ArrowLeft size={18}/> Retour</Link><BoutonImprimer/></div>
    <section className={styles.carte}>
      <header>{ecole.logo ? <img src={ecole.logo} alt="Logo"/> : <span>DS</span>}<div><strong>{ecole.nom}</strong><small>CARTE PROFESSIONNELLE</small></div></header>
      <div className={styles.corps}>
        <div className={styles.photo}>{e.photo ? <img src={e.photo} alt={`Photo de ${e.prenom}`}/> : <span>{e.prenom[0]}{e.nom[0]}</span>}</div>
        <div className={styles.infos}><small>IDENTITÉ</small><h1>{e.nom} {e.postnom || ""}</h1><h2>{e.prenom}</h2><p><b>Matricule</b> {e.matricule}</p><p><b>Fonction</b> {e.fonction}</p><p><b>Spécialité</b> {e.specialite || "—"}</p><p><b>Statut</b> {e.statut}</p></div>
        <div className={styles.qr}><QRCodeEnseignant valeur={verification} taille={112}/><small>SCAN DE VÉRIFICATION</small></div>
      </div>
      <footer><span><Radio size={15}/> RFID/NFC READY {e.numeroCarteRfid ? `· ${e.numeroCarteRfid}` : ""}</span><span>{ecole.telephone || ecole.email || "DS School Premium"}</span></footer>
    </section>
    <p className={styles.note}>Format carte PVC. Pour imprimer : Ctrl + P, orientation paysage, échelle 100 %.</p>
  </main>;
}
