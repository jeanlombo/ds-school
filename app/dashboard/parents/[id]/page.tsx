import { notFound, redirect } from "next/navigation";
import {
  KeyRound,
  Link2,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import {
  lierEleve,
  modifierParent,
  reinitialiserMotDePasse,
  retirerEleve,
} from "../actions";
import styles from "../parents.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    succes?: string;
    erreur?: string;
    identifiant?: string;
    motdepasse?: string;
  }>;
};

type Parent = {
  id: number;
  nom: string;
  postnom: string | null;
  prenom: string;
  sexe: string | null;
  date_naissance: Date | null;
  nationalite: string | null;
  profession: string | null;
  employeur: string | null;
  fonction: string | null;
  telephone_principal: string;
  telephone_secondaire: string | null;
  whatsapp: string | null;
  email: string | null;
  province: string | null;
  ville: string | null;
  commune: string | null;
  quartier: string | null;
  avenue: string | null;
  numero_adresse: string | null;
  piece_identite_type: string | null;
  piece_identite_numero: string | null;
  actif: number | boolean;
  identifiant: string | null;
  statut_compte: string | null;
  derniere_connexion: Date | null;
  derniere_ip: string | null;
};

type Enfant = {
  eleve_id: number;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  classe_nom: string | null;
  lien_parente: string;
  principal: number | boolean;
  responsable_legal: number | boolean;
  autorise_finances: number | boolean;
  autorise_academique: number | boolean;
  autorise_communication: number | boolean;
  total_paye: number;
};

type EleveDisponible = {
  id: number;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  classe_nom: string | null;
};

type Journal = {
  action: string;
  description: string | null;
  utilisateur_nom: string | null;
  niveau: string;
  created_at: Date;
};

