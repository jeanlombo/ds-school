import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import RetourDashboard from "../RetourDashboard";
import DesignerClient from "./DesignerClient";
import styles from "./document-designer.module.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const modeles = await prisma.modeleBulletin.findMany({
    where: { ecoleId: ecole.id },
    orderBy: [{ parDefaut: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      nom: true,
      niveau: true,
      formatPapier: true,
      orientation: true,
      couleurPrincipale: true,
      actif: true,
      parDefaut: true,
      version: true,
    },
  });

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Document Designer Enterprise"
      description="Personnalisez visuellement les bulletins sans modifier le code."
    >
      <div className={styles.page}>
        <RetourDashboard />
        <DesignerClient modeles={modeles} />
      </div>
    </AdminShell>
  );
}
