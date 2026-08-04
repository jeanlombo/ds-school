import AccueilClient from "@/components/vitrine/AccueilClient";
import { obtenirDonneesDashboardPublic } from "@/lib/vitrine/dashboard-public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PageAccueil() {
  const donnees =
    await obtenirDonneesDashboardPublic();

  return <AccueilClient donnees={donnees} />;
}
