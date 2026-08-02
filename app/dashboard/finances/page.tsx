import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleDollarSign, Landmark, ReceiptText, Tags, WalletCards, FileBarChart, BadgePercent, CalendarClock } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import styles from "./finances-enterprise.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardFinances() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();

  const [jour, mois, paiements, recus, caisses] = await Promise.all([
    prisma.$queryRaw<Array<{total:number}>>`SELECT COALESCE(SUM(montant_total),0) total FROM paiements_scolaires WHERE ecole_id=${ecole.id} AND statut='VALIDE' AND DATE(date_paiement)=CURDATE()`,
    prisma.$queryRaw<Array<{total:number}>>`SELECT COALESCE(SUM(montant_total),0) total FROM paiements_scolaires WHERE ecole_id=${ecole.id} AND statut='VALIDE' AND YEAR(date_paiement)=YEAR(CURDATE()) AND MONTH(date_paiement)=MONTH(CURDATE())`,
    prisma.$queryRaw<Array<{total:bigint}>>`SELECT COUNT(*) total FROM paiements_scolaires WHERE ecole_id=${ecole.id} AND statut='VALIDE' AND DATE(date_paiement)=CURDATE()`,
    prisma.$queryRaw<Array<{total:bigint}>>`SELECT COUNT(*) total FROM recus_scolaires WHERE ecole_id=${ecole.id} AND statut='VALIDE'`,
    prisma.$queryRaw<Array<{total:bigint}>>`SELECT COUNT(*) total FROM sessions_caisse_scolaire WHERE ecole_id=${ecole.id} AND statut='OUVERTE'`,
  ]);

  const liens = [
    ["/dashboard/finances/categories-frais","Catégories de frais",Tags],
    ["/dashboard/finances/frais-scolaires","Frais scolaires",WalletCards],
    ["/dashboard/finances/paiements","Paiements",CircleDollarSign],
    ["/dashboard/finances/recus","Reçus",ReceiptText],
    ["/dashboard/finances/caisse","Caisse",Landmark],
    ["/dashboard/finances/echeanciers","Échéanciers",CalendarClock],
    ["/dashboard/finances/bourses-remises","Bourses & remises",BadgePercent],
    ["/dashboard/finances/rapports","Rapports financiers",FileBarChart],
  ] as const;

  return <AdminShell utilisateur={utilisateur} titre="Finances Enterprise" description="Pilotage financier complet de l'établissement.">
    <div className={styles.page}>
      <section className={styles.hero}><h2>Comptabilité scolaire Enterprise</h2><p>Encaissements, caisse, reçus, échéanciers, bourses, remises et rapports.</p></section>
      <div className={styles.grille}>
        <article className={styles.carte}><small>Encaissements du jour</small><strong>{Number(jour[0]?.total??0).toLocaleString("fr-FR")} CDF</strong></article>
        <article className={styles.carte}><small>Encaissements du mois</small><strong>{Number(mois[0]?.total??0).toLocaleString("fr-FR")} CDF</strong></article>
        <article className={styles.carte}><small>Paiements aujourd'hui</small><strong>{Number(paiements[0]?.total??0)}</strong></article>
        <article className={styles.carte}><small>Caisses ouvertes</small><strong>{Number(caisses[0]?.total??0)}</strong></article>
      </div>
      <section className={styles.panel}><h3>Modules financiers</h3><div className={styles.grille}>{liens.map(([href,label,Icon])=><Link key={href} href={href} className={styles.carte} style={{textDecoration:"none"}}><Icon/><strong style={{fontSize:"1rem"}}>{label}</strong></Link>)}</div></section>
    </div>
  </AdminShell>;
}
