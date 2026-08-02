import { redirect } from "next/navigation";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";

export default async function DiagnosticAcces() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const permissions = utilisateur.permissions ?? [];

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Diagnostic des accès"
      description="Permissions réellement chargées dans la session."
    >
      <section style={{ padding: 20, border: "1px solid #dbe7f3", borderRadius: 18, background: "#fff" }}>
        <h2>{utilisateur.nom}</h2>
        <p>Rôle : <strong>{utilisateur.role}</strong></p>
        <p>Super Administrateur : <strong>{utilisateur.superAdministrateur ? "Oui" : "Non"}</strong></p>
        <h3>Permissions effectives</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {permissions.length ? permissions.join("\n") : "AUCUNE PERMISSION"}
        </pre>
      </section>
    </AdminShell>
  );
}
