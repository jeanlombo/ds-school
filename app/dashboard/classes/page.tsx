import { redirect } from "next/navigation";
import { DoorOpen, Power, School } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import styles from "@/components/admin/admin.module.css";
import { basculerClasse, creerClasse } from "./actions";

type Recherche = Promise<{ succes?: string; erreur?: string }>;

const messagesErreur: Record<string, string> = {
  champs: "Veuillez remplir le nom, le code et la section.",
  section: "La section sélectionnée est introuvable ou inactive.",
  doublon_nom: "Cette classe existe déjà dans la section sélectionnée.",
  doublon_code: "Ce code de classe existe déjà. Le système utilise automatiquement le code de la section pour éviter les conflits.",
  creation: "La classe n’a pas pu être créée. Vérifiez les informations et réessayez.",
  introuvable: "La classe demandée est introuvable.",
};

export default async function Classes({ searchParams }: { searchParams: Recherche }) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const query = await searchParams;

  const [sections, classes] = await Promise.all([
    prisma.section.findMany({
      where: { ecoleId: ecole.id, statut: "active" },
      orderBy: { nom: "asc" },
    }),
    prisma.classe.findMany({
      where: { ecoleId: ecole.id },
      include: { section: true },
      orderBy: [{ section: { nom: "asc" } }, { nom: "asc" }],
    }),
  ]);

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Classes"
      description="Créez les classes et rattachez-les aux sections de votre établissement."
    >
      {query.succes === "creation" && (
        <div className={styles.message}>La classe a été créée avec succès.</div>
      )}
      {query.succes === "statut" && (
        <div className={styles.message}>Le statut de la classe a été mis à jour.</div>
      )}
      {query.erreur && (
        <div className={styles.messageErreur}>
          {messagesErreur[query.erreur] || "Une erreur est survenue."}
        </div>
      )}

      <div className={styles.deuxColonnes}>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}>
            <div>
              <h2>Répertoire des classes</h2>
              <p>{classes.length} classe(s) enregistrée(s)</p>
            </div>
            <School size={22} />
          </div>

          {classes.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Classe</th>
                    <th>Section</th>
                    <th>Capacité</th>
                    <th>Titulaire / Local</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classe) => (
                    <tr key={classe.id}>
                      <td>
                        <strong>{classe.nom}</strong>
                        <br />
                        <small>
                          {classe.code}
                          {classe.niveau ? ` · ${classe.niveau}` : ""}
                        </small>
                      </td>
                      <td>{classe.section.nom}</td>
                      <td>{classe.capacite} élèves</td>
                      <td>
                        {classe.titulaire || "Non affecté"}
                        <br />
                        <small>{classe.local || "Local non défini"}</small>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            classe.statut !== "active" ? styles.badgeInactif : ""
                          }`}
                        >
                          {classe.statut === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <form action={basculerClasse}>
                          <input type="hidden" name="id" value={classe.id} />
                          <button
                            type="submit"
                            title={classe.statut === "active" ? "Désactiver" : "Réactiver"}
                            className={
                              classe.statut === "active"
                                ? styles.boutonDanger
                                : styles.boutonSecondaire
                            }
                          >
                            <Power size={15} />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.vide}>
              <DoorOpen size={38} />
              <p>Aucune classe n’est encore enregistrée.</p>
            </div>
          )}
        </section>

        <section className={styles.panneau}>
          <div className={styles.panneauEntete}>
            <div>
              <h2>Créer une classe</h2>
              <p>La classe sera disponible lors de l’inscription des élèves.</p>
            </div>
            <DoorOpen size={22} />
          </div>

          {sections.length > 0 ? (
            <form action={creerClasse} className={styles.panneauCorps}>
              <div className={styles.formGrille}>
                <div className={styles.champ}>
                  <label>Nom de la classe *</label>
                  <input name="nom" required placeholder="Ex. 1ère A" />
                </div>

                <div className={styles.champ}>
                  <label>Code *</label>
                  <input name="code" required placeholder="Ex. 1A, 6A, L1A..." />
                </div>

                <div className={`${styles.champ} ${styles.champLarge}`}>
                  <small style={{ color: "#64748b", lineHeight: 1.5 }}>
                    Le code de la section sera ajouté automatiquement pour éviter les doublons.
                    Exemple : PRIM-1A, SEC-1A, HUM-1A ou UNI-L1A.
                  </small>
                </div>

                <div className={`${styles.champ} ${styles.champLarge}`}>
                  <label>Section *</label>
                  <select name="sectionId" required defaultValue="">
                    <option value="" disabled>
                      Sélectionner une section
                    </option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.champ}>
                  <label>Niveau</label>
                  <input name="niveau" placeholder="Ex. 1ère année" />
                </div>

                <div className={styles.champ}>
                  <label>Capacité maximale</label>
                  <input name="capacite" type="number" min="1" defaultValue="40" />
                </div>

                <div className={styles.champ}>
                  <label>Titulaire</label>
                  <input name="titulaire" placeholder="Nom du titulaire" />
                </div>

                <div className={styles.champ}>
                  <label>Local</label>
                  <input name="local" placeholder="Ex. Bâtiment A - Salle 2" />
                </div>
              </div>

              <div className={styles.actions}>
                <BoutonSoumission texte="Créer la classe" />
              </div>
            </form>
          ) : (
            <div className={styles.vide}>
              <p>Créez d’abord une section active avant de créer une classe.</p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
