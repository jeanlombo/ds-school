import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Ban,
  CircleDollarSign,
  Eye,
  FileText,
  Plus,
  Printer,
  Search,
  WalletCards,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import styles from "./paiements.module.css";

export const dynamic = "force-dynamic";

type Paiement = {
  id: number;
  numero_paiement: string;
  date_paiement: Date;
  montant_total: number;
  devise: string;
  mode_paiement: string;
  statut: string;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  classe_nom: string | null;
  numero_recu: string | null;
  recu_id: number | null;
};

type Props = {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    devise?: string;
    date_debut?: string;
    date_fin?: string;
  }>;
};

export default async function PagePaiements({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const recherche = String(params.q ?? "").trim();
  const statut = String(params.statut ?? "").trim();
  const devise = String(params.devise ?? "").trim();
  const dateDebut = String(params.date_debut ?? "").trim();
  const dateFin = String(params.date_fin ?? "").trim();

  const paiements = await prisma.$queryRaw<Paiement[]>`
    SELECT
      p.id,
      p.numero_paiement,
      p.date_paiement,
      p.montant_total,
      p.devise,
      p.mode_paiement,
      p.statut,
      e.matricule,
      e.nom,
      e.postnom,
      e.prenom,
      c.nom AS classe_nom,
      r.numero_recu,
      r.id AS recu_id
    FROM paiements_scolaires p
    INNER JOIN inscriptions i ON i.id = p.inscription_id
    INNER JOIN eleves e ON e.id = i.eleve_id
    LEFT JOIN classes c ON c.id = i.classe_id
    LEFT JOIN recus_scolaires r ON r.paiement_id = p.id
    WHERE p.ecole_id = ${ecole.id}
      AND (
        ${recherche} = ''
        OR p.numero_paiement LIKE CONCAT('%', ${recherche}, '%')
        OR r.numero_recu LIKE CONCAT('%', ${recherche}, '%')
        OR p.reference_transaction LIKE CONCAT('%', ${recherche}, '%')
        OR e.matricule LIKE CONCAT('%', ${recherche}, '%')
        OR e.nom LIKE CONCAT('%', ${recherche}, '%')
        OR e.postnom LIKE CONCAT('%', ${recherche}, '%')
        OR e.prenom LIKE CONCAT('%', ${recherche}, '%')
      )
      AND (${statut} = '' OR p.statut = ${statut})
      AND (${devise} = '' OR p.devise = ${devise})
      AND (${dateDebut} = '' OR DATE(p.date_paiement) >= ${dateDebut})
      AND (${dateFin} = '' OR DATE(p.date_paiement) <= ${dateFin})
    ORDER BY p.date_paiement DESC, p.id DESC
    LIMIT 500
  `;

  const valides = paiements.filter((p) => p.statut === "VALIDE");
  const annules = paiements.filter((p) => p.statut === "ANNULE");

  const totalCDF = valides
    .filter((p) => p.devise === "CDF")
    .reduce((s, p) => s + Number(p.montant_total), 0);

  const totalUSD = valides
    .filter((p) => p.devise === "USD")
    .reduce((s, p) => s + Number(p.montant_total), 0);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Paiements scolaires"
      description="Enregistrez, contrôlez et annulez les paiements scolaires."
      action={
        <Link href="/dashboard/finances/paiements/nouveau" className={styles.primaire}>
          <Plus size={18} />
          Nouveau paiement
        </Link>
      }
    >
      <RetourDashboard />

      <section className={styles.stats}>
        <article>
          <CircleDollarSign />
          <div><small>Encaissements CDF</small><strong>{totalCDF.toLocaleString("fr-FR")}</strong></div>
        </article>
        <article>
          <WalletCards />
          <div><small>Encaissements USD</small><strong>{totalUSD.toLocaleString("fr-FR")}</strong></div>
        </article>
        <article>
          <FileText />
          <div><small>Paiements valides</small><strong>{valides.length}</strong></div>
        </article>
        <article>
          <Ban />
          <div><small>Paiements annulés</small><strong>{annules.length}</strong></div>
        </article>
      </section>

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <div className={styles.recherche}>
            <Search size={18} />
            <input
              name="q"
              defaultValue={recherche}
              placeholder="Élève, matricule, reçu ou référence..."
            />
          </div>

          <select name="statut" defaultValue={statut}>
            <option value="">Tous les statuts</option>
            <option value="VALIDE">Valides</option>
            <option value="ANNULE">Annulés</option>
          </select>

          <select name="devise" defaultValue={devise}>
            <option value="">Toutes les devises</option>
            <option value="CDF">CDF</option>
            <option value="USD">USD</option>
          </select>

          <input type="date" name="date_debut" defaultValue={dateDebut} />
          <input type="date" name="date_fin" defaultValue={dateFin} />

          <button type="submit">Filtrer</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableau}>
          <table>
            <thead>
              <tr>
                <th>Paiement</th>
                <th>Date</th>
                <th>Élève</th>
                <th>Classe</th>
                <th>Montant</th>
                <th>Mode</th>
                <th>Reçu</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paiements.map((paiement) => (
                <tr key={paiement.id}>
                  <td><strong>{paiement.numero_paiement}</strong></td>
                  <td>{new Date(paiement.date_paiement).toLocaleString("fr-FR")}</td>
                  <td>
                    {paiement.nom} {paiement.postnom ?? ""} {paiement.prenom}
                    <small>{paiement.matricule}</small>
                  </td>
                  <td>{paiement.classe_nom ?? "—"}</td>
                  <td><strong>{Number(paiement.montant_total).toLocaleString("fr-FR")} {paiement.devise}</strong></td>
                  <td>{paiement.mode_paiement}</td>
                  <td>{paiement.numero_recu ?? "—"}</td>
                  <td>
                    <span className={paiement.statut === "VALIDE" ? styles.vert : styles.rouge}>
                      {paiement.statut}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsPaiement}>
                      <Link
                        href={`/dashboard/finances/paiements/${paiement.id}`}
                        className={styles.action}
                      >
                        <Eye size={15} />
                        Détails
                      </Link>

                      {paiement.recu_id && (
                        <>
                          <Link
                            href={`/dashboard/finances/recus/${paiement.recu_id}`}
                            className={styles.actionSecondaire}
                          >
                            Reçu
                          </Link>

                          <Link
                            href={`/dashboard/finances/recus/${paiement.recu_id}?format=pos80`}
                            className={styles.actionSecondaire}
                          >
                            <Printer size={15} />
                            POS
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!paiements.length && (
                <tr>
                  <td colSpan={9}>
                    <div className={styles.vide}>
                      <CircleDollarSign size={44} />
                      <h2>Aucun paiement scolaire</h2>
                      <p>Enregistrez le premier paiement pour alimenter les reçus, la caisse et les rapports.</p>
                      <Link href="/dashboard/finances/paiements/nouveau">Nouveau paiement</Link>
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
