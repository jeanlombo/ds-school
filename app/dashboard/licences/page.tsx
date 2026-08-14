import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  Filter,
  KeyRound,
  Save,
  School,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

import AdminShell from "@/components/admin/AdminShell";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  obtenirOuInitialiserLicence,
  obtenirUtilisationAbonnement,
} from "@/lib/licence";
import {
  enregistrerLicence,
  enregistrerPaiementLicence,
} from "./actions";
import styles from "./licences-admin.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type Params = {
  succes?: string;
  erreur?: string;
  recherche?: string;
  statut?: string;
  formule?: string;
  alerte?: string;
  page?: string;
};

type HistoriqueLicence = {
  id: bigint | number;
  licence_id: bigint | number;
  action: string;
  ancienne_valeur: string | null;
  nouvelle_valeur: string | null;
  motif: string | null;
  created_at: Date;
};

function dateInput(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toISOString().slice(0, 10);
}

/**
 * Accepte volontairement unknown afin d'éviter les erreurs TypeScript
 * lorsqu'une valeur provenant de Prisma est null, undefined, number, etc.
 */
function normaliser(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function estAvertissementQuota(usage: any): boolean {
  return Boolean(
    usage?.eleves?.avertissement ||
      usage?.enseignants?.avertissement ||
      usage?.utilisateurs?.avertissement
  );
}

export default async function LicencesPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  if (utilisateur.superAdministrateur !== true) {
    redirect("/acces-refuse?permission=SUPER_ADMIN_LICENCES");
  }

  const q: Params = searchParams ? await searchParams : {};

  const ecoles = await prisma.ecole.findMany({
    orderBy: {
      nom: "asc",
    },
    select: {
      id: true,
      nom: true,
      code: true,
    },
  });

  const donnees = await Promise.all(
    ecoles.map(async (ecole) => {
      const licence = await obtenirOuInitialiserLicence(ecole.id);
      const usage = await obtenirUtilisationAbonnement(ecole.id);

      return {
        ecole,
        licence,
        usage,
      };
    })
  );

  const recherche = normaliser(q.recherche);
  const statut = normaliser(q.statut);
  const formule = normaliser(q.formule);
  const alerte = normaliser(q.alerte);

  const formules = Array.from(
    new Set(
      donnees
        .map((item) =>
          String(item.licence.formule ?? "Standard").trim()
        )
        .filter((valeur): valeur is string => Boolean(valeur))
    )
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const filtres = donnees.filter((item) => {
    const texteRecherche = [
      item.ecole.nom,
      item.ecole.code,
      item.licence.codeLicence,
      item.licence.formule,
      item.licence.planStandard,
    ]
      .map((valeur) => normaliser(valeur))
      .join(" ");

    const okRecherche =
      !recherche || texteRecherche.includes(recherche);

    const okStatut =
      !statut || normaliser(item.licence.statut) === statut;

    const okFormule =
      !formule || normaliser(item.licence.formule) === formule;

    const warning = estAvertissementQuota(item.usage);

    const okAlerte =
      !alerte || (alerte === "quota" && warning);

    return (
      okRecherche &&
      okStatut &&
      okFormule &&
      okAlerte
    );
  });

  const pageDemandee = Math.max(
    1,
    Number.parseInt(q.page ?? "1", 10) || 1
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtres.length / PAGE_SIZE)
  );

  const page = Math.min(pageDemandee, totalPages);

  const visibles = filtres.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const paramsBase = new URLSearchParams();

  if (q.recherche) {
    paramsBase.set("recherche", q.recherche);
  }

  if (q.statut) {
    paramsBase.set("statut", q.statut);
  }

  if (q.formule) {
    paramsBase.set("formule", q.formule);
  }

  if (q.alerte) {
    paramsBase.set("alerte", q.alerte);
  }

  const lienPage = (numeroPage: number): string => {
    const params = new URLSearchParams(paramsBase);
    params.set("page", String(numeroPage));

    return `/dashboard/licences?${params.toString()}`;
  };

  const historiques = await prisma.$queryRaw<
    HistoriqueLicence[]
  >`
    SELECT
      id,
      licence_id,
      action,
      ancienne_valeur,
      nouvelle_valeur,
      motif,
      created_at
    FROM licence_historique
    ORDER BY id DESC
    LIMIT 30
  `;

  const licencesActives = donnees.filter(
    (item) =>
      normaliser(item.licence.statut) === "actif"
  ).length;

  const quotasAlerte = donnees.filter((item) =>
    estAvertissementQuota(item.usage)
  ).length;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Gestion des licences"
      description="Administration DIGIGROUPE : quotas, échéances, paiements et renouvellements."
    >
      {q.succes && (
        <div className={styles.succes}>
          {q.succes}
        </div>
      )}

      {q.erreur && (
        <div className={styles.erreur}>
          Une information est invalide : {q.erreur}
        </div>
      )}

      <div className={styles.resume}>
        <article>
          <School />
          <div>
            <small>Écoles</small>
            <strong>{donnees.length}</strong>
          </div>
        </article>

        <article>
          <ShieldCheck />
          <div>
            <small>Licences actives</small>
            <strong>{licencesActives}</strong>
          </div>
        </article>

        <article>
          <KeyRound />
          <div>
            <small>Quotas ≥ 90%</small>
            <strong>{quotasAlerte}</strong>
          </div>
        </article>
      </div>

      <section className={styles.filtresBox}>
        <div className={styles.filtresTitre}>
          <div>
            <SlidersHorizontal size={19} />

            <div>
              <strong>Rechercher une école</strong>
              <small>
                Retrouvez rapidement une licence sans parcourir
                toute la page.
              </small>
            </div>
          </div>

          <span>
            {filtres.length} résultat
            {filtres.length > 1 ? "s" : ""}
          </span>
        </div>

        <form
          method="get"
          className={styles.filtresForm}
        >
          <label className={styles.recherche}>
            <Search size={17} />

            <input
              name="recherche"
              defaultValue={q.recherche ?? ""}
              placeholder="Nom de l'école, code école ou code licence..."
            />
          </label>

          <label>
            <Filter size={15} />

            <select
              name="statut"
              defaultValue={q.statut ?? ""}
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actives</option>
              <option value="en_attente">
                En attente
              </option>
              <option value="suspendu">
                Suspendues
              </option>
              <option value="expire">Expirées</option>
            </select>
          </label>

          <label>
            <select
              name="formule"
              defaultValue={q.formule ?? ""}
            >
              <option value="">
                Toutes les formules
              </option>

              {formules.map((nomFormule) => (
                <option
                  value={nomFormule}
                  key={nomFormule}
                >
                  {nomFormule}
                </option>
              ))}
            </select>
          </label>

          <label>
            <select
              name="alerte"
              defaultValue={q.alerte ?? ""}
            >
              <option value="">
                Tous les quotas
              </option>
              <option value="quota">
                Quota ≥ 90%
              </option>
            </select>
          </label>

          <button
            type="submit"
            className={styles.btnFiltrer}
          >
            <Search size={16} />
            Rechercher
          </button>

          {(q.recherche ||
            q.statut ||
            q.formule ||
            q.alerte) && (
            <Link
              className={styles.reset}
              href="/dashboard/licences"
            >
              <X size={15} />
              Réinitialiser
            </Link>
          )}
        </form>
      </section>

      {visibles.length === 0 && (
        <div className={styles.vide}>
          <Search size={30} />

          <h3>Aucune école trouvée</h3>

          <p>
            Modifiez la recherche ou réinitialisez les filtres.
          </p>

          <Link href="/dashboard/licences">
            Afficher toutes les licences
          </Link>
        </div>
      )}

      {visibles.map(
        ({ ecole, licence, usage }) => (
          <details
            className={styles.carte}
            key={ecole.id}
          >
            <summary className={styles.entete}>
              <div className={styles.identite}>
                <span>{ecole.code}</span>

                <h2>{ecole.nom}</h2>

                <p>
                  Licence : {licence.codeLicence}
                </p>
              </div>

              <div className={styles.resumeLicence}>
                <span>
                  Apprenants{" "}
                  <b>
                    {usage.eleves.utilise}/
                    {usage.eleves.illimite
                      ? "∞"
                      : usage.eleves.maximum}
                  </b>
                </span>

                <span>
                  Utilisateurs{" "}
                  <b>
                    {usage.utilisateurs.utilise}/
                    {usage.utilisateurs.illimite
                      ? "∞"
                      : usage.utilisateurs.maximum}
                  </b>
                </span>

                <span>
                  Expiration{" "}
                  <b>
                    {licence.dateExpiration
                      ? new Date(
                          licence.dateExpiration
                        ).toLocaleDateString("fr-FR")
                      : "—"}
                  </b>
                </span>
              </div>

              <div className={styles.enteteDroite}>
                <b
                  className={styles.statut}
                  data-statut={licence.statut}
                >
                  {licence.statut}
                </b>

                <span className={styles.ouvrir}>
                  Voir / modifier
                  <ChevronDown size={16} />
                </span>
              </div>
            </summary>

            <div className={styles.contenuCarte}>
              <div className={styles.usage}>
                <span>
                  Apprenants{" "}
                  <b>
                    {usage.eleves.utilise}/
                    {usage.eleves.illimite
                      ? "∞"
                      : usage.eleves.maximum}
                  </b>
                </span>

                <span>
                  Enseignants{" "}
                  <b>
                    {usage.enseignants.utilise}/
                    {usage.enseignants.illimite
                      ? "∞"
                      : usage.enseignants.maximum}
                  </b>
                </span>

                <span>
                  Utilisateurs{" "}
                  <b>
                    {usage.utilisateurs.utilise}/
                    {usage.utilisateurs.illimite
                      ? "∞"
                      : usage.utilisateurs.maximum}
                  </b>
                </span>

                <span>
                  Stockage{" "}
                  <b>
                    {usage.stockage.utiliseGo}/
                    {usage.stockage.illimite
                      ? "∞"
                      : usage.stockage.maximumGo}{" "}
                    Go
                  </b>
                </span>
              </div>

              <form
                action={enregistrerLicence}
                className={styles.form}
              >
                <input
                  type="hidden"
                  name="ecoleId"
                  value={ecole.id}
                />

                <label>
                  Formule
                  <input
                    name="formule"
                    defaultValue={
                      licence.formule ?? "Standard"
                    }
                  />
                </label>

                <label>
                  Plan d'origine
                  <input
                    name="planStandard"
                    defaultValue={
                      licence.planStandard ?? "Standard"
                    }
                  />
                </label>

                <label>
                  Statut
                  <select
                    name="statut"
                    defaultValue={licence.statut}
                  >
                    <option value="actif">
                      Actif
                    </option>
                    <option value="en_attente">
                      En attente
                    </option>
                    <option value="suspendu">
                      Suspendu
                    </option>
                    <option value="expire">
                      Expiré
                    </option>
                  </select>
                </label>

                <label>
                  Date de début
                  <input
                    type="date"
                    name="dateDebut"
                    defaultValue={dateInput(
                      licence.dateDebut
                    )}
                  />
                </label>

                <label>
                  Date d'expiration
                  <input
                    type="date"
                    name="dateExpiration"
                    defaultValue={dateInput(
                      licence.dateExpiration
                    )}
                  />
                </label>

                <label>
                  Maximum apprenants
                  <input
                    type="number"
                    min="0"
                    name="maxEleves"
                    defaultValue={licence.maxEleves}
                  />
                </label>

                <label>
                  Maximum enseignants
                  <input
                    type="number"
                    min="0"
                    name="maxEnseignants"
                    defaultValue={
                      licence.maxEnseignants
                    }
                  />
                </label>

                <label>
                  Maximum utilisateurs
                  <input
                    type="number"
                    min="0"
                    name="maxUtilisateurs"
                    defaultValue={
                      licence.maxUtilisateurs
                    }
                  />
                </label>

                <label>
                  Maximum parents
                  <input
                    type="number"
                    min="0"
                    name="maxParents"
                    defaultValue={licence.maxParents}
                  />
                </label>

                <label>
                  Maximum classes
                  <input
                    type="number"
                    min="0"
                    name="maxClasses"
                    defaultValue={licence.maxClasses}
                  />
                </label>

                <label>
                  Maximum sections
                  <input
                    type="number"
                    min="0"
                    name="maxSections"
                    defaultValue={licence.maxSections}
                  />
                </label>

                <label>
                  Maximum salles
                  <input
                    type="number"
                    min="0"
                    name="maxSalles"
                    defaultValue={licence.maxSalles}
                  />
                </label>

                <label>
                  Stockage maximum (Go)
                  <input
                    type="number"
                    min="0"
                    name="stockageMaxGo"
                    defaultValue={
                      licence.stockageMaxGo
                    }
                  />
                </label>

                <label>
                  SMS maximum
                  <input
                    type="number"
                    min="0"
                    name="smsMax"
                    defaultValue={licence.smsMax}
                  />
                </label>

                <label>
                  E-mails maximum
                  <input
                    type="number"
                    min="0"
                    name="emailsMax"
                    defaultValue={licence.emailsMax}
                  />
                </label>

                <div className={styles.checks}>
                  <label>
                    <input
                      type="checkbox"
                      name="quotaPersonnalise"
                      defaultChecked={
                        licence.quotaPersonnalise
                      }
                    />
                    Quotas personnalisés
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="elevesIllimite"
                      defaultChecked={
                        licence.elevesIllimite
                      }
                    />
                    Apprenants illimités
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="enseignantsIllimite"
                      defaultChecked={
                        licence.enseignantsIllimite
                      }
                    />
                    Enseignants illimités
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="utilisateursIllimite"
                      defaultChecked={
                        licence.utilisateursIllimite
                      }
                    />
                    Utilisateurs illimités
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="stockageIllimite"
                      defaultChecked={
                        licence.stockageIllimite
                      }
                    />
                    Stockage illimité
                  </label>
                </div>

                <label className={styles.large}>
                  Observations
                  <textarea
                    name="observations"
                    defaultValue={
                      licence.observations ?? ""
                    }
                  />
                </label>

                <label className={styles.large}>
                  Motif de la modification
                  <input
                    name="motif"
                    placeholder="Ex. Négociation commerciale : 300 → 500 apprenants"
                  />
                </label>

                <button className={styles.btn}>
                  <Save size={17} />
                  Enregistrer la licence
                </button>
              </form>

              <form
                action={enregistrerPaiementLicence}
                className={styles.paiement}
              >
                <input
                  type="hidden"
                  name="ecoleId"
                  value={ecole.id}
                />

                <h3>
                  <CreditCard size={18} />
                  Enregistrer un paiement / renouvellement
                </h3>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="montant"
                  placeholder="Montant"
                  required
                />

                <select
                  name="devise"
                  defaultValue="USD"
                >
                  <option>USD</option>
                  <option>CDF</option>
                  <option>EUR</option>
                </select>

                <input
                  name="modePaiement"
                  placeholder="Mode de paiement"
                />

                <input
                  name="reference"
                  placeholder="Référence"
                />

                <input
                  type="date"
                  name="datePaiement"
                />

                <input
                  type="date"
                  name="nouvelleExpiration"
                  title="Nouvelle date d'expiration"
                />

                <button>
                  <CalendarDays size={16} />
                  Enregistrer
                </button>
              </form>
            </div>
          </details>
        )
      )}

      {totalPages > 1 && (
        <nav className={styles.pagination}>
          <span>
            Page {page} sur {totalPages}
          </span>

          <div>
            {page > 1 && (
              <Link href={lienPage(page - 1)}>
                ← Précédent
              </Link>
            )}

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            )
              .filter(
                (numero) =>
                  numero === 1 ||
                  numero === totalPages ||
                  Math.abs(numero - page) <= 1
              )
              .map((numero, index, tableau) => (
                <span key={numero}>
                  {index > 0 &&
                    numero -
                      tableau[index - 1] >
                      1 && <em>…</em>}

                  <Link
                    data-active={numero === page}
                    href={lienPage(numero)}
                  >
                    {numero}
                  </Link>
                </span>
              ))}

            {page < totalPages && (
              <Link href={lienPage(page + 1)}>
                Suivant →
              </Link>
            )}
          </div>
        </nav>
      )}

      <section className={styles.historique}>
        <h2>Historique récent</h2>

        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Licence</th>
                <th>Action</th>
                <th>Avant</th>
                <th>Après</th>
                <th>Motif</th>
              </tr>
            </thead>

            <tbody>
              {historiques.map(
                (historique) => (
                  <tr key={String(historique.id)}>
                    <td>
                      {new Date(
                        historique.created_at
                      ).toLocaleString("fr-FR")}
                    </td>

                    <td>
                      #
                      {String(
                        historique.licence_id
                      )}
                    </td>

                    <td>
                      {historique.action}
                    </td>

                    <td>
                      {historique.ancienne_valeur ||
                        "—"}
                    </td>

                    <td>
                      {historique.nouvelle_valeur ||
                        "—"}
                    </td>

                    <td>
                      {historique.motif || "—"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}