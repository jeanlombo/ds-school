import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { exigerPermission } from "@/lib/securite/rbac";
import AdminShell from "@/components/admin/AdminShell";
import SafeCampusNav from "@/components/safe-campus/SafeCampusNav";
import "./safe-campus.css";

export default async function Layout({ children }: { children: ReactNode }) {
  await exigerPermission("SAFE_CAMPUS_VOIR");
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  return <AdminShell utilisateur={utilisateur} titre="Safe Campus" description="Contrôle des présences par QR Code sécurisé."><div className="safe-campus"><SafeCampusNav />{children}</div></AdminShell>;
}
