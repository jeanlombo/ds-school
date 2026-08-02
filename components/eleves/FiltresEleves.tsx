"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Printer, RotateCcw, Search } from "lucide-react";
import styles from "./eleves.module.css";

type Option = { id: number; nom: string; sectionId?: number };
type Props = {
  classes: Option[];
  sections: Option[];
  valeurs: {
    q: string;
    classe: string;
    section: string;
    sexe: string;
    statut: string;
    tri: string;
    parPage: string;
  };
};

export default function FiltresEleves({ classes, sections, valeurs }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [recherche, setRecherche] = useState(valeurs.q);
  const premierRendu = useRef(true);

  const appliquer = (cle: string, valeur: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (valeur) params.set(cle, valeur);
    else params.delete(cle);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const minuteur = window.setTimeout(() => appliquer("q", recherche.trim()), 450);
    return () => window.clearTimeout(minuteur);
    // La recherche est volontairement déclenchée uniquement lors de la saisie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const reinitialiser = () => {
    setRecherche("");
    router.replace(pathname, { scroll: false });
  };

  const classesVisibles = valeurs.section
    ? classes.filter((classe) => String(classe.sectionId) === valeurs.section)
    : classes;

  return (
    <div className={styles.zoneFiltresPremium}>
      <div className={styles.ligneFiltresPrincipale}>
        <label className={styles.recherchePremium}>
          <Search size={18} />
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Recherche instantanée : nom, prénom, matricule…"
          />
          {recherche && <button type="button" onClick={() => setRecherche("")} aria-label="Effacer">×</button>}
        </label>
        <button type="button" className={styles.boutonImpression} onClick={() => window.print()}>
          <Printer size={17} /> Imprimer
        </button>
      </div>

      <div className={styles.filtresAvances}>
        <span className={styles.libelleFiltres}><Filter size={16} /> Filtres</span>
        <select value={valeurs.section} onChange={(e) => appliquer("section", e.target.value)}>
          <option value="">Toutes les sections</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.nom}</option>)}
        </select>
        <select value={valeurs.classe} onChange={(e) => appliquer("classe", e.target.value)}>
          <option value="">Toutes les classes</option>
          {classesVisibles.map((classe) => <option key={classe.id} value={classe.id}>{classe.nom}</option>)}
        </select>
        <select value={valeurs.sexe} onChange={(e) => appliquer("sexe", e.target.value)}>
          <option value="">Tous les sexes</option>
          <option value="M">Garçons</option>
          <option value="F">Filles</option>
        </select>
        <select value={valeurs.statut} onChange={(e) => appliquer("statut", e.target.value)}>
          <option value="actif">Élèves actifs</option>
          <option value="archive">Élèves archivés</option>
          <option value="">Tous les statuts</option>
        </select>
        <select value={valeurs.tri} onChange={(e) => appliquer("tri", e.target.value)}>
          <option value="nom-asc">Nom A → Z</option>
          <option value="nom-desc">Nom Z → A</option>
          <option value="recent">Plus récents</option>
          <option value="ancien">Plus anciens</option>
          <option value="matricule">Matricule</option>
        </select>
        <select value={valeurs.parPage} onChange={(e) => appliquer("parPage", e.target.value)}>
          <option value="10">10 par page</option>
          <option value="20">20 par page</option>
          <option value="50">50 par page</option>
          <option value="100">100 par page</option>
        </select>
        <button type="button" className={styles.reinitialiserFiltres} onClick={reinitialiser}>
          <RotateCcw size={15} /> Réinitialiser
        </button>
      </div>
    </div>
  );
}
