import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  KeyRound,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import AdminShell from "@/components/admin/AdminShell";
import RetourDashboard from "./RetourDashboard";
import styles from "./securite.module.css";

export const dynamic = "force-dynamic";

export default async function PageSecurite() {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();

  const [
    utilisateurs,
    actifs,
    roles,
    permissions,
    sessions,
    audits,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecole.id}
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM utilisateurs_securite
      WHERE ecole_id = ${ecole.id}
        AND statut = 'ACTIF'
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM roles_securite
      WHERE ecole_id = ${ecole.id}
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM permissions_securite
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM sessions_securite
      WHERE ecole_id = ${ecole.id}
        AND statut = 'ACTIVE'
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM journal_audit_securite
      WHERE ecole_id = ${ecole.id}
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `,
  ]);

  const cartes = [
    {
      href: "/dashboard/securite/utilisateurs",
      titre: "Utilisateurs",
      description: "Créer, activer, désactiver et gérer les comptes.",
      icon: UsersRound,
    },
    {
      href: "/dashboard/securite/roles",
      titre: "Rôles",
      description: "Créer des rôles entièrement personnalisables.",
      icon: UserCog,
    },
    {
      href: "/dashboard/securite/permissions",
      titre: "Permissions",
      description: "Contrôler chaque module et chaque action.",
      icon: KeyRound,
    },
    {
      href: "/dashboard/securite/profils",
      titre: "Profils",
      description: "Modèles de sécurité réutilisables.",
      icon: ShieldCheck,
    },
    {
      href: "/dashboard/securite/sessions",
      titre: "Sessions actives",
      description: "Voir et fermer les connexions à distance.",
      icon: Activity,
    },
    {
      href: "/dashboard/securite/audit",
      titre: "Journal d’audit",
      description: "Tracer toutes les actions sensibles.",
      icon: ScrollText,
    },
  ];

  return (
    <AdminShell
      utilisateur={utilisateur}
      titre="Centre de Sécurité"
      description="Utilisateurs, rôles, permissions, sessions et audit Enterprise."
    >
      <RetourDashboard />

      <section className={styles.hero}>
        <div>
          <span>DS SCHOOL SECURITY CENTER</span>
          <h2>Contrôlez précisément qui peut voir et faire quoi</h2>
          <p>
            Le Centre de Sécurité devient le noyau de gouvernance de tous les
            modules académiques, financiers et administratifs.
          </p>
        </div>
        <LockKeyhole size={84} />
      </section>

      <section className={styles.stats}>
        <article><UsersRound /><div><small>Utilisateurs</small><strong>{Number(utilisateurs[0]?.total ?? 0)}</strong></div></article>
        <article><ShieldCheck /><div><small>Comptes actifs</small><strong>{Number(actifs[0]?.total ?? 0)}</strong></div></article>
        <article><UserCog /><div><small>Rôles</small><strong>{Number(roles[0]?.total ?? 0)}</strong></div></article>
        <article><KeyRound /><div><small>Permissions</small><strong>{Number(permissions[0]?.total ?? 0)}</strong></div></article>
        <article><Activity /><div><small>Sessions actives</small><strong>{Number(sessions[0]?.total ?? 0)}</strong></div></article>
        <article><ScrollText /><div><small>Actions 24h</small><strong>{Number(audits[0]?.total ?? 0)}</strong></div></article>
      </section>

      <section className={styles.cartes}>
        {cartes.map(({ href, titre, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Icon size={30} />
            <h3>{titre}</h3>
            <p>{description}</p>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