export default async function DetailParent({ params, searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const query = await searchParams;
  const parentId = Number(id);

  const parents = await prisma.$queryRaw<Parent[]>`
    SELECT
      p.*,
      cp.identifiant,
      cp.statut AS statut_compte,
      cp.derniere_connexion,
      cp.derniere_ip
    FROM parents p
    LEFT JOIN comptes_parents cp
      ON cp.parent_id = p.id
      AND cp.ecole_id = p.ecole_id
    WHERE p.id = ${parentId}
      AND p.ecole_id = ${ecole.id}
    LIMIT 1
  `;

  const parent = parents[0];
  if (!parent) notFound();

  const [enfants, elevesDisponibles, journal] = await Promise.all([
    prisma.$queryRaw<Enfant[]>`
      SELECT
        e.id AS eleve_id,
        e.matricule,
        e.nom,
        e.postnom,
        e.prenom,
        c.nom AS classe_nom,
        pe.lien_parente,
        pe.principal,
        pe.responsable_legal,
        pe.autorise_finances,
        pe.autorise_academique,
        pe.autorise_communication,
        COALESCE(SUM(
          CASE WHEN p.statut = 'VALIDE' THEN p.montant_total ELSE 0 END
        ), 0) AS total_paye
      FROM parents_eleves pe
      INNER JOIN eleves e ON e.id = pe.eleve_id
      LEFT JOIN inscriptions i
        ON i.eleve_id = e.id
      LEFT JOIN classes c
        ON c.id = i.classe_id
      LEFT JOIN paiements_scolaires p
        ON p.inscription_id = i.id
      WHERE pe.parent_id = ${parentId}
        AND pe.ecole_id = ${ecole.id}
      GROUP BY
        e.id, e.matricule, e.nom, e.postnom, e.prenom,
        c.nom, pe.lien_parente, pe.principal,
        pe.responsable_legal, pe.autorise_finances,
        pe.autorise_academique, pe.autorise_communication
      ORDER BY pe.principal DESC, e.nom ASC
    `,
    prisma.$queryRaw<EleveDisponible[]>`
      SELECT
        e.id,
        e.matricule,
        e.nom,
        e.postnom,
        e.prenom,
        c.nom AS classe_nom
      FROM eleves e
      LEFT JOIN inscriptions i
        ON i.eleve_id = e.id
        AND i.statut IN ('inscrit', 'promu', 'redouble')
      LEFT JOIN classes c ON c.id = i.classe_id
      WHERE e.ecole_id = ${ecole.id}
        AND NOT EXISTS (
          SELECT 1
          FROM parents_eleves pe
          WHERE pe.parent_id = ${parentId}
            AND pe.eleve_id = e.id
        )
      ORDER BY e.nom ASC, e.prenom ASC
      LIMIT 500
    `,
    prisma.$queryRaw<Journal[]>`
      SELECT action, description, utilisateur_nom, niveau, created_at
      FROM journal_parents
      WHERE parent_id = ${parentId}
        AND ecole_id = ${ecole.id}
      ORDER BY created_at DESC
      LIMIT 100
    `,
  ]);

  const actionModification = modifierParent.bind(null, parentId);
  const actionLiaison = lierEleve.bind(null, parentId);
  const actionMotDePasse = reinitialiserMotDePasse.bind(null, parentId);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre={`${parent.nom} ${parent.postnom ?? ""} ${parent.prenom}`}
      description="Fiche parent, compte d’accès, enfants liés et historique."
    >
      <RetourDashboard />

      {query.succes && (
        <div className={styles.succes}>
          {query.succes === "creation" &&
            `Compte créé. Identifiant : ${query.identifiant ?? "—"} · Mot de passe temporaire : ${query.motdepasse ?? "—"}`}
          {query.succes === "modification" && "Les informations ont été modifiées."}
          {query.succes === "liaison" && "L’apprenant a été lié au parent."}
          {query.succes === "motdepasse" &&
            `Mot de passe temporaire : ${query.motdepasse ?? "—"}`}
        </div>
      )}

      {query.erreur && (
        <div className={styles.erreur}>Veuillez vérifier les informations saisies.</div>
      )}

      <section className={styles.stats}>
        <article>
          <UserRound />
          <div><small>Enfants liés</small><strong>{enfants.length}</strong></div>
        </article>
        <article>
          <ShieldCheck />
          <div><small>Statut compte</small><strong>{parent.statut_compte ?? "INACTIF"}</strong></div>
        </article>
        <article>
          <KeyRound />
          <div><small>Identifiant</small><strong>{parent.identifiant ?? "—"}</strong></div>
        </article>
        <article>
          <Link2 />
          <div><small>Dernière connexion</small><strong>{parent.derniere_connexion ? new Date(parent.derniere_connexion).toLocaleDateString("fr-FR") : "Jamais"}</strong></div>
        </article>
      </section>

      <section className={styles.panel}>
        <h2>Informations du parent</h2>

        <form action={actionModification} className={styles.formulaire}>
          <div className={styles.grilleFormulaire}>
            <label><span>Nom *</span><input name="nom" required defaultValue={parent.nom} /></label>
            <label><span>Postnom</span><input name="postnom" defaultValue={parent.postnom ?? ""} /></label>
            <label><span>Prénom *</span><input name="prenom" required defaultValue={parent.prenom} /></label>
            <label>
              <span>Sexe</span>
              <select name="sexe" defaultValue={parent.sexe ?? ""}>
                <option value="">Non précisé</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </label>
            <label><span>Date de naissance</span><input type="date" name="date_naissance" defaultValue={parent.date_naissance ? new Date(parent.date_naissance).toISOString().slice(0, 10) : ""} /></label>
            <label><span>Nationalité</span><input name="nationalite" defaultValue={parent.nationalite ?? ""} /></label>
            <label><span>Profession</span><input name="profession" defaultValue={parent.profession ?? ""} /></label>
            <label><span>Employeur</span><input name="employeur" defaultValue={parent.employeur ?? ""} /></label>
            <label><span>Fonction</span><input name="fonction" defaultValue={parent.fonction ?? ""} /></label>
            <label><span>Téléphone principal *</span><input name="telephone_principal" required defaultValue={parent.telephone_principal} /></label>
            <label><span>Téléphone secondaire</span><input name="telephone_secondaire" defaultValue={parent.telephone_secondaire ?? ""} /></label>
            <label><span>WhatsApp</span><input name="whatsapp" defaultValue={parent.whatsapp ?? ""} /></label>
            <label><span>Email</span><input type="email" name="email" defaultValue={parent.email ?? ""} /></label>
            <label><span>Province</span><input name="province" defaultValue={parent.province ?? ""} /></label>
            <label><span>Ville</span><input name="ville" defaultValue={parent.ville ?? ""} /></label>
            <label><span>Commune</span><input name="commune" defaultValue={parent.commune ?? ""} /></label>
            <label><span>Quartier</span><input name="quartier" defaultValue={parent.quartier ?? ""} /></label>
            <label><span>Avenue</span><input name="avenue" defaultValue={parent.avenue ?? ""} /></label>
            <label><span>Numéro</span><input name="numero_adresse" defaultValue={parent.numero_adresse ?? ""} /></label>
            <label><span>Type de pièce</span><input name="piece_identite_type" defaultValue={parent.piece_identite_type ?? ""} /></label>
            <label><span>Numéro de pièce</span><input name="piece_identite_numero" defaultValue={parent.piece_identite_numero ?? ""} /></label>
          </div>

          <label className={styles.case}>
            <input type="checkbox" name="actif" defaultChecked={Boolean(parent.actif)} />
            <span>Compte actif</span>
          </label>

          <div className={styles.actionsFinales}>
            <button type="submit" className={styles.primaire}>Enregistrer les modifications</button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Enfants liés au parent</h2>

        <div className={styles.cartesEnfants}>
          {enfants.map((enfant) => (
            <article key={enfant.eleve_id}>
              <div>
                <strong>{enfant.nom} {enfant.postnom ?? ""} {enfant.prenom}</strong>
                <small>{enfant.matricule} · {enfant.classe_nom ?? "Classe non définie"}</small>
              </div>

              <div className={styles.badges}>
                <span>{enfant.lien_parente}</span>
                {Boolean(enfant.principal) && <span>PRINCIPAL</span>}
                {Boolean(enfant.responsable_legal) && <span>LÉGAL</span>}
              </div>

              <div className={styles.autorisations}>
                <small>Finances : {Boolean(enfant.autorise_finances) ? "Oui" : "Non"}</small>
                <small>Académique : {Boolean(enfant.autorise_academique) ? "Oui" : "Non"}</small>
                <small>Communication : {Boolean(enfant.autorise_communication) ? "Oui" : "Non"}</small>
                <small>Total payé : {Number(enfant.total_paye).toLocaleString("fr-FR")}</small>
              </div>

              <form action={retirerEleve.bind(null, parentId, enfant.eleve_id)}>
                <button type="submit" className={styles.danger}>
                  <Trash2 size={16} />
                  Retirer
                </button>
              </form>
            </article>
          ))}

          {!enfants.length && (
            <div className={styles.vide}>Aucun apprenant n’est encore lié à ce parent.</div>
          )}
        </div>

        <form action={actionLiaison} className={styles.liaison}>
          <label>
            <span>Apprenant *</span>
            <select name="eleve_id" required defaultValue="">
              <option value="" disabled>Sélectionner un apprenant</option>
              {elevesDisponibles.map((eleve) => (
                <option key={eleve.id} value={eleve.id}>
                  {eleve.matricule} — {eleve.nom} {eleve.postnom ?? ""} {eleve.prenom} · {eleve.classe_nom ?? "—"}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Lien de parenté</span>
            <select name="lien_parente" defaultValue="PERE">
              <option value="PERE">Père</option>
              <option value="MERE">Mère</option>
              <option value="TUTEUR">Tuteur</option>
              <option value="RESPONSABLE_LEGAL">Responsable légal</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>

          <label className={styles.case}><input type="checkbox" name="principal" /><span>Principal</span></label>
          <label className={styles.case}><input type="checkbox" name="responsable_legal" /><span>Responsable légal</span></label>
          <label className={styles.case}><input type="checkbox" name="autorise_finances" defaultChecked /><span>Accès finances</span></label>
          <label className={styles.case}><input type="checkbox" name="autorise_academique" defaultChecked /><span>Accès académique</span></label>
          <label className={styles.case}><input type="checkbox" name="autorise_communication" defaultChecked /><span>Communication</span></label>

          <button type="submit" className={styles.primaire}>Lier l’apprenant</button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Sécurité du compte parent</h2>

        <div className={styles.securite}>
          <div>
            <small>Identifiant</small>
            <strong>{parent.identifiant ?? "—"}</strong>
          </div>
          <div>
            <small>Dernière connexion</small>
            <strong>{parent.derniere_connexion ? new Date(parent.derniere_connexion).toLocaleString("fr-FR") : "Jamais"}</strong>
          </div>
          <div>
            <small>Dernière IP</small>
            <strong>{parent.derniere_ip ?? "—"}</strong>
          </div>
        </div>

        <form action={actionMotDePasse} className={styles.reinitialisation}>
          <label>
            <span>Nouveau mot de passe temporaire</span>
            <input name="nouveau_mot_de_passe" placeholder="Généré automatiquement si vide" />
          </label>
          <button type="submit" className={styles.secondaire}>Réinitialiser le mot de passe</button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Journal du compte parent</h2>

        <div className={styles.journal}>
          {journal.map((entree, index) => (
            <article key={index}>
              <span className={entree.niveau === "CRITIQUE" ? styles.niveauCritique : styles.niveauInfo}>
                {entree.niveau}
              </span>
              <div>
                <strong>{entree.action}</strong>
                <p>{entree.description ?? "—"}</p>
                <small>{entree.utilisateur_nom ?? "Système"} · {new Date(entree.created_at).toLocaleString("fr-FR")}</small>
              </div>
            </article>
          ))}

          {!journal.length && <div className={styles.vide}>Aucun événement enregistré.</div>}
        </div>
      </section>
    </AdminShell>
  );
}
