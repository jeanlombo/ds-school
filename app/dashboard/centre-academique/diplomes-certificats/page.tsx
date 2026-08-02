import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  Ban,
  FileBadge2,
  FileCheck2,
  PlusCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { annulerDocument } from "./actions";
import BoutonAnnulerDocument from "./BoutonAnnulerDocument";
import styles from "./documents.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    recherche?: string;
    type?: string;
    statut?: string;
    succes?: string;
    erreur?: string;
  }>;
};

const types = [
  ["DIPLOME_FIN_ETUDES", "Diplôme de fin d’études"],
  ["CERTIFICAT_REUSSITE", "Certificat de réussite"],
  ["ATTESTATION_SCOLARITE", "Attestation de scolarité"],
  ["ATTESTATION_FREQUENTATION", "Attestation de fréquentation"],
  ["ATTESTATION_BONNE_CONDUITE", "Attestation de bonne conduite"],
  ["ATTESTATION_TRANSFERT", "Attestation de transfert"],
] as const;

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const q = await searchParams;
  const recherche = (q.recherche ?? "").trim();

  const where = {
    ecoleId: ecole.id,
    ...(q.type ? { type: q.type } : {}),
    ...(q.statut ? { statut: q.statut } : {}),
    ...(recherche
      ? {
          OR: [
            { numero: { contains: recherche } },
            { eleve: { matricule: { contains: recherche } } },
            { eleve: { nom: { contains: recherche } } },
            { eleve: { prenom: { contains: recherche } } },
          ],
        }
      : {}),
  };

  const [documents, total, valides, annules, diplomes] = await Promise.all([
    prisma.documentAcademique.findMany({
      where,
      include: {
        eleve: true,
        anneeScolaire: true,
        classe: { include: { section: true } },
      },
      orderBy: { dateDelivrance: "desc" },
      take: 200,
    }),
    prisma.documentAcademique.count({ where: { ecoleId: ecole.id } }),
    prisma.documentAcademique.count({
      where: { ecoleId: ecole.id, statut: "VALIDE" },
    }),
    prisma.documentAcademique.count({
      where: { ecoleId: ecole.id, statut: "ANNULE" },
    }),
    prisma.documentAcademique.count({
      where: { ecoleId: ecole.id, type: "DIPLOME_FIN_ETUDES" },
    }),
  ]);

  const libelleType = (type: string) =>
    types.find(([code]) => code === type)?.[1] ?? type;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Diplômes & certificats"
      description="Délivrez, imprimez, contrôlez et vérifiez les documents académiques."
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.hero}>
          <div>
            <span>Registre académique sécurisé</span>
            <h2>Diplômes & Certificats Enterprise</h2>
            <p>
              Chaque document reçoit un numéro unique, un code public de
              vérification, un QR Code et un statut officiel.
            </p>
          </div>
          <Award size={88} />
        </section>

        {q.succes && (
          <div className={styles.succes}>
            Opération terminée avec succès.
          </div>
        )}
        {q.erreur && (
          <div className={styles.erreur}>
            L’opération n’a pas pu être exécutée. Vérifiez les informations.
          </div>
        )}

        <section className={styles.kpis}>
          <article>
            <FileBadge2 />
            <div><small>Total documents</small><strong>{total}</strong></div>
          </article>
          <article>
            <ShieldCheck />
            <div><small>Documents valides</small><strong>{valides}</strong></div>
          </article>
          <article>
            <Ban />
            <div><small>Documents annulés</small><strong>{annules}</strong></div>
          </article>
          <article>
            <Award />
            <div><small>Diplômes</small><strong>{diplomes}</strong></div>
          </article>
        </section>

        <section className={styles.outils}>
          <form>
            <label>
              <span>Recherche</span>
              <input
                name="recherche"
                defaultValue={q.recherche ?? ""}
                placeholder="Numéro, nom ou matricule"
              />
            </label>
            <label>
              <span>Type</span>
              <select name="type" defaultValue={q.type ?? ""}>
                <option value="">Tous les types</option>
                {types.map(([code, nom]) => (
                  <option key={code} value={code}>{nom}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Statut</span>
              <select name="statut" defaultValue={q.statut ?? ""}>
                <option value="">Tous les statuts</option>
                <option value="VALIDE">Valide</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </label>
            <button type="submit"><Search size={17} /> Rechercher</button>
          </form>

          <Link className={styles.nouveau} href="/dashboard/centre-academique/diplomes-certificats/nouveau">
            <PlusCircle size={18} /> Nouveau document
          </Link>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>Registre officiel</span>
              <h3>Documents académiques délivrés</h3>
            </div>
            <Link href="/verifier-document" target="_blank">
              <ShieldCheck size={17} /> Vérification publique
            </Link>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Élève</th>
                  <th>Type</th>
                  <th>Année / classe</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td><strong>{document.numero}</strong></td>
                    <td>
                      {document.eleve.nom} {document.eleve.postnom ?? ""}{" "}
                      {document.eleve.prenom}
                      <small>{document.eleve.matricule}</small>
                    </td>
                    <td>{libelleType(document.type)}</td>
                    <td>
                      {document.anneeScolaire.libelle}
                      <small>
                        {document.classe?.nom ?? "—"}{" "}
                        {document.classe?.section?.nom
                          ? `· ${document.classe.section.nom}`
                          : ""}
                      </small>
                    </td>
                    <td>{document.dateDelivrance.toLocaleDateString("fr-CD")}</td>
                    <td>
                      <span
                        className={
                          document.statut === "VALIDE"
                            ? styles.valide
                            : styles.annule
                        }
                      >
                        {document.statut}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/dashboard/centre-academique/diplomes-certificats/${document.id}`}>
                          <FileCheck2 size={16} /> Ouvrir
                        </Link>
                        {document.statut === "VALIDE" && (
                          <BoutonAnnulerDocument
                            documentId={document.id}
                            action={annulerDocument}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {documents.length === 0 && (
              <div className={styles.vide}>Aucun document trouvé.</div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
