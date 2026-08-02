import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import styles from "../securite.module.css";

export default async function PageProfils() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Profils de sécurité"
      description="Modèles réutilisables de rôles et permissions."
    >
      <RetourDashboard />

      <section className={styles.panel}>
        <div className={styles.vide}>
          <ShieldCheck size={48}/>
          <h2>Profils prêts pour la phase suivante</h2>
          <p>
            Les profils Comptable, Enseignant, Direction, Parent et Lecture seule
            seront construits sur le moteur de rôles et permissions déjà installé.
          </p>
        </div>
      </section>
    </AdminShell>
  );
}
