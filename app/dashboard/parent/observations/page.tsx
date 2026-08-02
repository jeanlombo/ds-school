import { MessageSquareText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigerEnfantDuParent } from "@/lib/parent-portail";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../parent.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ eleveId?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const eleveId = Number(params.eleveId ?? 0);
  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_communication"
  );

  const observations =
    await prisma.observationEleve.findMany({
      where: { eleveId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre="Observations scolaires"
      description="Observations pédagogiques et disciplinaires communiquées."
    >
      <section className={styles.panel}>
        <div className={styles.listeObservations}>
          {observations.map((observation) => (
            <article key={observation.id}>
              <MessageSquareText size={20} />
              <div>
                <p>{observation.contenu}</p>
                <small>
                  {observation.auteur ?? "Établissement"} ·{" "}
                  {observation.createdAt.toLocaleString("fr-FR")}
                </small>
              </div>
            </article>
          ))}

          {!observations.length && (
            <div className={styles.vide}>
              Aucune observation communiquée.
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
