"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CalendarClock,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  ContactRound,
  FileBarChart,
  FileBadge2,
  GraduationCap,
  HandCoins,
  Landmark,
  LayoutDashboard,
  LibraryBig,
  ListTree,
  LogOut,
  Menu,
  ReceiptText,
  ScanLine,
  School,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
  UserRoundCog,
  CalendarCheck2,
  UsersRound,
  Presentation,
  WalletCards,
  X,
} from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import styles from "./admin.module.css";

type UtilisateurAdmin = {
  nom: string;
  role: string;
  permissions?: string[];
  superAdministrateur?: boolean;
};

type Props = {
  utilisateur: UtilisateurAdmin;
  titre: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

type LienMenu = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: string;
};

const liens: LienMenu[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    permission: "DASHBOARD_VOIR",
  },
  {
    href: "/dashboard/annees-scolaires",
    label: "Années scolaires",
    icon: CalendarDays,
    permission: "ANNEES_SCOLAIRES_VOIR",
  },
  {
    href: "/dashboard/sections",
    label: "Sections",
    icon: BookOpenCheck,
    permission: "SECTIONS_VOIR",
  },
  {
    href: "/dashboard/classes",
    label: "Classes",
    icon: School,
    permission: "CLASSES_VOIR",
  },
  {
    href: "/dashboard/eleves",
    label: "Élèves",
    icon: UsersRound,
    permission: "ELEVES_VOIR",
  },
  {
    href: "/dashboard/parents",
    label: "Parents",
    icon: UserRoundCog,
    permission: "PARENTS_VOIR",
  },
  {
    href: "/dashboard/enseignants",
    label: "Enseignants",
    icon: UserRoundCheck,
    permission: "ENSEIGNANTS_VOIR",
  },
  {
    href: "/dashboard/matieres",
    label: "Matières",
    icon: BookOpen,
    permission: "MATIERES_VOIR",
  },
  {
    href: "/dashboard/parametres-academiques",
    label: "Paramètres académiques",
    icon: SlidersHorizontal,
    permission: "PARAMETRES_ACADEMIQUES_VOIR",
  },
  {
    href: "/dashboard/emploi-du-temps",
    label: "Emploi du temps",
    icon: CalendarClock,
    permission: "EMPLOI_DU_TEMPS_VOIR",
  },
  {
    href: "/dashboard/salles",
    label: "Salles",
    icon: Building2,
    permission: "SALLES_VOIR",
  },
  {
    href: "/dashboard/disponibilites-enseignants",
    label: "Disponibilités enseignants",
    icon: CalendarCheck2,
    permission: "DISPONIBILITES_ENSEIGNANTS_VOIR",
  },
  {
    href: "/dashboard/centre-academique",
    label: "Centre académique",
    icon: LibraryBig,
    permission: "ACADEMIQUE_VOIR",
  },
  {
    href: "/dashboard/centre-academique/documents",
    label: "Documents sécurisés",
    icon: FileBadge2,
    permission: "DOCUMENTS_ACADEMIQUES_VOIR",
  },
  {
    href: "/dashboard/titulaire",
    label: "Espace titulaire",
    icon: Presentation,
    permission: "TITULAIRE_ESPACE_VOIR",
  },
  {
    href: "/dashboard/titulaires",
    label: "Affectation titulaires",
    icon: UserRoundCheck,
    permission: "TITULAIRES_GERER",
  },

  {
    href: "/dashboard/crm",
    label: "CRM scolaire",
    icon: ContactRound,
    permission: "CRM_VOIR",
  },
  {
    href: "/dashboard/safe-campus",
    label: "Safe Campus",
    icon: ScanLine,
    permission: "SAFE_CAMPUS_VOIR",
  },

  /*
   * MODULE FINANCES
   *
   * FINANCES_VOIR affiche le tableau de bord général Finances.
   * Chaque sous-module possède ensuite sa propre permission.
   */
  {
    href: "/dashboard/finances",
    label: "Finances",
    icon: ChartNoAxesCombined,
    permission: "FINANCES_VOIR",
  },
  {
    href: "/dashboard/finances/categories-frais",
    label: "Catégories des frais",
    icon: ListTree,
    permission: "FINANCES_CATEGORIES_VOIR",
  },
  {
    href: "/dashboard/finances/frais-scolaires",
    label: "Frais scolaires",
    icon: WalletCards,
    permission: "FINANCES_FRAIS_VOIR",
  },
  {
    href: "/dashboard/finances/paiements",
    label: "Paiements scolaires",
    icon: CircleDollarSign,
    permission: "FINANCES_PAIEMENTS_VOIR",
  },
  {
    href: "/dashboard/finances/recus",
    label: "Reçus",
    icon: ReceiptText,
    permission: "FINANCES_RECUS_VOIR",
  },
  {
    href: "/dashboard/finances/caisse",
    label: "Caisse scolaire",
    icon: Landmark,
    permission: "FINANCES_CAISSE_VOIR",
  },
  {
    href: "/dashboard/finances/echeanciers",
    label: "Échéanciers",
    icon: HandCoins,
    permission: "FINANCES_ECHEANCIERS_VOIR",
  },
  {
    href: "/dashboard/finances/bourses-remises",
    label: "Bourses et remises",
    icon: BadgePercent,
    permission: "FINANCES_BOURSES_REMISES_VOIR",
  },
  {
    href: "/dashboard/finances/rapports",
    label: "Rapports financiers",
    icon: FileBarChart,
    permission: "FINANCES_RAPPORTS_VOIR",
  },

  {
    href: "/dashboard/securite",
    label: "Centre de Sécurité",
    icon: ShieldAlert,
    permission: "SECURITE_VOIR",
  },
  {
    href: "/dashboard/parametres",
    label: "Paramètres",
    icon: Settings,
    permission: "PARAMETRES_VOIR",
  },
];

