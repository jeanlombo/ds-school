import { redirect } from "next/navigation";
import { Award, FilePlus2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../../RetourDashboard";
import { creerDocument } from "../actions";
import styles from "../documents.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ classeId?: string; anneeId?: string; erreur?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const q = await searchParams;

  const [annees, classes] = await Promise.all([
    prisma.anneeScolaire.findMany({
      where: { ecoleId: ecole.id },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.classe.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      include: { section: true },
      orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }],
    }),
  ]);

  const anneeId =
    Number(q.anneeId ?? 0) ||
    annees.find((annee) => annee.active)?.id ||
    annees[0]?.id ||
    0;
  const classeId = Number(q.classeId ?? 0) || classes[0]?.id || 0;

  const inscriptions = await prisma.inscription.findMany({
    where: {
      anneeScolaireId: anneeId,
      classeId,
      statut: { in: ["inscrit", "promu", "redouble"] },
      eleve: { ecoleId: ecole.id },
    },
    include: { eleve: true },
    orderBy: [{ eleve: { nom: "asc" } }, { eleve: { prenom: "asc" } }],
  });

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Nouveau document académique"
      description="Créez un diplôme, un certificat ou une attestation sécurisée."
    >
      <div className={styles.page}>
        <RetourDashboard />

        <section className={styles.heroMini}>
          <div>
            <span>Délivrance officielle</span>
            <h2>Nouveau diplôme ou certificat</h2>
            <p>
              Sélectionnez l’élève et le type de document. Le numéro et le code
              de vérification seront générés automatiquement.
            </p>
          </div>
          <FilePlus2 size={72} />
        </section>

        {q.erreur && (
          <div className={styles.erreur}>Veuillez compléter les champs obligatoires.</div>
        )}

        <section className={styles.panel}>
          <form className={styles.selection}>
            <label>
              <span>Année scolaire</span>
              <select name="anneeId" defaultValue={anneeId}>
                {annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.libelle}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Classe</span>
              <select name="classeId" defaultValue={classeId}>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} — {classe.section.nom}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Afficher les élèves</button>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>Formulaire sécurisé</span>
              <h3>Informations du document</h3>
            </div>
            <Award />
          </div>

          <form action={creerDocument} className={styles.formulaire}>
            <label className={styles.large}>
              <span>Élève *</span>
              <select name="inscriptionId" required defaultValue="">
                <option value="" disabled>Sélectionner un élève</option>
                {inscriptions.map((inscription) => (
                  <option key={inscription.id} value={inscription.id}>
                    {inscription.eleve.matricule} — {inscription.eleve.nom}{" "}
                    {inscription.eleve.postnom ?? ""} {inscription.eleve.prenom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Type de document *</span>
              <select name="type" required defaultValue="CERTIFICAT_REUSSITE">
                <option value="DIPLOME_FIN_ETUDES">Diplôme de fin d’études</option>
                <option value="CERTIFICAT_REUSSITE">Certificat de réussite</option>
                <option value="ATTESTATION_SCOLARITE">Attestation de scolarité</option>
                <option value="ATTESTATION_FREQUENTATION">Attestation de fréquentation</option>
                <option value="ATTESTATION_BONNE_CONDUITE">Attestation de bonne conduite</option>
                <option value="ATTESTATION_TRANSFERT">Attestation de transfert</option>
              </select>
            </label>

            <label>
              <span>Mention</span>
              <input name="mention" placeholder="Ex. Très bien" />
            </label>

            <label>
              <span>Session</span>
              <input name="session" placeholder="Ex. Session ordinaire" />
            </label>

            <label>
              <span>Signataire</span>
              <input
                name="signataire"
                defaultValue={ecole.directeur ?? utilisateur.nom}
                placeholder="Directeur / Chef d’établissement"
              />
            </label>

            <label className={styles.large}>
              <span>Motif ou précision</span>
              <textarea
                name="motif"
                rows={4}
                placeholder="Précision facultative à afficher sur le document"
              />
            </label>

            <div className={styles.formActions}>
              <button type="submit">
                <FilePlus2 size={18} /> Générer le document
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
