import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { convertirDemandeEnAbonnement } from "./actions";
import styles from "./conversion.module.css";

type Demande = {
  id: number;
  reference_demande: string;
  type_demande: string;
  nom_etablissement: string;
  type_etablissement: string | null;
  effectif: number | null;
  nom_responsable: string;
  telephone: string;
  email: string | null;
  message: string | null;
  statut: string;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await obtenirUtilisateurConnecte();

  if (!u) redirect("/connexion");
  if (!u.superAdministrateur) redirect("/dashboard");

  const { id } = await params;
  const demandeId = Number(id);

  if (!Number.isInteger(demandeId) || demandeId <= 0) {
    redirect("/dashboard/demandes");
  }

  const demandes = await prisma.$queryRaw<Demande[]>`
    SELECT
      id,
      reference_demande,
      type_demande,
      nom_etablissement,
      type_etablissement,
      effectif,
      nom_responsable,
      telephone,
      email,
      message,
      statut
    FROM demandes_vitrine
    WHERE id = ${demandeId}
    LIMIT 1
  `;

  const demande = demandes[0];

  if (!demande) redirect("/dashboard/demandes");

  if (!["INSCRIPTION", "TARIFICATION"].includes(demande.type_demande)) {
    redirect("/dashboard/demandes");
  }

  const aujourdHui = new Date();
  const expiration = new Date(aujourdHui);
  expiration.setFullYear(expiration.getFullYear() + 1);

  return (
    <AdminShell
      utilisateur={u}
      titre="Conversion en abonnement"
      description="Validation commerciale avant création de l'abonnement SaaS."
    >
      <div className={styles.page}>
        <div className={styles.actionsHaut}>
          <Link href="/dashboard/demandes">
            ← Retour aux demandes
          </Link>
        </div>

        <section className={styles.resume}>
          <span className={styles.reference}>
            {demande.reference_demande}
          </span>

          <h2>{demande.nom_etablissement}</h2>

          <div className={styles.grille}>
            <div>
              <small>Type de demande</small>
              <strong>{demande.type_demande}</strong>
            </div>

            <div>
              <small>Type d'établissement</small>
              <strong>
                {demande.type_etablissement || "Non précisé"}
              </strong>
            </div>

            <div>
              <small>Effectif déclaré</small>
              <strong>
                {demande.effectif
                  ? demande.effectif.toLocaleString("fr-FR")
                  : "Non renseigné"}
              </strong>
            </div>

            <div>
              <small>Responsable</small>
              <strong>{demande.nom_responsable}</strong>
            </div>

            <div>
              <small>Téléphone</small>
              <strong>{demande.telephone}</strong>
            </div>

            <div>
              <small>E-mail</small>
              <strong>{demande.email || "—"}</strong>
            </div>
          </div>

          {demande.message && (
            <blockquote>{demande.message}</blockquote>
          )}
        </section>

        <form
          action={convertirDemandeEnAbonnement}
          className={styles.form}
        >
          <input
            type="hidden"
            name="demande_id"
            value={demande.id}
          />

          <div className={styles.titreBloc}>
            <div>
              <small>VALIDATION DIGIGROUPE</small>
              <h2>Créer l'abonnement</h2>
              <p>
                Le système ne calcule pas le tarif automatiquement.
                Saisissez ici le montant validé selon l'effectif et
                votre politique commerciale.
              </p>
            </div>
          </div>

          <div className={styles.champs}>
            <label>
              Formule
              <input
                name="formule"
                defaultValue="Professional"
                required
              />
            </label>

            <label>
              Montant validé
              <input
                name="montant"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Ex. 500"
              />
            </label>

            <label>
              Devise
              <select name="devise" defaultValue="USD">
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </label>

            <label>
              Périodicité
              <select name="periodicite" defaultValue="ANNUEL">
                <option value="MENSUEL">Mensuel</option>
                <option value="TRIMESTRIEL">Trimestriel</option>
                <option value="SEMESTRIEL">Semestriel</option>
                <option value="ANNUEL">Annuel</option>
                <option value="PERSONNALISE">Personnalisé</option>
              </select>
            </label>

            <label>
              Date d'expiration
              <input
                name="date_expiration"
                type="date"
                defaultValue={expiration.toISOString().slice(0, 10)}
              />
            </label>

            <label>
              Effectif servant à la décision
              <input
                value={demande.effectif ?? ""}
                readOnly
                placeholder="Non renseigné"
              />
            </label>
          </div>

          <div className={styles.note}>
            <strong>Après confirmation :</strong>
            <span>
              organisation cliente → établissement → abonnement
              EN_ATTENTE → paiement depuis la vitrine.
            </span>
          </div>

          <button type="submit" className={styles.bouton}>
            Confirmer la conversion en abonnement
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