function possedePermission(
  utilisateur: UtilisateurAdmin,
  permission: string
): boolean {
  if (utilisateur.superAdministrateur === true) {
    return true;
  }

  const permissions = utilisateur.permissions ?? [];

  return (
    permissions.includes("*") ||
    permissions.includes(permission)
  );
}

export default function AdminShell({
  utilisateur,
  titre,
  description,
  children,
  action,
}: Props) {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const liensVisibles = useMemo(() => {
    return liens.filter((lien) =>
      possedePermission(utilisateur, lien.permission)
    );
  }, [
    utilisateur.permissions,
    utilisateur.superAdministrateur,
  ]);

  const premierLienAutorise =
    liensVisibles[0]?.href ?? "/";

  return (
    <main className={styles.page}>
      {menuOuvert && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Fermer le menu"
          onClick={() => setMenuOuvert(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          menuOuvert ? styles.sidebarOuverte : ""
        }`}
      >
        <div className={styles.logoLigne}>
          <Link
            href={premierLienAutorise}
            className={styles.logo}
          >
            <span>
              <GraduationCap size={25} />
            </span>

            <div>
              <strong>DS School</strong>
              <small>PREMIUM</small>
            </div>
          </Link>

          <button
            type="button"
            className={styles.fermer}
            onClick={() => setMenuOuvert(false)}
            aria-label="Fermer le menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className={styles.ecoleMini}>
          <ShieldCheck size={18} />

          <div>
            <strong>Administration</strong>

            <small>
              {utilisateur.superAdministrateur
                ? "Accès intégral"
                : `${liensVisibles.length} accès autorisé(s)`}
            </small>
          </div>
        </div>

        <nav className={styles.nav}>
          {liensVisibles.map(
            ({ href, label, icon: Icon }) => {
              const actif =
                href === "/dashboard"
                  ? pathname === href
                  : pathname === href ||
                    pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    actif ? styles.actif : ""
                  }
                  onClick={() =>
                    setMenuOuvert(false)
                  }
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </Link>
              );
            }
          )}
        </nav>

        <form
          action="/api/auth/deconnexion"
          method="post"
          className={styles.deconnexion}
        >
          <button type="submit">
            <LogOut size={18} />
            Déconnexion
          </button>
        </form>
      </aside>

      <section className={styles.contenu}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menu}
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>

          <div className={styles.identite}>
            <span>
              {(
                utilisateur.nom
                  ?.trim()
                  ?.slice(0, 1) || "U"
              ).toUpperCase()}
            </span>

            <div>
              <small>
                Connecté en tant que
              </small>

              <strong>
                {utilisateur.nom}
              </strong>
            </div>
          </div>

          <em>{utilisateur.role}</em>
        </header>

        <div className={styles.entete}>
          <div>
            <span>
              DS SCHOOL PREMIUM
            </span>

            <h1>{titre}</h1>

            {description && (
              <p>{description}</p>
            )}
          </div>

          {action}
        </div>

        {children}
      </section>
    </main>
  );
}