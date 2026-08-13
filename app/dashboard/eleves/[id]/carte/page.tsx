import { notFound, redirect } from "next/navigation";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import PrintButton from "./PrintButton";
import QRCodeEleve from "./QRCodeEleve";
import PhotoEleveCarte from "./PhotoEleveCarte";
import c from "./carte.module.css";\nimport { terminologieSection } from "@/lib/terminologie-academique";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function CarteEleve({ params }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const eleveId = Number(id);

  if (!Number.isInteger(eleveId) || eleveId <= 0) {
    notFound();
  }

  const eleve = await prisma.eleve.findFirst({
    where: {
      id: eleveId,
      ecoleId: ecole.id,
    },
    include: {
      inscriptions: {
        include: {
          classe: {
            include: {
              section: true,
            },
          },
          anneeScolaire: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!eleve) {
    notFound();
  }

  const inscription = eleve.inscriptions[0];\n  const t = terminologieSection(inscription?.classe.section.nom, ecole.typeEtablissement);

  const nomComplet = [
    eleve.nom,
    eleve.postnom,
    eleve.prenom,
  ]
    .filter(Boolean)
    .join(" ");

  /*
   * IMPORTANT SAFE CAMPUS
   * Le QR contient uniquement le matricule.
   *
   * L’API /api/safe-campus/scan accepte déjà un matricule simple.
   * Un contenu court produit un QR moins dense, plus rapide et plus
   * fiable à scanner sur une carte PVC imprimée.
   */
  const contenuQr = eleve.matricule.trim();

  const initiales = `${eleve.prenom?.charAt(0) || ""}${
    eleve.nom?.charAt(0) || ""
  }`.toUpperCase();

  return (
    <main className={c.cardPage}>
      <div className={c.cardToolbar}>
        <a href={`/dashboard/eleves/${eleve.id}`}>
          ← Retour au dossier
        </a>

        <PrintButton />
      </div>

      <section className={c.schoolCard}>
        <header className={c.cardTop}>
          <div className={c.schoolLogo}>
            {ecole.logo ? (
              <img
                src={ecole.logo}
                alt={`Logo de ${ecole.nom}`}
              />
            ) : (
              <span>DS</span>
            )}
          </div>

          <div className={c.schoolIdentity}>
            <small>{t.carte.toUpperCase()} OFFICIELLE</small>
            <h1>{ecole.nom}</h1>
            <p>
              {ecole.slogan ||
                "Excellence • Discipline • Innovation"}
            </p>
          </div>

          <span className={c.schoolYear}>
            {inscription?.anneeScolaire.libelle ||
              t.periodeMaj}
          </span>
        </header>

        <div className={c.cardBody}>
          <div className={c.photoColumn}>
            <div className={c.photoBox}>
              <PhotoEleveCarte
                src={eleve.photo}
                alt={`Photo de ${nomComplet}`}
                initiales={initiales || "EL"}
              />
            </div>

            <span className={c.photoLabel}>
              {`PHOTO DE L’${t.personneMaj.toUpperCase()}`}
            </span>
          </div>

          <div className={c.identity}>
            <small>MATRICULE</small>
            <b>{eleve.matricule}</b>

            <h2>
              {eleve.nom} {eleve.postnom || ""}
            </h2>

            <h3>{eleve.prenom}</h3>

            <dl>
              <div>
                <dt>{t.structureMaj}</dt>
                <dd>
                  {inscription?.classe.nom ||
                    "Non affectée"}
                </dd>
              </div>

              <div>
                <dt>Section</dt>
                <dd>
                  {inscription?.classe.section.nom ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt>Sexe</dt>
                <dd>
                  {eleve.sexe === "M"
                    ? "Masculin"
                    : "Féminin"}
                </dd>
              </div>
            </dl>
          </div>

          <div className={c.qrColumn}>
            <div className={c.qrBox}>
              <QRCodeEleve
                contenu={contenuQr}
                nomEleve={nomComplet}
              />
            </div>

            <strong>SAFE CAMPUS — SCANNER</strong>
            <span>{eleve.matricule}</span>
          </div>
        </div>

        <footer>
          <span>
            {ecole.telephone || "DS School Premium"}
          </span>

          <b>CARTE OFFICIELLE • NON TRANSFÉRABLE</b>
        </footer>
      </section>

      <p className={c.pvcInfo}>
        Format PVC CR80 : 85,60 × 53,98 mm
      </p>
    </main>
  );
}
