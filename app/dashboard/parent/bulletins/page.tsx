import Link from "next/link";
import { FileText, Printer, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigerEnfantDuParent } from "@/lib/parent-portail";
import { calculerResultats } from "@/app/dashboard/centre-academique/resultats/calculs";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../parent.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    eleveId?: string;
    periodeId?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const eleveId = Number(params.eleveId ?? 0);
  const periodeId = Number(params.periodeId ?? 0);

  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_academique"
  );

  const inscription = await prisma.inscription.findFirst({
    where: {
      eleveId,
      statut: { in: ["inscrit", "admis", "promu", "redouble"] },
      classe: { ecoleId: contexte.ecoleId },
    },
    include: {
      classe: true,
      anneeScolaire: true,
      eleve: true,
    },
    orderBy: { id: "desc" },
  });

  const periodes = inscription
    ? await prisma.periodeAcademique.findMany({
        where: {
          anneeScolaireId: inscription.anneeScolaireId,
        },
        orderBy: { ordre: "asc" },
      })
    : [];

  const synthese =
    inscription && periodeId
      ? await calculerResultats(
          contexte.ecoleId,
          inscription.classeId,
          periodeId
        )
      : null;

  const ligne = synthese?.lignes.find(
    (item) => item.inscriptionId === inscription?.id
  );

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre="Bulletins scolaires"
      description="Bulletins publiés et autorisés pour votre enfant."
    >
      <section className={styles.panel}>
        <form method="get" className={styles.filtres}>
          <input type="hidden" name="eleveId" value={eleveId} />
          <label>
            <span>Période académique</span>
            <select
              name="periodeId"
              required
              defaultValue={periodeId || ""}
            >
              <option value="">Sélectionner</option>
              {periodes.map((periode) => (
                <option key={periode.id} value={periode.id}>
                  {periode.nom}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">
            <Search size={17} />
            Afficher
          </button>
        </form>
      </section>

      {ligne && inscription ? (
        <section className={styles.panel}>
          <div className={styles.infos}>
            <div><small>Élève</small><strong>{ligne.nomComplet}</strong></div>
            <div><small>Moyenne</small><strong>{ligne.moyenne.toFixed(2)} %</strong></div>
            <div><small>Rang</small><strong>#{ligne.rang}</strong></div>
            <div><small>Mention</small><strong>{ligne.mention}</strong></div>
          </div>

          <Link
            className={styles.boutonPrincipal}
            href={`/dashboard/centre-academique/bulletins/${inscription.id}?classeId=${inscription.classeId}&periodeId=${periodeId}`}
          >
            <Printer size={17} />
            Ouvrir et imprimer le bulletin
          </Link>
        </section>
      ) : periodeId ? (
        <div className={styles.vide}>
          <FileText size={42} />
          Aucun bulletin publié pour cette période.
        </div>
      ) : null}
    </AdminShell>
  );
}
