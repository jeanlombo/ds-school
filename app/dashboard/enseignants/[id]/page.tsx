import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Award, BriefcaseBusiness, CreditCard, Pencil, Plus, School, UserRoundCheck } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import admin from "@/components/admin/admin.module.css";
import styles from "@/components/enseignants/enseignants.module.css";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { ajouterAffectation, ajouterContrat, ajouterDiplome } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ succes?: string }> };

export default async function ProfilEnseignant({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte(); if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole(); const { id } = await params; const { succes } = await searchParams;
  const [e, classes] = await Promise.all([
    prisma.enseignant.findFirst({
      where: { id: Number(id), ecoleId: ecole.id },
      include: {
        diplomes: { orderBy: { createdAt: "desc" } },
        contrats: { orderBy: { createdAt: "desc" } },
        affectations: { include: { classe: { include: { section: true } } }, orderBy: { createdAt: "desc" } },
        historiques: { orderBy: { createdAt: "desc" }, take: 20 }
      }
    }),
    prisma.classe.findMany({ where: { ecoleId: ecole.id, statut: "active" }, include: { section: true }, orderBy: { nom: "asc" } })
  ]);
  if (!e) redirect("/dashboard/enseignants");

  return <AdminShell utilisateur={utilisateur} titre="Profil enseignant" description="Dossier administratif, pédagogique et professionnel."
    action={<div className={styles.actionsEntete}><Link href="/dashboard/enseignants" className={admin.boutonSecondaire}><ArrowLeft size={18}/> Liste</Link><Link href={`/dashboard/enseignants/${e.id}/modifier`} className={admin.boutonPrimaire}><Pencil size={18}/> Modifier</Link></div>}>
    {succes && <div className={styles.succes}>{succes}</div>}
    <section className={`${admin.panneau} ${styles.profilHero}`}>
      <div className={styles.grandePhoto}>{e.photo ? <img src={e.photo} alt="" /> : <UserRoundCheck size={70}/>}</div>
      <div><span className={admin.badge}>{e.statut}</span><h2>{e.nom} {e.postnom || ""} {e.prenom}</h2><p>{e.fonction} · {e.specialite || "Spécialité non précisée"}</p>
        <div className={styles.meta}><span>Matricule : <strong>{e.matricule}</strong></span><span>Tél. : <strong>{e.telephone || "—"}</strong></span><span>Email : <strong>{e.email || "—"}</strong></span></div>
      </div>
      <Link href={`/dashboard/enseignants/${e.id}/carte`} className={admin.boutonSecondaire}><CreditCard size={18}/> Carte professionnelle</Link>
    </section>

    <div className={styles.deuxColonnes}>
      <section className={admin.panneau}><div className={admin.panneauEntete}><div><h2><Award size={19}/> Diplômes</h2></div></div><div className={admin.panneauCorps}>
        <form action={ajouterDiplome} className={styles.formInline}><input type="hidden" name="enseignantId" value={e.id}/><input name="intitule" placeholder="Intitulé" required/><input name="etablissement" placeholder="Établissement"/><input type="number" name="annee" placeholder="Année"/><button className={admin.boutonPrimaire}><Plus size={16}/> Ajouter</button></form>
        <div className={styles.liste}>{e.diplomes.map(d => <article key={d.id}><Award/><div><strong>{d.intitule}</strong><small>{d.etablissement || "—"} {d.annee ? `· ${d.annee}` : ""}</small></div></article>)}{!e.diplomes.length && <p>Aucun diplôme enregistré.</p>}</div>
      </div></section>

      <section className={admin.panneau}><div className={admin.panneauEntete}><div><h2><BriefcaseBusiness size={19}/> Contrats</h2></div></div><div className={admin.panneauCorps}>
        <form action={ajouterContrat} className={styles.formInline}><input type="hidden" name="enseignantId" value={e.id}/><input name="typeContrat" placeholder="Type de contrat" required/><input type="date" name="dateDebut" required/><input type="date" name="dateFin"/><input type="number" step="0.01" name="salaire" placeholder="Salaire"/><select name="devise"><option>CDF</option><option>USD</option></select><button className={admin.boutonPrimaire}><Plus size={16}/> Ajouter</button></form>
        <div className={styles.liste}>{e.contrats.map(c => <article key={c.id}><BriefcaseBusiness/><div><strong>{c.typeContrat}</strong><small>{c.dateDebut.toLocaleDateString("fr-FR")} · {c.salaire ? `${c.salaire} ${c.devise}` : "Salaire non renseigné"}</small></div></article>)}{!e.contrats.length && <p>Aucun contrat enregistré.</p>}</div>
      </div></section>
    </div>

    <section className={admin.panneau}><div className={admin.panneauEntete}><div><h2><School size={19}/> Affectations pédagogiques</h2></div></div><div className={admin.panneauCorps}>
      <form action={ajouterAffectation} className={styles.formInline}><input type="hidden" name="enseignantId" value={e.id}/><input name="matiere" placeholder="Matière" required/><select name="classeId"><option value="">Toutes / aucune classe</option>{classes.map(c => <option key={c.id} value={c.id}>{c.nom} — {c.section.nom}</option>)}</select><input type="number" name="volumeHoraire" placeholder="Heures/semaine"/><input name="anneeLibelle" placeholder="Année scolaire"/><button className={admin.boutonPrimaire}><Plus size={16}/> Affecter</button></form>
      <div className={styles.affectations}>{e.affectations.map(a => <article key={a.id}><strong>{a.matiere}</strong><span>{a.classe ? `${a.classe.nom} · ${a.classe.section.nom}` : "Aucune classe précise"}</span><small>{a.volumeHoraire ? `${a.volumeHoraire} h/semaine` : "Volume non défini"} {a.anneeLibelle ? `· ${a.anneeLibelle}` : ""}</small></article>)}{!e.affectations.length && <p>Aucune affectation.</p>}</div>
    </div></section>

    <section className={admin.panneau}><div className={admin.panneauEntete}><div><h2>Historique récent</h2></div></div><div className={admin.panneauCorps}><div className={styles.timeline}>{e.historiques.map(h => <article key={h.id}><span></span><div><strong>{h.type}</strong><p>{h.details}</p><small>{h.createdAt.toLocaleString("fr-FR")} · {h.auteur || "Système"}</small></div></article>)}</div></div></section>
  </AdminShell>;
}
