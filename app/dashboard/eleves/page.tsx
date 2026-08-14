import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive, CreditCard, Download, Eye, Pencil, UserPlus,
  UserRound, UsersRound, Sparkles
} from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/admin.module.css";
import elevesStyles from "@/components/eleves/eleves.module.css";
import FiltresEleves from "@/components/eleves/FiltresEleves";
import { changerStatutEleve } from "./actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const texte = (valeur: string | string[] | undefined, defaut = "") => typeof valeur === "string" ? valeur : defaut;

function estSectionUniversitaire(nomSection?: string | null) {
  const nom = (nomSection || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  return (
    nom.includes("UNIVERSITE") ||
    nom.includes("UNIVERSITAIRE") ||
    nom.includes("INSTITUT SUPERIEUR") ||
    nom.includes("SUPERIEUR")
  );
}

function libellePersonne(nomSection?: string | null) {
  return estSectionUniversitaire(nomSection) ? "Étudiant" : "Élève";
}

export default async function ListeEleves({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const p = await searchParams;
  const recherche = texte(p.q).trim();
  const classeId = Number(texte(p.classe)) || 0;
  const sectionId = Number(texte(p.section)) || 0;
  const sexe = texte(p.sexe);
  const statut = texte(p.statut, "actif");
  const tri = texte(p.tri, "nom-asc");
  const page = Math.max(1, Number(texte(p.page, "1")) || 1);
  const choixParPage = Number(texte(p.parPage, "20"));
  const parPage = [10, 20, 50, 100].includes(choixParPage) ? choixParPage : 20;

  const where: any = {
    ecoleId: ecole.id,
    ...(statut ? { statut } : {}),
    ...(sexe ? { sexe } : {}),
    ...(recherche ? {
      OR: [
        { matricule: { contains: recherche } },
        { nom: { contains: recherche } },
        { prenom: { contains: recherche } },
        { postnom: { contains: recherche } },
        { responsables: { some: { OR: [{ nom: { contains: recherche } }, { telephone: { contains: recherche } }] } } }
      ]
    } : {}),
    ...((classeId || sectionId) ? {
      inscriptions: {
        some: {
          ...(classeId ? { classeId } : {}),
          ...(sectionId ? { classe: { sectionId } } : {})
        }
      }
    } : {})
  };

  const orderBy: any = tri === "nom-desc" ? [{ nom: "desc" }, { prenom: "desc" }]
    : tri === "recent" ? { createdAt: "desc" }
    : tri === "ancien" ? { createdAt: "asc" }
    : tri === "matricule" ? { matricule: "asc" }
    : [{ nom: "asc" }, { prenom: "asc" }];

  const debutMois = new Date();
  debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);

  const [sections, classes, eleves, filtreTotal, total, garcons, filles, nouveaux, archives] = await Promise.all([
    prisma.section.findMany({ where: { ecoleId: ecole.id, statut: "active" }, orderBy: { nom: "asc" } }),
    prisma.classe.findMany({ where: { ecoleId: ecole.id, statut: "active" }, include: { section: true }, orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }] }),
    prisma.eleve.findMany({
      where,
      include: {
        inscriptions: { include: { classe: { include: { section: true } }, anneeScolaire: true }, orderBy: { createdAt: "desc" }, take: 1 },
        responsables: { where: { principal: true }, take: 1 }
      },
      orderBy,
      skip: (page - 1) * parPage,
      take: parPage
    }),
    prisma.eleve.count({ where }),
    prisma.eleve.count({ where: { ecoleId: ecole.id, statut: "actif" } }),
    prisma.eleve.count({ where: { ecoleId: ecole.id, statut: "actif", sexe: "M" } }),
    prisma.eleve.count({ where: { ecoleId: ecole.id, statut: "actif", sexe: "F" } }),
    prisma.eleve.count({ where: { ecoleId: ecole.id, createdAt: { gte: debutMois } } }),
    prisma.eleve.count({ where: { ecoleId: ecole.id, statut: "archive" } })
  ]);

  const pages = Math.max(1, Math.ceil(filtreTotal / parPage));
  const pageCourante = Math.min(page, pages);
  const debut = filtreTotal ? (pageCourante - 1) * parPage + 1 : 0;
  const fin = Math.min(pageCourante * parPage, filtreTotal);

  const urlAvec = (numeroPage: number) => {
    const params = new URLSearchParams();
    if (recherche) params.set("q", recherche);
    if (classeId) params.set("classe", String(classeId));
    if (sectionId) params.set("section", String(sectionId));
    if (sexe) params.set("sexe", sexe);
    if (statut) params.set("statut", statut);
    if (tri !== "nom-asc") params.set("tri", tri);
    if (parPage !== 20) params.set("parPage", String(parPage));
    params.set("page", String(numeroPage));
    return `?${params.toString()}`;
  };

  const exportParams = new URLSearchParams();
  if (recherche) exportParams.set("q", recherche);
  if (classeId) exportParams.set("classe", String(classeId));
  if (sectionId) exportParams.set("section", String(sectionId));
  if (sexe) exportParams.set("sexe", sexe);
  if (statut) exportParams.set("statut", statut);

  const numeros = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - pageCourante) <= 2);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Gestion des élèves / étudiants"
      description="Répertoire centralisé des élèves et étudiants, inscriptions, identification et suivi des dossiers."
      action={<div className={elevesStyles.headerActions}>
        <a href={`/dashboard/eleves/export?${exportParams}`} className={styles.boutonSecondaire}><Download size={18} /> Export Excel</a>
        <Link href="/dashboard/eleves/nouveau" className={styles.boutonPrimaire}><UserPlus size={18} /> Nouvelle inscription</Link>
      </div>}
    >
      <div className={elevesStyles.statsElevesPremium}>
        <article><span><UsersRound /></span><div><small>Élèves / étudiants actifs</small><strong>{total}</strong></div></article>
        <article><span><UserRound /></span><div><small>Masculin</small><strong>{garcons}</strong></div></article>
        <article><span><UserRound /></span><div><small>Féminin</small><strong>{filles}</strong></div></article>
        <article><span><Sparkles /></span><div><small>Nouveaux ce mois</small><strong>{nouveaux}</strong></div></article>
        <article><span><Archive /></span><div><small>Archivés</small><strong>{archives}</strong></div></article>
      </div>

      <section className={`${styles.panneau} ${elevesStyles.panneauListeEleves}`}>
        <div className={styles.panneauEntete}>
          <div><h2>Répertoire des élèves / étudiants</h2><p>{filtreTotal} résultat(s) · affichage de {debut} à {fin}</p></div>
          <span className={elevesStyles.indicateurListe}>{pageCourante} / {pages}</span>
        </div>

        <div className={styles.panneauCorps}>
          <FiltresEleves
            classes={classes.map(c => ({ id: c.id, nom: `${c.nom} — ${c.section.nom}`, sectionId: c.sectionId }))}
            sections={sections.map(s => ({ id: s.id, nom: s.nom }))}
            valeurs={{ q: recherche, classe: classeId ? String(classeId) : "", section: sectionId ? String(sectionId) : "", sexe, statut, tri, parPage: String(parPage) }}
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${elevesStyles.tableElevesPremium}`}>
            <thead><tr><th>Élève / Étudiant</th><th>Matricule</th><th>Classe / promotion & section</th><th>Responsable</th><th>Téléphone</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {eleves.map(e => {
                const inscription = e.inscriptions[0];
                const responsable = e.responsables[0];
                const sectionNom = inscription?.classe?.section?.nom || "";
                const typePersonne = libellePersonne(sectionNom);
                return <tr key={e.id}>
                  <td><div className={elevesStyles.identiteEleve}>
                    <span>{e.photo ? <img src={e.photo} alt={`Photo de ${e.prenom}`} /> : `${e.prenom[0] || ""}${e.nom[0] || ""}`}</span>
                    <div>
                      <strong>{e.nom} {e.postnom || ""}</strong>
                      <small>
                        {e.prenom} · {typePersonne} · {e.sexe === "M" ? "Masculin" : "Féminin"}
                      </small>
                    </div>
                  </div></td>
                  <td><strong className={elevesStyles.matriculeEleve}>{e.matricule}</strong></td>
                  <td>{inscription ? <><strong>{inscription.classe.nom}</strong><small className={elevesStyles.sousTexte}>{inscription.classe.section.nom} · {inscription.anneeScolaire.libelle}</small></> : <span className={elevesStyles.nonInscrit}>Non inscrit(e)</span>}</td>
                  <td>{responsable ? <><strong>{responsable.nom}</strong><small className={elevesStyles.sousTexte}>{responsable.type}{responsable.principal ? " · Principal" : ""}</small></> : "—"}</td>
                  <td>{responsable?.telephone || e.telephoneUrgence || "—"}</td>
                  <td><span className={`${styles.badge} ${e.statut !== "actif" ? styles.badgeInactif : ""}`}>{e.statut}</span></td>
                  <td><div className={`${styles.actionsTable} ${elevesStyles.actionsEleve}`}>
                    <Link href={`/dashboard/eleves/${e.id}`} title="Voir le profil"><Eye size={17} /></Link>
                    <Link href={`/dashboard/eleves/${e.id}/modifier`} title="Modifier"><Pencil size={17} /></Link>
                    <Link href={`/dashboard/eleves/${e.id}/carte`} title="Carte d’identification"><CreditCard size={17} /></Link>
                    <form action={changerStatutEleve}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="statut" value={e.statut} />
                      <button title={e.statut === "actif" ? "Archiver" : "Réactiver"}><Archive size={17} /></button>
                    </form>
                  </div></td>
                </tr>;
              })}
              {!eleves.length && <tr><td colSpan={7}><div className={styles.vide}><UsersRound size={38} /><p>Aucun élève / étudiant ne correspond aux critères sélectionnés.</p><Link href="/dashboard/eleves/nouveau" className={styles.boutonPrimaire}><UserPlus size={17} /> Nouvelle inscription</Link></div></td></tr>}
            </tbody>
          </table>
        </div>

        {pages > 1 && <div className={elevesStyles.paginationPremium}>
          <Link aria-disabled={pageCourante <= 1} href={urlAvec(Math.max(1, pageCourante - 1))}>← Précédent</Link>
          <div>{numeros.map((numero, index) => <span key={numero} className={elevesStyles.numeroAvecSeparateur}>
            {index > 0 && numero - numeros[index - 1] > 1 && <em>…</em>}
            <Link className={numero === pageCourante ? elevesStyles.pageActive : ""} href={urlAvec(numero)}>{numero}</Link>
          </span>)}</div>
          <Link aria-disabled={pageCourante >= pages} href={urlAvec(Math.min(pages, pageCourante + 1))}>Suivant →</Link>
        </div>}
      </section>
    </AdminShell>
  );
}
