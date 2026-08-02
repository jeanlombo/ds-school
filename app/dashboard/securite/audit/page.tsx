import { redirect } from "next/navigation";
import { Search, ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "../RetourDashboard";
import styles from "../securite.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    module?: string;
    niveau?: string;
  }>;
};

type Audit = {
  utilisateur_nom: string | null;
  action: string;
  module: string;
  description: string | null;
  niveau: string;
  adresse_ip: string | null;
  created_at: Date;
};

export default async function PageAudit({ searchParams }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const module = String(params.module ?? "").trim();
  const niveau = String(params.niveau ?? "").trim();

  const audits = await prisma.$queryRaw<Audit[]>`
    SELECT
      utilisateur_nom,
      action,
      module,
      description,
      niveau,
      adresse_ip,
      created_at
    FROM journal_audit_securite
    WHERE ecole_id = ${ecole.id}
      AND (
        ${q} = ''
        OR utilisateur_nom LIKE CONCAT('%', ${q}, '%')
        OR action LIKE CONCAT('%', ${q}, '%')
        OR description LIKE CONCAT('%', ${q}, '%')
      )
      AND (${module} = '' OR module = ${module})
      AND (${niveau} = '' OR niveau = ${niveau})
    ORDER BY created_at DESC
    LIMIT 500
  `;

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Journal d’audit"
      description="Filtrez les actions par utilisateur, module et niveau de criticité."
    >
      <RetourDashboard />

      <section className={styles.panel}>
        <form className={styles.filtres}>
          <div className={styles.recherche}>
            <Search size={18}/>
            <input name="q" defaultValue={q} placeholder="Utilisateur, action ou description..." />
          </div>
          <input name="module" defaultValue={module} placeholder="Module" />
          <select name="niveau" defaultValue={niveau}>
            <option value="">Tous les niveaux</option>
            <option value="INFO">Information</option>
            <option value="IMPORTANT">Important</option>
            <option value="CRITIQUE">Critique</option>
          </select>
          <button type="submit">Filtrer</button>
        </form>
      </section>

      <section className={styles.journal}>
        {audits.map((audit, index) => (
          <article key={index}>
            <span className={audit.niveau === "CRITIQUE" ? styles.niveauCritique : styles.niveauInfo}>
              {audit.niveau}
            </span>
            <ScrollText size={21}/>
            <div>
              <strong>{audit.action}</strong>
              <p>{audit.description ?? "—"}</p>
              <small>
                {audit.utilisateur_nom ?? "Système"} · {audit.module} ·{" "}
                {new Date(audit.created_at).toLocaleString("fr-FR")} ·{" "}
                {audit.adresse_ip ?? "IP inconnue"}
              </small>
            </div>
          </article>
        ))}

        {!audits.length && <div className={styles.vide}>Aucune action trouvée.</div>}
      </section>
    </AdminShell>
  );
}
