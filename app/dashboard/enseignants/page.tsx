import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, CreditCard, Eye, Pencil, Search, UserPlus, UserRoundCheck, UsersRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import admin from "@/components/admin/admin.module.css";
import styles from "@/components/enseignants/enseignants.module.css";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { changerStatutEnseignant } from "./actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const t = (v: string | string[] | undefined, d = "") => typeof v === "string" ? v : d;

export default async function EnseignantsPage({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const p = await searchParams;
  const q = t(p.q).trim();
  const statut = t(p.statut, "actif");

  const where: any = {
    ecoleId: ecole.id,
    ...(statut ? { statut } : {}),
    ...(q ? { OR: [
      { matricule: { contains: q } }, { nom: { contains: q } }, { prenom: { contains: q } },
      { postnom: { contains: q } }, { telephone: { contains: q } }, { specialite: { contains: q } }
    ] } : {})
  };

  const [enseignants, total, actifs, archives, affectes] = await Promise.all([
    prisma.enseignant.findMany({
      where, include: { affectations: { include: { classe: true }, take: 3 } },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }]
    }),
    prisma.enseignant.count({ where: { ecoleId: ecole.id } }),
    prisma.enseignant.count({ where: { ecoleId: ecole.id, statut: "actif" } }),
    prisma.enseignant.count({ where: { ecoleId: ecole.id, statut: "archive" } }),
    prisma.enseignant.count({ where: { ecoleId: ecole.id, affectations: { some: { statut: "active" } } } })
  ]);

  return <AdminShell utilisateur={utilisateur} titre="Enseignants"
    description="Dossiers administratifs, affectations pédagogiques et cartes professionnelles."
    action={<Link href="/dashboard/enseignants/nouveau" className={admin.boutonPrimaire}><UserPlus size={18}/> Nouvel enseignant</Link>}>
    <div className={styles.stats}>
      <article><UsersRound/><div><small>Total</small><strong>{total}</strong></div></article>
      <article><UserRoundCheck/><div><small>Actifs</small><strong>{actifs}</strong></div></article>
      <article><UserRoundCheck/><div><small>Affectés</small><strong>{affectes}</strong></div></article>
      <article><Archive/><div><small>Archivés</small><strong>{archives}</strong></div></article>
    </div>

    <section className={admin.panneau}>
      <div className={admin.panneauEntete}><div><h2>Répertoire des enseignants</h2><p>{enseignants.length} résultat(s)</p></div></div>
      <form className={styles.filtres}>
        <label><Search size={18}/><input name="q" defaultValue={q} placeholder="Nom, matricule, téléphone ou spécialité"/></label>
        <select name="statut" defaultValue={statut}><option value="actif">Actifs</option><option value="archive">Archivés</option><option value="">Tous</option></select>
        <button className={admin.boutonSecondaire}>Filtrer</button>
      </form>
      <div className={admin.tableWrap}>
        <table className={admin.table}><thead><tr><th>Enseignant</th><th>Matricule</th><th>Fonction</th><th>Spécialité</th><th>Contact</th><th>Affectations</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          {enseignants.map(e => <tr key={e.id}>
            <td><div className={styles.identite}><span>{e.photo ? <img src={e.photo} alt="" /> : `${e.prenom[0] || ""}${e.nom[0] || ""}`}</span><div><strong>{e.nom} {e.postnom || ""}</strong><small>{e.prenom}</small></div></div></td>
            <td><strong>{e.matricule}</strong></td><td>{e.fonction}</td><td>{e.specialite || "—"}</td>
            <td><span>{e.telephone || "—"}</span><small className={styles.sousTexte}>{e.email || ""}</small></td>
            <td>{e.affectations.length ? e.affectations.map(a => <small className={styles.puce} key={a.id}>{a.matiere}{a.classe ? ` · ${a.classe.nom}` : ""}</small>) : "—"}</td>
            <td><span className={`${admin.badge} ${e.statut !== "actif" ? admin.badgeInactif : ""}`}>{e.statut}</span></td>
            <td><div className={admin.actionsTable}>
              <Link href={`/dashboard/enseignants/${e.id}`} title="Profil"><Eye size={17}/></Link>
              <Link href={`/dashboard/enseignants/${e.id}/modifier`} title="Modifier"><Pencil size={17}/></Link>
              <Link href={`/dashboard/enseignants/${e.id}/carte`} title="Carte"><CreditCard size={17}/></Link>
              <form action={changerStatutEnseignant}><input type="hidden" name="id" value={e.id}/><button title="Changer le statut"><Archive size={17}/></button></form>
            </div></td>
          </tr>)}
          {!enseignants.length && <tr><td colSpan={8}><div className={admin.vide}><UserRoundCheck size={38}/><p>Aucun enseignant trouvé.</p></div></td></tr>}
        </tbody></table>
      </div>
    </section>
  </AdminShell>;
}
