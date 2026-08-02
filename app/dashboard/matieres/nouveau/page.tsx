import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormulaireMatiere from "../FormulaireMatiere";
import { creerMatiere } from "../actions";
import styles from "../matieres.module.css";

export default function PageNouvelleMatiere() {
  return (
    <div className={styles.page}>
      <div className={styles.enteteSousPage}>
        <Link href="/dashboard/matieres">
          <ArrowLeft size={18} /> Retour aux matières
        </Link>
        <h1>Nouvelle matière</h1>
        <p>
          Ajoutez une matière qui pourra ensuite être affectée aux classes et
          aux enseignants.
        </p>
      </div>

      <FormulaireMatiere action={creerMatiere} />
    </div>
  );
}
