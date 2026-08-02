import { redirect } from "next/navigation";
import { Gavel, Scale, ShieldCheck, Users } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import { calculerResultats } from "../resultats/calculs";
import DeliberationClient from "./DeliberationClient";
import styles from "./deliberations.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    periodeId?: string;
    classeId?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;

  const [classes, periodes, regle] = await Promise.all([
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
    prisma.regleEvaluation.findUnique({
      where: { ecoleId: ecole.id },
    }),
  ]);

  const periodeId = Number(params.periodeId ?? 0) || periodes[0]?.id || 0;
  const classeId = Number(params.classeId ?? 0) || classes[0]?.id || 0;

  const classe = classes.find((element) => element.id === classeId);
  const periode = periodes.find((element) => element.id === periodeId);

  const synthese =
    classeId && periodeId
      ? await calculerResultats(ecole.id, classeId, periodeId)
      : null;

  const seuilReussite = Number(regle?.seuilReussite ?? 50);

  const lignes = (synthese?.lignes ?? []).map((ligne) => {
    let proposition = "Redouble";
    if (ligne.moyenne >= seuilReussite) proposition = "Admis";
    else if (ligne.moyenne >= Math.max(40, seuilReussite - 10))
      proposition = "Rattrapage";

    return {
      inscriptionId: ligne.inscriptionId,
      eleveId: ligne.eleveId,
      matricule: ligne.matricule,
      nomComplet: ligne.nomComplet,
      moyenne: ligne.moyenne,
      rang: ligne.rang,
      mention: ligne.mention,
      tauxCompletion: ligne.tauxCompletion,
      proposition,
    };
  });

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Délibération automatique"
      description="Décidez, validez et imprimez les résultats officiels du conseil de classe."
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.hero}>
          <div>
            <span>Conseil de classe numérique</span>
            <h2>Délibération académique Enterprise</h2>
            <p>
              Le système propose automatiquement une décision selon les
              résultats, tout en laissant au conseil de classe le contrôle final.
            </p>
          </div>
          <Gavel size={82} />
        </section>

        <section className={styles.filtres}>
          <form>
            <label>
              <span>Période</span>
              <select name="periodeId" defaultValue={periodeId || ""}>
                {periodes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom} — {element.anneeScolaire.libelle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Classe</span>
              <select name="classeId" defaultValue={classeId || ""}>
                {classes.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.nom} — {element.section.nom}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">
              <Scale size={18} />
              Ouvrir la délibération
            </button>
          </form>
        </section>

        <section className={styles.kpis}>
          <article>
            <Users />
            <div>
              <small>Élèves à délibérer</small>
              <strong>{lignes.length}</strong>
            </div>
          </article>
          <article>
            <ShieldCheck />
            <div>
              <small>Seuil de réussite</small>
              <strong>{seuilReussite.toFixed(0)}%</strong>
            </div>
          </article>
          <article>
            <Scale />
            <div>
              <small>Taux de réussite proposé</small>
              <strong>{synthese?.tauxReussite.toFixed(1) ?? "0.0"}%</strong>
            </div>
          </article>
          <article>
            <Gavel />
            <div>
              <small>Évaluations publiées</small>
              <strong>{synthese?.evaluationsPubliees ?? 0}</strong>
            </div>
          </article>
        </section>

        <DeliberationClient
          cleStockage={`ds-school-deliberation-${ecole.id}-${periodeId}-${classeId}`}
          ecoleNom={ecole.nom}
          classeNom={classe?.nom ?? "Classe"}
          sectionNom={classe?.section.nom ?? ""}
          periodeNom={periode?.nom ?? "Période"}
          anneeNom={periode?.anneeScolaire.libelle ?? ""}
          utilisateurNom={
            utilisateur.nom?.trim() || utilisateur.email
          }
          seuilReussite={seuilReussite}
          lignesInitiales={lignes}
        />
      </div>
    </AdminShell>
  );
}
