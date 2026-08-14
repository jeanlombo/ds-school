import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Printer, Search } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { calculerResultats } from "../resultats/calculs";
import styles from "./bulletins.module.css";
import { terminologieSection, terminologieNeutre } from "@/lib/terminologie-academique";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    classeId?: string;
    periodeId?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [classes, periodes] = await Promise.all([
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      include: { section: true },
      orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }],
    }),
    prisma.periodeAcademique.findMany({
      where: { anneeScolaire: { ecoleId: ecole.id } },
      include: { anneeScolaire: true },
      orderBy: [{ anneeScolaire: { dateDebut: "desc" } }, { ordre: "asc" }],
    }),
  ]);

  const classeId = Number(params.classeId ?? 0);
  const periodeId = Number(params.periodeId ?? 0);
  const synthese = await calculerResultats(ecole.id, classeId, periodeId);

  const classe = classes.find((element) => element.id === classeId);
  const periode = periodes.find((element) => element.id === periodeId);
  const t = classe ? terminologieSection(classe.section.nom, ecole.typeEtablissement) : terminologieNeutre();

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Documents de résultats"
      description="Prévisualisez et imprimez le document adapté au cycle : bulletin scolaire ou relevé de notes."
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Production documentaire</span>
            <h2>Documents académiques Premium</h2>
            <p>
              Sélectionnez une classe / promotion et une période pour produire les documents
              individuels des apprenants.
            </p>
          </div>
          <FileText size={76} />
        </section>

        <section className={styles.panel}>
          <form className={styles.filters}>
            <label>
              <span>Classe / Promotion</span>
              <select name="classeId" defaultValue={classeId || ""} required>
                <option value="">Choisir une classe / promotion</option>
                {classes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom} — {element.section.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Période académique</span>
              <select name="periodeId" defaultValue={periodeId || ""} required>
                <option value="">Choisir une période</option>
                {periodes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom} — {element.anneeScolaire.libelle}
                  </option>
                ))}
              </select>
            </label>

            <button className={styles.btn} type="submit">
              <Search size={18} />
              Afficher les documents
            </button>
          </form>
        </section>

        {classeId && periodeId ? (
          <section className={styles.panel}>
            <div className={styles.entete}>
              <div>
                <span className={styles.eyebrow}>Liste des {t.personnePluriel}</span>
                <h3>
                  {classe?.nom} · {periode?.nom}
                </h3>
              </div>
              <span className={styles.compteur}>
                {synthese.lignes.length} document(s)
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Matricule</th>
                    <th>{t.personneMaj}</th>
                    <th>Moyenne</th>
                    <th>Mention</th>
                    <th>Décision</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {synthese.lignes.map((ligne) => (
                    <tr key={ligne.inscriptionId}>
                      <td>
                        <span className={styles.rang}>#{ligne.rang}</span>
                      </td>
                      <td className={styles.matricule}>{ligne.matricule}</td>
                      <td>
                        <strong>{ligne.nomComplet}</strong>
                      </td>
                      <td>
                        <strong className={styles.moyenne}>
                          {ligne.moyenne.toFixed(2)}%
                        </strong>
                      </td>
                      <td>
                        <span className={styles.mention}>{ligne.mention}</span>
                      </td>
                      <td>
                        <span
                          className={
                            ligne.decision === "Admis"
                              ? styles.admis
                              : styles.ajourne
                          }
                        >
                          {ligne.decision}
                        </span>
                      </td>
                      <td>
                        <Link
                          className={styles.imprimer}
                          href={`/dashboard/centre-academique/bulletins/${ligne.inscriptionId}?classeId=${classeId}&periodeId=${periodeId}`}
                        >
                          <Printer size={17} />
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {synthese.lignes.length === 0 && (
              <div className={styles.vide}>
                <FileText size={46} />
                <h3>Aucun document disponible</h3>
                <p>
                  Publiez les évaluations et enregistrez les notes avant de
                  produire les documents.
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className={styles.vide}>
            <FileText size={50} />
            <h3>Sélection nécessaire</h3>
            <p>Choisissez une classe et une période académique.</p>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
