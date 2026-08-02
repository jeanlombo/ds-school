import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import FormulaireMatiere from "../../FormulaireMatiere";
import { modifierMatiere } from "../../actions";
import styles from "../../matieres.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PageModifierMatiere({ params }: Props) {
  const { id } = await params;
  const identifiant = Number(id);

  if (!Number.isInteger(identifiant) || identifiant <= 0) {
    notFound();
  }

  const matiere = await prisma.matiere.findUnique({
    where: { id: identifiant },
  });

  if (!matiere) {
    notFound();
  }

  const action = modifierMatiere.bind(null, matiere.id);

  return (
    <div className={styles.page}>
      <div className={styles.enteteSousPage}>
        <Link href="/dashboard/matieres">
          <ArrowLeft size={18} /> Retour aux matières
        </Link>
        <h1>Modifier {matiere.nom}</h1>
        <p>Mettez à jour les informations académiques de cette matière.</p>
      </div>

      <FormulaireMatiere
        action={action}
        mode="modification"
        initiale={{
          code: matiere.code,
          nom: matiere.nom,
          description: matiere.description,
          departement: matiere.departement,
          coefficient: matiere.coefficient.toString(),
          volumeHoraireHebdomadaire: matiere.volumeHoraireHebdomadaire,
          couleur: matiere.couleur,
          statut: matiere.statut,
        }}
      />
    </div>
  );
}
