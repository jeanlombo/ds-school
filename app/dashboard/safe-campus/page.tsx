import Link from "next/link";
import {
  CalendarClock,
  CreditCard,
  History,
  Radar,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SafeCampusDashboard() {
  const db = prisma as any;

  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);

  let cartesActives = 0;
  let lecteursActifs = 0;
  let passagesJour = 0;
  let autorisesJour = 0;
  let alertesJour = 0;
  let derniersPassages: any[] = [];

  try {
    [
      cartesActives,
      lecteursActifs,
      passagesJour,
      autorisesJour,
      alertesJour,
      derniersPassages,
    ] = await Promise.all([
      db.carteRfid.count({
        where: {
          statut: "ACTIVE",
        },
      }),

      db.lecteurRfid.count({
        where: {
          statut: "ACTIF",
        },
      }),

      db.passageRfid.count({
        where: {
          dateHeure: {
            gte: debutJour,
          },
        },
      }),

      db.passageRfid.count({
        where: {
          dateHeure: {
            gte: debutJour,
          },
          resultat: "AUTORISE",
        },
      }),

      db.passageRfid.count({
        where: {
          dateHeure: {
            gte: debutJour,
          },
          resultat: {
            not: "AUTORISE",
          },
        },
      }),

      db.passageRfid.findMany({
        orderBy: {
          dateHeure: "desc",
        },
        take: 8,
        include: {
          lecteur: true,
        },
      }),
    ]);
  } catch (error) {
    console.error(
      "SAFE CAMPUS DASHBOARD:",
      error
    );
  }

  return (
    <main>
      <section className="safe-hero">
        <div>
          <span className="safe-badge">
            SÉCURITÉ EN TEMPS RÉEL
          </span>

          <h2>
            Un campus plus sûr, connecté et
            intelligent.
          </h2>

          <p>
            Gérez les cartes QR/RFID, les
            entrées, les sorties, les points de
            contrôle et les horaires autorisés.
          </p>

          <div className="safe-actions">
            <Link href="/dashboard/safe-campus/controle">
              Ouvrir le contrôle d’accès
            </Link>

            <Link href="/mobile/scanner">
              Ouvrir la PWA Scanner
            </Link>

            <Link href="/dashboard/safe-campus/cartes">
              Gérer les cartes élèves
            </Link>

            <Link href="/dashboard/safe-campus/parametres-horaires">
              Configurer les horaires
            </Link>
          </div>
        </div>

        <div className="safe-shield">
          <ShieldCheck size={74} />
        </div>
      </section>

      <section className="safe-stats">
        <article>
          <span>Cartes actives</span>
          <strong>{cartesActives}</strong>
        </article>

        <article>
          <span>Lecteurs actifs</span>
          <strong>{lecteursActifs}</strong>
        </article>

        <article>
          <span>Passages du jour</span>
          <strong>{passagesJour}</strong>
        </article>

        <article>
          <span>Accès autorisés</span>
          <strong>{autorisesJour}</strong>
        </article>

        <article>
          <span>Alertes</span>
          <strong>{alertesJour}</strong>
        </article>
      </section>

      <section className="safe-grid">
        <article className="safe-panel">
          <div className="safe-title">
            <h3>Derniers passages</h3>

            <Link href="/dashboard/safe-campus/passages">
              Voir tout
            </Link>
          </div>

          {derniersPassages.length === 0 ? (
            <div className="safe-empty">
              Aucun passage enregistré.
            </div>
          ) : (
            <div className="safe-list">
              {derniersPassages.map(
                (passage) => (
                  <div
                    className="safe-row"
                    key={passage.id}
                  >
                    <div>
                      <strong>
                        {passage.nomProprietaire ||
                          passage.uidLu}
                      </strong>

                      <span>
                        {passage.classeOuFonction ||
                          "Carte inconnue"}
                      </span>
                    </div>

                    <div>
                      <b>
                        {passage.direction}
                      </b>

                      <span>
                        {new Date(
                          passage.dateHeure
                        ).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </article>

        <article className="safe-panel safe-shortcuts">
          <h3>Accès rapide</h3>

          <Link href="/dashboard/safe-campus/controle">
            <ScanLine size={18} />
            Scanner une carte
          </Link>

          <Link href="/dashboard/safe-campus/cartes">
            <CreditCard size={18} />
            Cartes QR / RFID
          </Link>

          <Link href="/dashboard/safe-campus/lecteurs">
            <Radar size={18} />
            Points de contrôle
          </Link>

          <Link href="/dashboard/safe-campus/parametres-horaires">
            <CalendarClock size={18} />
            Paramètres horaires
          </Link>

          <Link href="/dashboard/safe-campus/passages">
            <History size={18} />
            Journal des passages
          </Link>
        </article>
      </section>
    </main>
  );
}
