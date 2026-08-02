import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarCheck,
  CircleDollarSign,
  FileText,
  MessageSquareText,
  ReceiptText,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigerEnfantDuParent } from "@/lib/parent-portail";
import AdminShell from "@/components/admin/AdminShell";
import styles from "../../parent.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ eleveId: string }>;
};

export default async function Page({ params }: Props) {
  const { eleveId: valeur } = await params;
  const eleveId = Number(valeur);
  if (!Number.isInteger(eleveId)) notFound();

  const contexte = await exigerEnfantDuParent(
    eleveId,
    "autorise_academique"
  );

  const eleve = await prisma.eleve.findFirst({
    where: {
      id: eleveId,
      ecoleId: contexte.ecoleId,
    },
    include: {
      inscriptions: {
        include: {
          classe: true,
          anneeScolaire: true,
        },
        orderBy: { id: "desc" },
        take: 1,
      },
    },
  });

  if (!eleve) notFound();

  const inscription = eleve.inscriptions[0];

  return (
    <AdminShell
      utilisateur={contexte.utilisateur}
      titre={`${eleve.nom} ${eleve.postnom ?? ""} ${eleve.prenom}`}
      description="Vue synthétique de l’enfant."
    >
      <section className={styles.panel}>
        <h2>Informations scolaires</h2>
        <div className={styles.infos}>
          <div><small>Matricule</small><strong>{eleve.matricule}</strong></div>
          <div><small>Classe</small><strong>{inscription?.classe.nom ?? "—"}</strong></div>
          <div><small>Année</small><strong>{inscription?.anneeScolaire.libelle ?? "—"}</strong></div>
          <div><small>Statut</small><strong>{inscription?.statut ?? "—"}</strong></div>
        </div>
      </section>

      <section className={styles.grilleModules}>
        <Link href={`/dashboard/parent/paiements?eleveId=${eleveId}`}>
          <CircleDollarSign />
          <h3>Paiements</h3>
        </Link>
        <Link href={`/dashboard/parent/recus?eleveId=${eleveId}`}>
          <ReceiptText />
          <h3>Reçus</h3>
        </Link>
        <Link href={`/dashboard/parent/bulletins?eleveId=${eleveId}`}>
          <FileText />
          <h3>Bulletins</h3>
        </Link>
        <Link href={`/dashboard/parent/presences?eleveId=${eleveId}`}>
          <CalendarCheck />
          <h3>Présences</h3>
        </Link>
        <Link href={`/dashboard/parent/observations?eleveId=${eleveId}`}>
          <MessageSquareText />
          <h3>Observations</h3>
        </Link>
      </section>
    </AdminShell>
  );
}
