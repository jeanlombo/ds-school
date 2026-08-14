import { redirect } from "next/navigation";
import { Search, UserRoundSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import PaiementClient from "./PaiementClient";
import styles from "../paiements.module.css";

export const dynamic = "force-dynamic";

type Eleve = {
  inscription_id: number;
  eleve_id: number;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string;
  classe_nom: string;
  annee_scolaire_id: number;
  annee_libelle: string;
};

type Frais = {
  frais_id: number;
  tarif_id: number | null;
  code: string;
  libelle: string;
  montant_attendu: number;
  deja_paye: number;
  devise: string;
};

type Props = {
  searchParams: Promise<{
    q?: string;
    inscriptionId?: string;
    erreur?: string;
  }>;
};

export default async function NouveauPaiement({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const recherche = String(params.q ?? "").trim();
  const inscriptionId = Number(params.inscriptionId ?? 0);

  const eleves = recherche
    ? await prisma.$queryRaw<Eleve[]>`
        SELECT
          i.id AS inscription_id,
          e.id AS eleve_id,
          e.matricule,
          e.nom,
          e.postnom,
          e.prenom,
          c.nom AS classe_nom,
          i.annee_scolaire_id,
          a.libelle AS annee_libelle
        FROM inscriptions i
        INNER JOIN eleves e ON e.id = i.eleve_id
        INNER JOIN classes c ON c.id = i.classe_id
        INNER JOIN annees_scolaires a ON a.id = i.annee_scolaire_id
        WHERE e.ecole_id = ${ecole.id}
          AND i.statut IN ('inscrit', 'promu', 'redouble')
          AND (
            e.matricule LIKE CONCAT('%', ${recherche}, '%')
            OR e.nom LIKE CONCAT('%', ${recherche}, '%')
            OR e.postnom LIKE CONCAT('%', ${recherche}, '%')
            OR e.prenom LIKE CONCAT('%', ${recherche}, '%')
          )
        ORDER BY a.active DESC, e.nom ASC, e.prenom ASC
        LIMIT 50
      `
    : [];

  const selection = inscriptionId
    ? await prisma.$queryRaw<Eleve[]>`
        SELECT
          i.id AS inscription_id,
          e.id AS eleve_id,
          e.matricule,
          e.nom,
          e.postnom,
          e.prenom,
          c.nom AS classe_nom,
          i.annee_scolaire_id,
          a.libelle AS annee_libelle
        FROM inscriptions i
        INNER JOIN eleves e ON e.id = i.eleve_id
        INNER JOIN classes c ON c.id = i.classe_id
        INNER JOIN annees_scolaires a ON a.id = i.annee_scolaire_id
        WHERE i.id = ${inscriptionId}
          AND e.ecole_id = ${ecole.id}
        LIMIT 1
      `
    : [];

  const eleve = selection[0];

  const frais = eleve
    ? await prisma.$queryRaw<Frais[]>`
        SELECT
          fs.id AS frais_id,
          t.id AS tarif_id,
          fs.code,
          fs.libelle,
          t.montant AS montant_attendu,
          COALESCE(SUM(
            CASE
              WHEN p.statut = 'VALIDE' THEN dp.montant
              ELSE 0
            END
          ), 0) AS deja_paye,
          t.devise
        FROM frais_scolaires fs
        INNER JOIN tarifs_frais_scolaires t
          ON t.frais_id = fs.id
          AND t.ecole_id = fs.ecole_id
          AND t.annee_scolaire_id = ${eleve.annee_scolaire_id}
          AND (t.classe_id IS NULL OR t.classe_id = (
            SELECT classe_id FROM inscriptions WHERE id = ${eleve.inscription_id}
          ))
          AND t.actif = 1
        LEFT JOIN details_paiements_scolaires dp
          ON dp.frais_id = fs.id
        LEFT JOIN paiements_scolaires p
          ON p.id = dp.paiement_id
          AND p.inscription_id = ${eleve.inscription_id}
        WHERE fs.ecole_id = ${ecole.id}
          AND fs.actif = 1
        GROUP BY
          fs.id, t.id, fs.code, fs.libelle,
          t.montant, t.devise
        ORDER BY fs.famille ASC, fs.nature ASC, fs.libelle ASC
      `
    : [];

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouveau paiement scolaire"
      description="Recherchez l’apprenant, sélectionnez les frais et enregistrez le paiement."
    >
      <RetourDashboard />

      {params.erreur && (
        <div className={styles.erreur}>
          {params.erreur === "caisse"
            ? "Ouvrez d’abord une session de caisse avant d’encaisser."
            : params.erreur === "equilibre"
              ? "Le total des modes de paiement doit être égal au total des frais."
              : "Veuillez vérifier les informations du paiement."}
        </div>
      )}

      <section className={styles.panel}>
        <form className={styles.rechercheEleve}>
          <div>
            <Search size={19} />
            <input
              name="q"
              defaultValue={recherche}
              placeholder="Matricule, nom, postnom ou prénom..."
              autoFocus
            />
          </div>
          <button type="submit">Rechercher l’apprenant</button>
        </form>

        {recherche && !eleve && (
          <div className={styles.resultatsEleves}>
            {eleves.map((item) => (
              <a
                key={item.inscription_id}
                href={`/dashboard/finances/paiements/nouveau?inscriptionId=${item.inscription_id}`}
              >
                <UserRoundSearch size={20} />
                <div>
                  <strong>
                    {item.nom} {item.postnom ?? ""} {item.prenom}
                  </strong>
                  <small>
                    {item.matricule} · {item.classe_nom} · {item.annee_libelle}
                  </small>
                </div>
              </a>
            ))}

            {!eleves.length && (
              <div className={styles.vide}>
                Aucun apprenant ne correspond à la recherche.
              </div>
            )}
          </div>
        )}
      </section>

      {eleve && (
        <>
          <section className={styles.ficheEleve}>
            <div>
              <small>Apprenant</small>
              <strong>
                {eleve.nom} {eleve.postnom ?? ""} {eleve.prenom}
              </strong>
            </div>
            <div><small>Matricule</small><strong>{eleve.matricule}</strong></div>
            <div><small>Classe</small><strong>{eleve.classe_nom}</strong></div>
            <div><small>Année scolaire</small><strong>{eleve.annee_libelle}</strong></div>
          </section>

          <PaiementClient
            inscriptionId={eleve.inscription_id}
            anneeScolaireId={eleve.annee_scolaire_id}
            devise={frais[0]?.devise ?? ecole.devise ?? "CDF"}
            frais={frais.map((item) => ({
              fraisId: item.frais_id,
              tarifId: item.tarif_id,
              code: item.code,
              libelle: item.libelle,
              montantAttendu: Number(item.montant_attendu),
              dejaPaye: Number(item.deja_paye),
              solde: Math.max(
                0,
                Number(item.montant_attendu) - Number(item.deja_paye)
              ),
              devise: item.devise,
            }))}
          />
        </>
      )}
    </AdminShell>
  );
}
