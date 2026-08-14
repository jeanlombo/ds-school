import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Medal,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { calculerResultats } from "../resultats/calculs";
import styles from "../resultats/resultats.module.css";

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
      orderBy: { nom: "asc" },
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
  const podium = synthese.lignes.slice(0, 3);

  const classe = classes.find((element) => element.id === classeId);
  const periode = periodes.find((element) => element.id === periodeId);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Classement intelligent"
      description="Rangs, podium et performances de la classe avec gestion des ex æquo."
      action={
        classeId && periodeId ? (
          <Link
            className={styles.actionSecondaire}
            href={`/dashboard/centre-academique/resultats?classeId=${classeId}&periodeId=${periodeId}`}
          >
            <ArrowLeft size={18} />
            Retour aux résultats
          </Link>
        ) : undefined
      }
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.heroClassement}>
          <div>
            <span className={styles.eyebrow}>Palmarès académique</span>
            <h2>
              {classe?.nom ?? "Classement par classe"}
              {periode ? ` · ${periode.nom}` : ""}
            </h2>
            <p>
              Les apprenants ayant exactement la même moyenne obtiennent le même
              rang. Le rang suivant respecte leur position réelle.
            </p>
          </div>
          <Trophy size={76} />
        </section>

        <section className={styles.panelFiltres}>
          <form className={styles.filters}>
            <label>
              <span>Classe</span>
              <select
                name="classeId"
                defaultValue={classeId || ""}
                required
              >
                <option value="">Choisir une classe</option>
                {classes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Période académique</span>
              <select
                name="periodeId"
                defaultValue={periodeId || ""}
                required
              >
                <option value="">Choisir une période</option>
                {periodes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom} — {element.anneeScolaire.libelle}
                  </option>
                ))}
              </select>
            </label>

            <button className={styles.btnPrimaire} type="submit">
              <Search size={18} />
              Afficher le classement
            </button>
          </form>
        </section>

        {classeId && periodeId && synthese.lignes.length > 0 ? (
          <>
            <section className={styles.podium}>
              {podium.map((ligne, index) => {
                const position = index + 1;
                const Icone =
                  position === 1 ? Crown : position === 2 ? Medal : Sparkles;

                return (
                  <article
                    key={ligne.inscriptionId}
                    className={`${styles.podiumCarte} ${
                      position === 1 ? styles.premier : ""
                    }`}
                  >
                    <span className={styles.positionPodium}>{position}</span>
                    <div className={styles.iconePodium}>
                      <Icone size={28} />
                    </div>
                    <div className={styles.avatarPodium}>
                      {ligne.nomComplet
                        .split(" ")
                        .slice(0, 2)
                        .map((partie) => partie.charAt(0))
                        .join("")}
                    </div>
                    <h3>{ligne.nomComplet}</h3>
                    <p>{ligne.matricule}</p>
                    <strong>{ligne.moyenne.toFixed(2)}%</strong>
                    <span>{ligne.mention}</span>
                  </article>
                );
              })}
            </section>

            <section className={styles.panelTableau}>
              <div className={styles.enteteTableau}>
                <div>
                  <span className={styles.eyebrow}>Classement complet</span>
                  <h3>{synthese.lignes.length} apprenant(s) classé(s)</h3>
                </div>
                <span className={styles.tauxBadge}>
                  Réussite : {synthese.tauxReussite.toFixed(1)}%
                </span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Apprenant</th>
                      <th>Matricule</th>
                      <th>Moyenne générale</th>
                      <th>Mention</th>
                      <th>Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthese.lignes.map((ligne) => (
                      <tr key={ligne.inscriptionId}>
                        <td>
                          <span
                            className={
                              ligne.rang <= 3
                                ? styles.rangFort
                                : styles.rang
                            }
                          >
                            #{ligne.rang}
                          </span>
                        </td>
                        <td>
                          <div className={styles.eleve}>
                            <span>
                              {ligne.nomComplet
                                .split(" ")
                                .slice(0, 2)
                                .map((partie) => partie.charAt(0))
                                .join("")}
                            </span>
                            <strong>{ligne.nomComplet}</strong>
                          </div>
                        </td>
                        <td className={styles.matricule}>
                          {ligne.matricule}
                        </td>
                        <td>
                          <strong className={styles.moyenne}>
                            {ligne.moyenne.toFixed(2)}%
                          </strong>
                        </td>
                        <td>
                          <span className={styles.mention}>
                            {ligne.mention}
                          </span>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className={styles.vide}>
            <Trophy size={54} />
            <h3>
              {classeId && periodeId
                ? "Aucun classement disponible"
                : "Sélectionnez une classe et une période"}
            </h3>
            <p>
              Le classement apparaîtra dès que les évaluations seront publiées
              et que les notes seront enregistrées.
            </p>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
