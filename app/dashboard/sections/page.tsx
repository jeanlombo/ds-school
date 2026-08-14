import { redirect } from "next/navigation";
import { BookOpenCheck, Layers3, Power } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import {
  terminologieNeutre,
  terminologieSection,
} from "@/lib/terminologie-academique";
import AdminShell from "@/components/admin/AdminShell";
import BoutonSoumission from "@/components/admin/BoutonSoumission";
import styles from "@/components/admin/admin.module.css";
import { basculerSection, creerSection } from "./actions";

type Props = {
  searchParams: Promise<{ succes?: string; erreur?: string }>;
};

const messagesErreur: Record<string, string> = {
  champs: "Veuillez renseigner le nom et le code.",
  doublon: "Une structure portant ce nom ou ce code existe déjà.",
  creation: "La structure académique n’a pas pu être créée.",
  introuvable: "La structure demandée est introuvable.",
};

export default async function Sections({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const neutre = terminologieNeutre();

  const sections = await prisma.section.findMany({
    where: { ecoleId: ecole.id },
    include: {
      _count: {
        select: { classes: true },
      },
    },
    orderBy: { nom: "asc" },
  });

  const query = await searchParams;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Structures académiques"
      description="Organisez les cycles, sections, facultés, départements et filières de votre établissement."
    >
      {query.succes && (
        <div className={styles.message}>
          La structure académique a été ajoutée avec succès.
        </div>
      )}

      {query.erreur && (
        <div className={styles.infoBandeau}>
          {messagesErreur[query.erreur] || query.erreur}
        </div>
      )}

      <div className={styles.deuxColonnes}>
        <section className={styles.panneau}>
          <div className={styles.panneauEntete}>
            <div>
              <h2>Répertoire des structures</h2>
              <p>{sections.length} structure(s) configurée(s)</p>
            </div>
            <Layers3 size={22} />
          </div>

          {sections.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Structure</th>
                    <th>Code</th>
                    <th>Cycle détecté</th>
                    <th>{neutre.structureMaj}s</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {sections.map((s) => {
                    const t = terminologieSection(s.nom);

                    return (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.nom}</strong>
                          <br />
                          <small>{s.description || "—"}</small>
                        </td>

                        <td>{s.code}</td>

                        <td>
                          <strong>
                            {t.type === "superieur"
                              ? "Enseignement supérieur"
                              : "Enseignement scolaire"}
                          </strong>
                          <br />
                          <small>
                            {t.personnePlurielMaj} · {t.structurePluriel}
                          </small>
                        </td>

                        <td>{s._count.classes}</td>

                        <td>
                          <span
                            className={`${styles.badge} ${
                              s.statut !== "active"
                                ? styles.badgeInactif
                                : ""
                            }`}
                          >
                            {s.statut}
                          </span>
                        </td>

                        <td>
                          <form action={basculerSection}>
                            <input type="hidden" name="id" value={s.id} />
                            <input
                              type="hidden"
                              name="statut"
                              value={s.statut}
                            />
                            <button
                              className={
                                s.statut === "active"
                                  ? styles.boutonDanger
                                  : styles.boutonSecondaire
                              }
                              title={
                                s.statut === "active"
                                  ? "Désactiver"
                                  : "Réactiver"
                              }
                            >
                              <Power size={15} />
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.vide}>
              <Layers3 size={38} />
              <p>Aucune structure académique disponible.</p>
            </div>
          )}
        </section>

        <section className={styles.panneau}>
          <div className={styles.panneauEntete}>
            <div>
              <h2>Ajouter une structure</h2>
              <p>
                Ex. Primaire, Secondaire, Humanités, Université, Institut supérieur.
              </p>
            </div>
            <BookOpenCheck size={22} />
          </div>

          <form action={creerSection} className={styles.panneauCorps}>
            <div className={styles.formGrille}>
              <div className={styles.champ}>
                <label>Nom *</label>
                <input
                  name="nom"
                  required
                  placeholder="Ex. Université"
                />
              </div>

              <div className={styles.champ}>
                <label>Code *</label>
                <input
                  name="code"
                  required
                  placeholder="Ex. UNIV"
                />
              </div>

              <div className={`${styles.champ} ${styles.champLarge}`}>
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Description facultative"
                />
              </div>
            </div>

            <div className={styles.actions}>
              <BoutonSoumission texte="Ajouter la structure" />
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
