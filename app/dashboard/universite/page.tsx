import { redirect } from "next/navigation";
import { BookOpen, Building2, GraduationCap, Layers3, Network, School } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import styles from "@/components/admin/admin.module.css";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { creerCours, creerCycle, creerDepartement, creerFaculte, creerPromotion, creerSemestre, creerUE } from "./actions";

export const dynamic = "force-dynamic";

export default async function Universite() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  const ecole = await obtenirOuCreerEcole();

  const [facultes, departements, cycles, promotions, annees, semestres, unites, cours] = await Promise.all([
    prisma.faculteUniversitaire.findMany({ where: { ecoleId: ecole.id }, orderBy: { nom: "asc" } }),
    prisma.departementUniversitaire.findMany({ where: { ecoleId: ecole.id }, include: { faculte: true }, orderBy: { nom: "asc" } }),
    prisma.cycleUniversitaire.findMany({ where: { ecoleId: ecole.id }, orderBy: [{ ordre: "asc" }, { nom: "asc" }] }),
    prisma.promotionUniversitaire.findMany({ where: { ecoleId: ecole.id }, include: { departement: true, cycle: true }, orderBy: { nom: "asc" } }),
    prisma.anneeScolaire.findMany({ where: { ecoleId: ecole.id }, orderBy: { dateDebut: "desc" } }),
    prisma.semestreUniversitaire.findMany({ where: { ecoleId: ecole.id }, include: { promotion: true, anneeScolaire: true }, orderBy: [{ anneeScolaireId: "desc" }, { numero: "asc" }] }),
    prisma.uniteEnseignement.findMany({ where: { ecoleId: ecole.id }, include: { semestre: { include: { promotion: true } } }, orderBy: { code: "asc" } }),
    prisma.coursUniversitaire.findMany({ where: { ecoleId: ecole.id }, include: { unite: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Structure universitaire"
      description="Configurez Faculté → Département/Filière → Cycle → Promotion → Semestre → UE → Cours."
    >
      <section className={styles.deuxColonnes}>
        <article className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Établissement</h2><p>{ecole.nom}</p></div><Building2 size={22} /></div>
          <div className={styles.panneauCorps}>
            <p><strong>Mode :</strong> {ecole.typeEtablissement}</p>
            <p><strong>{facultes.length}</strong> faculté(s) · <strong>{departements.length}</strong> département(s) · <strong>{promotions.length}</strong> promotion(s)</p>
          </div>
        </article>
        <article className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Architecture LMD</h2><p>{semestres.length} semestre(s), {unites.length} UE, {cours.length} cours</p></div><GraduationCap size={22} /></div>
          <div className={styles.panneauCorps}><p>Cette structure coexiste avec le secondaire : aucun module Classes/Sections n’est supprimé.</p></div>
        </article>
      </section>

      <div className={styles.deuxColonnes}>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Faculté</h2><p>Ex. Faculté des Sciences</p></div><School size={22}/></div>
          <form action={creerFaculte} className={styles.panneauCorps}><div className={styles.formGrille}><div className={styles.champ}><label>Code *</label><input name="code" placeholder="SCI" required/></div><div className={styles.champ}><label>Nom *</label><input name="nom" placeholder="Faculté des Sciences" required/></div></div><div className={styles.actions}><BoutonSoumission texte="Ajouter la faculté"/></div></form>
        </section>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Département / Filière</h2><p>Rattaché à une faculté</p></div><Network size={22}/></div>
          <form action={creerDepartement} className={styles.panneauCorps}><div className={styles.formGrille}><div className={`${styles.champ} ${styles.champLarge}`}><label>Faculté *</label><select name="faculteId" required><option value="">Choisir</option>{facultes.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}</select></div><div className={styles.champ}><label>Code *</label><input name="code" placeholder="INFO" required/></div><div className={styles.champ}><label>Nom *</label><input name="nom" placeholder="Informatique" required/></div></div><div className={styles.actions}><BoutonSoumission texte="Ajouter le département"/></div></form>
        </section>
      </div>

      <div className={styles.deuxColonnes}>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Cycle</h2><p>Licence, Master, Doctorat...</p></div><Layers3 size={22}/></div>
          <form action={creerCycle} className={styles.panneauCorps}><div className={styles.formGrille}><div className={styles.champ}><label>Code *</label><input name="code" placeholder="L" required/></div><div className={styles.champ}><label>Nom *</label><input name="nom" placeholder="Licence" required/></div><div className={styles.champ}><label>Durée (années)</label><input name="dureeAnnees" type="number" min="1" defaultValue="3"/></div></div><div className={styles.actions}><BoutonSoumission texte="Ajouter le cycle"/></div></form>
        </section>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Promotion</h2><p>Ex. L1 Informatique</p></div><GraduationCap size={22}/></div>
          <form action={creerPromotion} className={styles.panneauCorps}><div className={styles.formGrille}><div className={styles.champ}><label>Département *</label><select name="departementId" required><option value="">Choisir</option>{departements.map(d=><option key={d.id} value={d.id}>{d.faculte.nom} — {d.nom}</option>)}</select></div><div className={styles.champ}><label>Cycle *</label><select name="cycleId" required><option value="">Choisir</option>{cycles.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></div><div className={styles.champ}><label>Code *</label><input name="code" placeholder="L1-INFO" required/></div><div className={styles.champ}><label>Nom *</label><input name="nom" placeholder="L1 Informatique" required/></div><div className={styles.champ}><label>Niveau</label><input name="niveau" type="number" min="1" defaultValue="1"/></div></div><div className={styles.actions}><BoutonSoumission texte="Ajouter la promotion"/></div></form>
        </section>
      </div>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div><h2>Semestres</h2><p>Associez une promotion à une année académique.</p></div><Layers3 size={22}/></div>
        <form action={creerSemestre} className={styles.panneauCorps}><div className={styles.formGrille}><div className={styles.champ}><label>Promotion *</label><select name="promotionId" required><option value="">Choisir</option>{promotions.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}</select></div><div className={styles.champ}><label>Année académique *</label><select name="anneeScolaireId" required><option value="">Choisir</option>{annees.map(a=><option key={a.id} value={a.id}>{a.libelle}</option>)}</select></div><div className={styles.champ}><label>N° semestre *</label><input name="numero" type="number" min="1" max="12" required/></div><div className={styles.champ}><label>Libellé</label><input name="libelle" placeholder="Semestre 1"/></div></div><div className={styles.actions}><BoutonSoumission texte="Créer le semestre"/></div></form>
      </section>

      <div className={styles.deuxColonnes}>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Unité d’enseignement</h2><p>UE et crédits</p></div><BookOpen size={22}/></div>
          <form action={creerUE} className={styles.panneauCorps}><div className={styles.formGrille}><div className={`${styles.champ} ${styles.champLarge}`}><label>Semestre *</label><select name="semestreId" required><option value="">Choisir</option>{semestres.map(s=><option key={s.id} value={s.id}>{s.promotion.nom} — {s.libelle} — {s.anneeScolaire.libelle}</option>)}</select></div><div className={styles.champ}><label>Code *</label><input name="code" placeholder="UE-INF-01" required/></div><div className={styles.champ}><label>Nom *</label><input name="nom" placeholder="Fondamentaux informatiques" required/></div><div className={styles.champ}><label>Crédits</label><input name="credits" type="number" min="0" defaultValue="0"/></div></div><div className={styles.actions}><BoutonSoumission texte="Ajouter l’UE"/></div></form>
        </section>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}><div><h2>Cours / EC</h2><p>Élément constitutif et crédits</p></div><BookOpen size={22}/></div>
          <form action={creerCours} className={styles.panneauCorps}><div className={styles.formGrille}><div className={`${styles.champ} ${styles.champLarge}`}><label>UE *</label><select name="uniteId" required><option value="">Choisir</option>{unites.map(u=><option key={u.id} value={u.id}>{u.code} — {u.nom}</option>)}</select></div><div className={styles.champ}><label>Code *</label><input name="code" placeholder="ALG101" required/></div><div className={styles.champ}><label>Nom *</label><input name="nom" placeholder="Algorithmique" required/></div><div className={styles.champ}><label>Crédits</label><input name="credits" type="number" min="0" defaultValue="0"/></div><div className={styles.champ}><label>Volume horaire</label><input name="volumeHoraire" type="number" min="0"/></div></div><div className={styles.actions}><BoutonSoumission texte="Ajouter le cours"/></div></form>
        </section>
      </div>

      <section className={styles.panneau}>
        <div className={styles.panneauEntete}><div><h2>Structure enregistrée</h2><p>Vue de contrôle rapide</p></div><GraduationCap size={22}/></div>
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Promotion</th><th>Département</th><th>Cycle</th><th>Niveau</th></tr></thead><tbody>{promotions.length ? promotions.map(p=><tr key={p.id}><td><strong>{p.nom}</strong><br/><small>{p.code}</small></td><td>{p.departement.nom}</td><td>{p.cycle.nom}</td><td>{p.niveau}</td></tr>) : <tr><td colSpan={4}>Aucune promotion universitaire créée.</td></tr>}</tbody></table></div>
      </section>
    </AdminShell>
  );
}
