import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Archive, BookOpenCheck, CalendarDays, HeartPulse, Mail, MapPin, Phone, UserRound, UsersRound, Pencil, CreditCard, Clock3 } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import { ajouterObservation, changerStatutEleve } from "../actions";
import { terminologieSection } from "@/lib/terminologie-academique";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProfilEleve({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte(); if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const query = await searchParams;
  const eleve = await prisma.eleve.findFirst({ where: { id: Number(id), ecoleId: ecole.id }, include: { responsables: { orderBy: [{ principal: "desc" }, { type: "asc" }] }, inscriptions: { include: { classe: { include: { section: true } }, anneeScolaire: true }, orderBy: { createdAt: "desc" } }, observations: { orderBy: { createdAt: "desc" } }, documents: true, historiques: { orderBy: { createdAt: "desc" }, take: 30 } } });
  if (!eleve) notFound();
  const succes = typeof query.succes === "string" ? query.succes : "";
  const inscription = eleve.inscriptions[0];
  const t = terminologieSection(inscription?.classe.section.nom, ecole.typeEtablissement);
  const age = Math.max(0, new Date().getFullYear() - eleve.dateNaissance.getFullYear());
  return <AdminShell utilisateur={utilisateur} titre={`Dossier de l’${t.personne}`} description={`Profil centralisé de l’${t.personne}, inscription, responsables et suivi académique.`} action={<div className={elevesStyles.headerActions}><Link href={`/dashboard/eleves/${eleve.id}/carte`} className={styles.boutonSecondaire}><CreditCard size={18}/> {t.carte}</Link><Link href={`/dashboard/eleves/${eleve.id}/modifier`} className={styles.boutonPrimaire}><Pencil size={18}/> Modifier</Link><Link href="/dashboard/eleves" className={styles.boutonSecondaire}><ArrowLeft size={18}/> Retour</Link></div>}>
    {succes && <div className={styles.message}>{succes}</div>}
    <section className={elevesStyles.profilHero}>
      <div className={elevesStyles.avatarGrand}>{eleve.photo ? <img src={eleve.photo} alt=""/> : `${eleve.prenom[0]}${eleve.nom[0]}`}</div>
      <div className={elevesStyles.profilIdentite}><span>{eleve.matricule}</span><h2>{eleve.nom} {eleve.postnom || ""} {eleve.prenom}</h2><p>{eleve.sexe === "M" ? t.masculin : t.feminin} · {age} ans · Né(e) le {eleve.dateNaissance.toLocaleDateString("fr-FR")}</p><div>{inscription && <strong><BookOpenCheck size={17}/> {inscription.classe.section.nom} — {inscription.classe.nom}</strong>}<span className={`${styles.badge} ${eleve.statut !== "actif" ? styles.badgeInactif : ""}`}>{eleve.statut}</span></div></div>
      <form action={changerStatutEleve}><input type="hidden" name="id" value={eleve.id}/><input type="hidden" name="statut" value={eleve.statut}/><button className={eleve.statut === "actif" ? styles.boutonDanger : styles.boutonPrimaire}><Archive size={17}/>{eleve.statut === "actif" ? "Archiver" : "Réactiver"}</button></form>
    </section>

    <div className={styles.deuxColonnes}>
      <div>
        <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>Informations générales</h2><p>Identité et coordonnées.</p></div></div><div className={styles.panneauCorps}><div className={elevesStyles.infosGrille}>
          <div><UserRound/><span><small>Nom complet</small><strong>{eleve.nom} {eleve.postnom || ""} {eleve.prenom}</strong></span></div>
          <div><CalendarDays/><span><small>Naissance</small><strong>{eleve.dateNaissance.toLocaleDateString("fr-FR")} {eleve.lieuNaissance ? `à ${eleve.lieuNaissance}` : ""}</strong></span></div>
          <div><MapPin/><span><small>Adresse</small><strong>{eleve.adresse || "Non renseignée"}</strong></span></div>
          <div><HeartPulse/><span><small>Groupe sanguin</small><strong>{eleve.groupeSanguin || "Non renseigné"}</strong></span></div>
        </div></div></section>
        <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>Historique des inscriptions</h2><p>Parcours académique enregistré.</p></div></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Année scolaire / académique</th><th>Section</th><th>Classe / promotion</th><th>Admission</th><th>Statut</th></tr></thead><tbody>{eleve.inscriptions.map(i=><tr key={i.id}><td>{i.anneeScolaire.libelle}</td><td>{i.classe.section.nom}</td><td><strong>{i.classe.nom}</strong></td><td>{i.typeAdmission}</td><td><span className={styles.badge}>{i.statut}</span></td></tr>)}</tbody></table></div></section>
        <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>Journal du dossier</h2><p>Traçabilité des opérations importantes.</p></div></div><div className={styles.panneauCorps}><div className={elevesStyles.timeline}>{eleve.historiques.map(h=><article key={h.id}><span><Clock3 size={15}/></span><div><strong>{h.type}</strong><small>{h.createdAt.toLocaleString("fr-FR")} · {h.auteur || "Système"}</small><p>{h.details}</p></div></article>)}{!eleve.historiques.length&&<p className={elevesStyles.texteVide}>Aucun événement enregistré.</p>}</div></div></section>
        <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>Observations</h2><p>Notes internes sur le suivi académique.</p></div></div><div className={styles.panneauCorps}><form action={ajouterObservation} className={elevesStyles.formObservation}><input type="hidden" name="eleveId" value={eleve.id}/><textarea name="contenu" required placeholder="Ajouter une observation pédagogique, administrative ou disciplinaire…"/><button className={styles.boutonPrimaire}>Ajouter</button></form><div className={elevesStyles.observations}>{eleve.observations.map(o=><article key={o.id}><strong>{o.auteur || "Administration"}</strong><small>{o.createdAt.toLocaleString("fr-FR")}</small><p>{o.contenu}</p></article>)}{!eleve.observations.length && <p className={elevesStyles.texteVide}>Aucune observation enregistrée.</p>}</div></div></section>
      </div>
      <div>
        <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>{t.responsables}</h2><p>Contacts de référence enregistrés dans le dossier.</p></div></div><div className={styles.panneauCorps}><div className={elevesStyles.listeResponsables}>{eleve.responsables.map(r=><article key={r.id}><div><UsersRound/><span><strong>{r.nom}</strong><small>{r.type}{r.principal ? " · principal" : ""}</small></span></div>{r.telephone && <p><Phone size={15}/>{r.telephone}</p>}{r.email && <p><Mail size={15}/>{r.email}</p>}{r.profession && <p>{r.profession}</p>}</article>)}{!eleve.responsables.length && <p className={elevesStyles.texteVide}>Aucun responsable renseigné.</p>}</div></div></section>
        <section className={styles.panneau}><div className={styles.panneauEntete}><div><h2>Informations médicales</h2><p>À utiliser avec confidentialité.</p></div></div><div className={styles.panneauCorps}><dl className={elevesStyles.medical}><dt>Allergies</dt><dd>{eleve.allergies || "Aucune information"}</dd><dt>Besoin particulier</dt><dd>{eleve.handicap || "Aucune information"}</dd><dt>Urgence</dt><dd>{eleve.contactUrgence || "—"} {eleve.telephoneUrgence ? `· ${eleve.telephoneUrgence}` : ""}</dd></dl></div></section>
      </div>
    </div>
  </AdminShell>;
}
