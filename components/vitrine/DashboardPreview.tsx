"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings,
  UsersRound,
} from "lucide-react";
import type {
  DonneesDashboardPublic,
} from "@/lib/vitrine/dashboard-public";
import styles from "./dashboard-preview.module.css";

type Props = {
  donnees: DonneesDashboardPublic;
};

const formatNombre = (valeur: number) =>
  new Intl.NumberFormat("fr-FR").format(valeur);

export default function DashboardPreview({
  donnees,
}: Props) {
  const { statistiques, ecole, anneeActive } =
    donnees;

  const raccourcis = [
    {
      href: "#fonctionnalites",
      titre: "Identité de l’école",
      texte: "Paramètres officiels",
      icone: Settings,
    },
    {
      href: "#solutions",
      titre: "Année scolaire",
      texte: anneeActive ?? "À configurer",
      icone: CalendarDays,
    },
    {
      href: "#fonctionnalites",
      titre: "Sections",
      texte: `${formatNombre(
        statistiques.sectionsActives
      )} cycle(s) actif(s)`,
      icone: BookOpenCheck,
    },
    {
      href: "#fonctionnalites",
      titre: "Classes",
      texte: `${formatNombre(
        statistiques.classesActives
      )} classe(s) active(s)`,
      icone: School,
    },
  ];

  return (
    <div className={styles.scene}>
      <div className={styles.halo} />

      <div className={styles.application}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <span>
              <GraduationCap size={15} />
            </span>
            <div>
              <strong>DS School</strong>
              <small>PREMIUM</small>
            </div>
          </div>

          <div className={styles.administration}>
            <CheckCircle2 size={12} />
            <div>
              <strong>Administration</strong>
              <small>Accès intégral</small>
            </div>
          </div>

          <nav>
            <Link
              href="#accueil"
              className={styles.actif}
            >
              <LayoutDashboard size={13} />
              Tableau de bord
            </Link>
            <Link href="#fonctionnalites">
              <CalendarDays size={13} />
              Années scolaires
            </Link>
            <Link href="#fonctionnalites">
              <BookOpenCheck size={13} />
              Sections
            </Link>
            <Link href="#fonctionnalites">
              <School size={13} />
              Classes
            </Link>
            <Link href="#fonctionnalites">
              <UsersRound size={13} />
              Élèves
            </Link>
            <Link href="#solutions">
              <GraduationCap size={13} />
              Enseignants
            </Link>
          </nav>
        </aside>

        <section className={styles.contenu}>
          <header className={styles.topbar}>
            <div className={styles.identite}>
              <span>A</span>
              <div>
                <small>Connecté en tant que</small>
                <strong>
                  Administrateur Principal
                </strong>
              </div>
            </div>
            <em>Super Administrateur</em>
          </header>

          <div className={styles.entete}>
            <small>DS SCHOOL PREMIUM</small>
            <h3>Bienvenue à {ecole.nom}</h3>
            <p>
              Le tableau de bord affiche les
              informations enregistrées dans le
              système.
            </p>
          </div>

          <div className={styles.annee}>
            <CheckCircle2 size={13} />
            {anneeActive ? (
              <>
                Année scolaire active :
                <strong>{anneeActive}</strong>
              </>
            ) : (
              <strong>
                Aucune année scolaire active
              </strong>
            )}
          </div>

          <div className={styles.kpis}>
            <article>
              <span>
                <CalendarDays size={15} />
              </span>
              <div>
                <small>Années scolaires</small>
                <strong>
                  {formatNombre(
                    statistiques.anneesScolaires
                  )}
                </strong>
              </div>
            </article>

            <article>
              <span>
                <BookOpenCheck size={15} />
              </span>
              <div>
                <small>Sections actives</small>
                <strong>
                  {formatNombre(
                    statistiques.sectionsActives
                  )}
                </strong>
              </div>
            </article>

            <article>
              <span>
                <School size={15} />
              </span>
              <div>
                <small>Classes actives</small>
                <strong>
                  {formatNombre(
                    statistiques.classesActives
                  )}
                </strong>
              </div>
            </article>

            <article>
              <span>
                <UsersRound size={15} />
              </span>
              <div>
                <small>Élèves inscrits</small>
                <strong>
                  {formatNombre(
                    statistiques.elevesActifs
                  )}
                </strong>
              </div>
            </article>
          </div>

          <section className={styles.configuration}>
            <div className={styles.titre}>
              <strong>Configuration rapide</strong>
              <small>
                Accès aux principaux paramètres
              </small>
            </div>

            <div className={styles.raccourcis}>
              {raccourcis.map(
                ({
                  href,
                  titre,
                  texte,
                  icone: Icone,
                }) => (
                  <Link href={href} key={titre}>
                    <span>
                      <Icone size={14} />
                    </span>
                    <strong>{titre}</strong>
                    <small>{texte}</small>
                  </Link>
                )
              )}
            </div>
          </section>
        </section>
      </div>

      <div className={styles.badges}>
        <article>
          <GraduationCap />
          <div>
            <strong>
              {formatNombre(
                statistiques.enseignantsActifs
              )}
            </strong>
            <small>Enseignants actifs</small>
          </div>
        </article>

        <article>
          <UsersRound />
          <div>
            <strong>
              {formatNombre(statistiques.parents)}
            </strong>
            <small>Responsables</small>
          </div>
        </article>
      </div>
    </div>
  );
}
