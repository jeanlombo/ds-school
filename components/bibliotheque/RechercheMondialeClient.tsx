"use client";

import {
  BookOpen,
  ExternalLink,
  Globe2,
  LibraryBig,
  LoaderCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import styles from "./recherche-mondiale.module.css";

type Source = "INTERNE" | "OPEN_LIBRARY" | "GUTENBERG";

type Resultat = {
  id: string;
  source: Source;
  titre: string;
  auteurs: string[];
  annee: number | null;
  langues: string[];
  couverture: string | null;
  lien: string;
  format: string;
  lectureDisponible: boolean;
  licence: string;
  description?: string | null;
};

type ReponseRecherche = {
  ok: boolean;
  total?: number;
  resultats?: Resultat[];
  erreurs?: string[];
  message?: string;
};

const LIBELLES_SOURCE: Record<Source, string> = {
  INTERNE: "École",
  OPEN_LIBRARY: "Open Library",
  GUTENBERG: "Project Gutenberg",
};

export default function RechercheMondialeClient() {
  const [recherche, setRecherche] = useState("");
  const [source, setSource] = useState("TOUTES");
  const [langue, setLangue] = useState("fr");
  const [chargement, setChargement] = useState(false);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();

    const terme = recherche.trim();
    if (terme.length < 2) {
      setMessage("Saisissez au moins deux caractères.");
      return;
    }

    setChargement(true);
    setMessage("");
    setErreurs([]);

    try {
      const parametres = new URLSearchParams({
        q: terme,
        source,
        langue,
      });

      const reponse = await fetch(
        `/api/bibliotheque/recherche-mondiale?${parametres.toString()}`,
        { method: "GET" }
      );

      const donnees = (await reponse.json()) as ReponseRecherche;

      if (!reponse.ok || !donnees.ok) {
        throw new Error(
          donnees.message || "La recherche n’a pas pu être exécutée."
        );
      }

      setResultats(donnees.resultats ?? []);
      setErreurs(donnees.erreurs ?? []);
      setRechercheEffectuee(true);
    } catch (erreur) {
      setResultats([]);
      setRechercheEffectuee(true);
      setMessage(
        erreur instanceof Error
          ? erreur.message
          : "Une erreur inattendue est survenue."
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <>
      <section className={styles.rechercheHero}>
        <div>
          <span><Globe2 size={16} /> CATALOGUES OUVERTS ET SCOLAIRES</span>
          <h2>Rechercher un livre dans plusieurs bibliothèques</h2>
          <p>
            Cherchez dans le catalogue de l’école, Open Library et Project
            Gutenberg. DS School indique clairement la source et les
            conditions de lecture de chaque ressource.
          </p>
        </div>
        <LibraryBig size={72} />
      </section>

      <form className={styles.formulaire} onSubmit={soumettre}>
        <label className={styles.champRecherche}>
          <Search size={20} />
          <input
            value={recherche}
            onChange={(evenement) => setRecherche(evenement.target.value)}
            placeholder="Titre, auteur, matière ou mot-clé..."
            autoFocus
          />
        </label>

        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="TOUTES">Toutes les sources</option>
          <option value="INTERNE">Catalogue de l’école</option>
          <option value="OPEN_LIBRARY">Open Library</option>
          <option value="GUTENBERG">Project Gutenberg</option>
        </select>

        <select value={langue} onChange={(e) => setLangue(e.target.value)}>
          <option value="fr">Français préféré</option>
          <option value="en">Anglais préféré</option>
          <option value="sw">Swahili préféré</option>
        </select>

        <button type="submit" disabled={chargement}>
          {chargement ? (
            <><LoaderCircle className={styles.rotation} size={18} /> Recherche...</>
          ) : (
            <><Search size={18} /> Rechercher</>
          )}
        </button>
      </form>

      <section className={styles.sourcesOuvertes}>
        <article>
          <span><BookOpen /></span>
          <div>
            <strong>African Storybook</strong>
            <p>
              Livres illustrés ouverts dans de nombreuses langues africaines,
              avec lecture, téléchargement et impression proposés par la source.
            </p>
          </div>
          <a href="https://www.africanstorybook.org/" target="_blank" rel="noreferrer">
            Explorer <ExternalLink size={16} />
          </a>
        </article>
        <div className={styles.noteLicence}>
          <ShieldCheck size={18} />
          Les ouvrages externes restent hébergés par leurs plateformes. DS School
          ne copie pas automatiquement les livres protégés.
        </div>
      </section>

      {message && <div className={styles.erreur}>{message}</div>}

      {erreurs.length > 0 && (
        <div className={styles.avertissement}>
          Certains catalogues n’ont pas répondu : {erreurs.join(", ")}.
          Les autres résultats restent disponibles.
        </div>
      )}

      {rechercheEffectuee && (
        <div className={styles.enteteResultats}>
          <div>
            <span>RÉSULTATS</span>
            <h3>{resultats.length} ressource(s) trouvée(s)</h3>
          </div>
        </div>
      )}

      <section className={styles.grille}>
        {resultats.map((resultat) => {
          const lienInterne = resultat.lien.startsWith("/");

          return (
            <article className={styles.carte} key={resultat.id}>
              <div className={styles.couverture}>
                {resultat.couverture ? (
                  <img src={resultat.couverture} alt={`Couverture de ${resultat.titre}`} />
                ) : (
                  <BookOpen size={42} />
                )}
              </div>

              <div className={styles.contenu}>
                <div className={styles.badges}>
                  <span data-source={resultat.source}>
                    {LIBELLES_SOURCE[resultat.source]}
                  </span>
                  {resultat.lectureDisponible && <em>Lecture disponible</em>}
                </div>

                <h3>{resultat.titre}</h3>
                <p className={styles.auteur}>
                  {resultat.auteurs.length
                    ? resultat.auteurs.join(", ")
                    : "Auteur non renseigné"}
                  {resultat.annee ? ` · ${resultat.annee}` : ""}
                </p>

                {resultat.description && (
                  <p className={styles.description}>{resultat.description}</p>
                )}

                <dl>
                  <div><dt>Format</dt><dd>{resultat.format}</dd></div>
                  <div><dt>Licence</dt><dd>{resultat.licence}</dd></div>
                </dl>

                <a
                  href={resultat.lien}
                  target={lienInterne ? undefined : "_blank"}
                  rel={lienInterne ? undefined : "noreferrer"}
                >
                  {resultat.source === "GUTENBERG"
                    ? "Lire gratuitement"
                    : resultat.source === "INTERNE"
                      ? "Ouvrir la ressource"
                      : resultat.lectureDisponible
                        ? "Lire / consulter"
                        : "Voir la fiche"}
                  <ExternalLink size={16} />
                </a>
              </div>
            </article>
          );
        })}
      </section>

      {rechercheEffectuee && !resultats.length && !message && (
        <div className={styles.vide}>
          <BookOpen size={44} />
          <h3>Aucun résultat trouvé</h3>
          <p>Essayez un autre titre, auteur, matière ou mot-clé.</p>
        </div>
      )}
    </>
  );
}
