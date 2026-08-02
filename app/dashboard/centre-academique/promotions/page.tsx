import { redirect } from "next/navigation";
import { ArrowRightCircle, GraduationCap, ShieldCheck, Users } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { calculerResultats } from "../resultats/calculs";
import PromotionClient from "./PromotionClient";
import styles from "./promotions.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    anneeSourceId?: string;
    anneeCibleId?: string;
    classeSourceId?: string;
    classeCibleId?: string;
    periodeId?: string;
    succes?: string;
    erreur?: string;
    promus?: string;
    redoublants?: string;
    exclus?: string;
    ignores?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [annees, classes, periodes] = await Promise.all([
    prisma.anneeScolaire.findMany({
      where: { ecoleId: ecole.id },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      include: { section: true },
      orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }],
    }),
    prisma.periodeAcademique.findMany({
      where: { anneeScolaire: { ecoleId: ecole.id } },
      include: { anneeScolaire: true },
      orderBy: [{ anneeScolaire: { dateDebut: "desc" } }, { ordre: "desc" }],
    }),
  ]);

  const anneeSourceId =
    Number(params.anneeSourceId ?? 0) ||
    annees.find((annee) => annee.active)?.id ||
    annees[0]?.id ||
    0;

  const anneeCibleId =
    Number(params.anneeCibleId ?? 0) ||
    annees.find((annee) => annee.id !== anneeSourceId)?.id ||
    0;

  const classeSourceId =
    Number(params.classeSourceId ?? 0) || classes[0]?.id || 0;
  const classeCibleId =
    Number(params.classeCibleId ?? 0) ||
    classes.find((classe) => classe.id !== classeSourceId)?.id ||
    classeSourceId;

  const periodesSource = periodes.filter(
    (periode) => periode.anneeScolaireId === anneeSourceId,
  );
  const periodeId =
    Number(params.periodeId ?? 0) || periodesSource[0]?.id || 0;

  const synthese =
    classeSourceId && periodeId
      ? await calculerResultats(ecole.id, classeSourceId, periodeId)
      : null;

  const regle = await prisma.regleEvaluation.findUnique({
    where: { ecoleId: ecole.id },
  });
  const seuil = Number(regle?.seuilReussite ?? 50);

  const inscriptionsSource = await prisma.inscription.findMany({
    where: {
      classeId: classeSourceId,
      anneeScolaireId: anneeSourceId,
      eleve: { ecoleId: ecole.id },
    },
    include: { eleve: true },
  });

  const statutParEleve = new Map(
    inscriptionsSource.map((inscription) => [
      inscription.eleveId,
      inscription.statut,
    ]),
  );

  const lignes = (synthese?.lignes ?? []).map((ligne) => ({
    inscriptionId: ligne.inscriptionId,
    eleveId: ligne.eleveId,
    matricule: ligne.matricule,
    nomComplet: ligne.nomComplet,
    moyenne: ligne.moyenne,
    rang: ligne.rang,
    mention: ligne.mention,
    tauxCompletion: ligne.tauxCompletion,
    statutActuel: statutParEleve.get(ligne.eleveId) ?? "inscrit",
    decision:
      ligne.moyenne >= seuil
        ? ("PROMU" as const)
        : ligne.moyenne >= Math.max(40, seuil - 10)
          ? ("RATTRAPAGE" as const)
          : ("REDOUBLE" as const),
  }));

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Promotion automatique"
      description="Préparez et exécutez le passage des élèves vers l’année scolaire suivante."
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.hero}>
          <div>
            <span>Passage de classe sécurisé</span>
            <h2>Promotion automatique Enterprise</h2>
            <p>
              Prévisualisez chaque décision, choisissez les classes de
              destination et créez les nouvelles inscriptions sans doublon.
            </p>
          </div>
          <GraduationCap size={86} />
        </section>

        {params.succes === "1" && (
          <div className={styles.succes}>
            Promotion terminée : {params.promus ?? 0} promu(s),{" "}
            {params.redoublants ?? 0} redoublant(s), {params.exclus ?? 0} exclu(s)
            et {params.ignores ?? 0} dossier(s) laissé(s) en attente.
          </div>
        )}

        {params.erreur && (
          <div className={styles.erreur}>
            L’opération n’a pas été exécutée. Vérifiez les années, les classes,
            les décisions et la confirmation.
          </div>
        )}

        <section className={styles.filtres}>
          <form>
            <label>
              <span>Année source</span>
              <select name="anneeSourceId" defaultValue={anneeSourceId || ""}>
                {annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.libelle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Période de décision</span>
              <select name="periodeId" defaultValue={periodeId || ""}>
                {periodesSource.map((periode) => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Classe source</span>
              <select name="classeSourceId" defaultValue={classeSourceId || ""}>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} — {classe.section.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Année cible</span>
              <select name="anneeCibleId" defaultValue={anneeCibleId || ""}>
                {annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.libelle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Classe supérieure</span>
              <select name="classeCibleId" defaultValue={classeCibleId || ""}>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} — {classe.section.nom}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">
              <ArrowRightCircle size={18} />
              Prévisualiser
            </button>
          </form>
        </section>

        <section className={styles.kpis}>
          <article>
            <Users />
            <div>
              <small>Élèves analysés</small>
              <strong>{lignes.length}</strong>
            </div>
          </article>
          <article>
            <ShieldCheck />
            <div>
              <small>Seuil de réussite</small>
              <strong>{seuil.toFixed(0)}%</strong>
            </div>
          </article>
          <article>
            <GraduationCap />
            <div>
              <small>Promotions proposées</small>
              <strong>
                {lignes.filter((ligne) => ligne.decision === "PROMU").length}
              </strong>
            </div>
          </article>
          <article>
            <ArrowRightCircle />
            <div>
              <small>Classe cible</small>
              <strong>
                {classes.find((classe) => classe.id === classeCibleId)?.nom ?? "—"}
              </strong>
            </div>
          </article>
        </section>

        <PromotionClient
          anneeSourceId={anneeSourceId}
          anneeCibleId={anneeCibleId}
          classeSourceId={classeSourceId}
          classeCibleId={classeCibleId}
          anneeSourceNom={
            annees.find((annee) => annee.id === anneeSourceId)?.libelle ?? ""
          }
          anneeCibleNom={
            annees.find((annee) => annee.id === anneeCibleId)?.libelle ?? ""
          }
          classeSourceNom={
            classes.find((classe) => classe.id === classeSourceId)?.nom ?? ""
          }
          classeCibleNom={
            classes.find((classe) => classe.id === classeCibleId)?.nom ?? ""
          }
          lignesInitiales={lignes}
        />
      </div>
    </AdminShell>
  );
}
