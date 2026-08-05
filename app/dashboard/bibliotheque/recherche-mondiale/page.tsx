import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import RechercheMondialeClient from "@/components/bibliotheque/RechercheMondialeClient";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { exigerPermission } from "@/lib/securite/rbac";

export const dynamic = "force-dynamic";

export default async function Page() {
  await exigerPermission("BIBLIOTHEQUE_RESSOURCES_VOIR");

  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Recherche mondiale"
      description="Trouvez des livres dans le catalogue de l’école et dans des bibliothèques ouvertes."
    >
      <RechercheMondialeClient />
    </AdminShell>
  );
}
