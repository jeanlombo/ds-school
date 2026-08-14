import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeDollarSign, CalendarDays, CircleDollarSign, Plus, Search, Settings2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import { basculerStatutFrais } from "./actions";
import styles from "./frais-scolaires.module.css";

export const dynamic = "force-dynamic";

type Frais = {
  id: number;
  code: string;
  libelle: string;
  famille: string;
  nature: string;
  categorie: string;
  periodicite: string;
  obligatoire: number | boolean;
  actif: number | boolean;
  penalite_active: number | boolean;
  nombre_tarifs: bigint | number;
  montant_min: number | null;
  montant_max: number | null;
};

type Props = {
  searchParams: Promise<{
    q?: string;
    famille?: string;
    nature?: string;
    statut?: string;
    succes?: string;
  }>;
};

function nombre(valeur: bigint | number): number {
  return typeof valeur === "bigint" ? Number(valeur) : Number(valeur ?? 0);
}

export default async function PageFraisScolaires({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const famille = String(params.famille ?? "").trim();
  const nature = String(params.nature ?? "").trim();
  const statut = String(params.statut ?? "").trim();

  const frais = await prisma.$queryRaw<Frais[]>`
    SELECT
      f.id,
      f.code,
      f.libelle,
      f.famille,
      f.nature,
      f.categorie,
      f.periodicite,
      f.obligatoire,
      f.actif,
      f.penalite_active,
      COUNT(t.id) AS nombre_tarifs,
      MIN(t.montant) AS montant_min,
      MAX(t.montant) AS montant_max
    FROM frais_scolaires f
    LEFT JOIN tarifs_frais_scolaires t
      ON t.frais_id = f.id
      AND t.ecole_id = f.ecole_id
    WHERE f.ecole_id = ${ecole.id}
      AND (${q} = '' OR f.code LIKE CONCAT('%', ${q}, '%') OR f.libelle LIKE CONCAT('%', ${q}, '%'))
      AND (${famille} = '' OR f.famille = ${famille})
      AND (${nature} = '' OR f.nature = ${nature})
      AND (
        ${statut} = ''
        OR (${statut} = 'actif' AND f.actif = 1)
        OR (${statut} = 'inactif' AND f.actif = 0)
      )
    GROUP BY f.id
    ORDER BY f.actif DESC, f.famille ASC,
        f.nature ASC, f.libelle ASC
  `;

  const total = frais.length;
  const actifs = frais.filter((f) => Boolean(f.actif)).length;
  const avecTarif = frais.filter((f) => nombre(f.nombre_tarifs) > 0).length;
  const avecPenalite = frais.filter((f) => Boolean(f.penalite_active)).length;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Frais scolaires"
      description="Configurez les frais, les périodicités, les tarifs par classe et les échéances."
    >
      <RetourDashboard />

      {params.succes && (
        <div className={styles.succes}>
          L’opération a été enregistrée avec succès.
        </div>
      )}

      <section className={styles.stats}>
        <article>
          <BadgeDollarSign />
          <div><small>Frais configurés</small><strong>{total}</strong></div>
        </article>
        <article>
          <CircleDollarSign />
          <div><small>Frais actifs</small><strong>{actifs}</strong></div>
        </article>
        <article>
          <Settings2 />
          <div><small>Avec tarif défini</small><strong>{avecTarif}</strong></div>
        </article>
        <article>
          <CalendarDays />
          <div><small>Pénalité facultative active</small><strong>{avecPenalite}</strong></div>
        </article>
      </section>

      <section className={styles.barreActions}>
        <form className={styles.filtres}>
          <div className={styles.recherche}>
            <Search size={18} />
            <input name="q" defaultValue={q} placeholder="Rechercher un frais..." />
          </div>

          <select name="famille" defaultValue={famille}>
            <option value="">Toutes les familles</option>
            <option value="ACADEMIQUES">Frais académiques</option>
            <option value="ADMINISTRATIFS">Frais administratifs</option>
            <option value="SERVICES_SCOLAIRES">Services scolaires</option>
            <option value="ACTIVITES">Activités parascolaires</option>
            <option value="EQUIPEMENTS">Équipements et fournitures</option>
            <option value="AUTRES">Autres</option>
          </select>

          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>

          <button type="submit" className={styles.secondaire}>Filtrer</button>
        </form>

        <Link href="/dashboard/finances/frais-scolaires/nouveau" className={styles.primaire}>
          <Plus size={18} />
          Nouveau frais
        </Link>
      </section>

      <section className={styles.tableauBloc}>
        <div className={styles.tableauDefilement}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Frais</th>
                <th>Famille</th><th>Nature</th>
                <th>Périodicité</th>
                <th>Tarifs</th>
                <th>Montants</th>
                <th>Pénalité</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {frais.map((item) => {
                const montantMin = item.montant_min === null ? null : Number(item.montant_min);
                const montantMax = item.montant_max === null ? null : Number(item.montant_max);
                const actif = Boolean(item.actif);

                return (
                  <tr key={item.id}>
                    <td><strong>{item.code}</strong></td>
                    <td>
                      <Link href={`/dashboard/finances/frais-scolaires/${item.id}`} className={styles.lienFrais}>
                        {item.libelle}
                      </Link>
                      <small className={styles.sousTexte}>
                        {Boolean(item.obligatoire) ? "Obligatoire" : "Facultatif"}
                      </small>
                    </td>
                    <td>{item.famille}</td><td>{item.nature}</td>
                    <td>{item.periodicite}</td>
                    <td>{nombre(item.nombre_tarifs)}</td>
                    <td>
                      {montantMin === null
                        ? "Non défini"
                        : montantMin === montantMax
                          ? montantMin.toLocaleString("fr-FR")
                          : `${montantMin.toLocaleString("fr-FR")} — ${montantMax?.toLocaleString("fr-FR")}`}
                    </td>
                    <td>
                      <span className={Boolean(item.penalite_active) ? styles.badgeOrange : styles.badgeGris}>
                        {Boolean(item.penalite_active) ? "Active" : "Désactivée"}
                      </span>
                    </td>
                    <td>
                      <span className={actif ? styles.badgeVert : styles.badgeRouge}>
                        {actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <form action={basculerStatutFrais.bind(null, item.id, actif)}>
                        <button className={styles.boutonLigne} type="submit">
                          {actif ? "Désactiver" : "Activer"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}

              {!frais.length && (
                <tr>
                  <td colSpan={10}>
                    <div className={styles.vide}>
                      <BadgeDollarSign size={42} />
                      <h2>Aucun frais scolaire trouvé</h2>
                      <p>Créez le premier frais pour préparer ensuite les paiements des apprenants.</p>
                      <Link href="/dashboard/finances/frais-scolaires/nouveau">Créer un frais scolaire</Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
