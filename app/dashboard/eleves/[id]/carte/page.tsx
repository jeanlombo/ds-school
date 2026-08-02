import { notFound, redirect } from "next/navigation";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { prisma } from "@/lib/prisma";
import PrintButton from "./PrintButton";
import QRCodeEleve from "./QRCodeEleve";
import c from "./carte.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CarteEleve({ params }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const eleveId = Number(id);

  if (!Number.isInteger(eleveId) || eleveId <= 0) notFound();

  const eleve = await prisma.eleve.findFirst({
    where: { id: eleveId, ecoleId: ecole.id },
    include: {
      inscriptions: {
        include: {
          classe: { include: { section: true } },
          anneeScolaire: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!eleve) notFound();

  const inscription = eleve.inscriptions[0];
  const nomComplet = [eleve.nom, eleve.postnom, eleve.prenom]
    .filter(Boolean)
    .join(" ");

  const contenuQr = [
    "DS SCHOOL PREMIUM",
    `École : ${ecole.nom}`,
    `Élève : ${nomComplet}`,
    `Matricule : ${eleve.matricule}`,
    `Classe : ${inscription?.classe.nom ?? "Non affectée"}`,
    `Section : ${inscription?.classe.section.nom ?? "Non définie"}`,
    `Année scolaire : ${inscription?.anneeScolaire.libelle ?? "Non définie"}`,
    `Identifiant : ${eleve.id}`,
  ].join("\n");

  return (
    <main className={c.cardPage}>
      <div className={c.cardToolbar}>
        <a href={`/dashboard/eleves/${eleve.id}`}>← Retour au dossier</a>
        <PrintButton />
      </div>

      <section className={c.schoolCard}>
        <header className={c.cardTop}>
          <div className={c.schoolLogo}>DS</div>

          <div className={c.schoolIdentity}>
            <small>CARTE SCOLAIRE OFFICIELLE</small>
            <h1>{ecole.nom}</h1>
            <p>{ecole.slogan || "Excellence • Discipline • Innovation"}</p>
          </div>

          <span className={c.schoolYear}>
            {inscription?.anneeScolaire.libelle || "Année scolaire"}
          </span>
        </header>

        <div className={c.cardBody}>
          <div className={c.photoColumn}>
            <div className={c.photoBox}>
              {eleve.photo ? (
                <img src={eleve.photo} alt={`Photo de ${nomComplet}`} />
              ) : (
                <div className={c.photoPlaceholder}>
                  <strong>
                    {eleve.prenom.charAt(0)}
                    {eleve.nom.charAt(0)}
                  </strong>
                  <span>PHOTO</span>
                </div>
              )}
            </div>
            <span className={c.photoLabel}>PHOTO DE L’ÉLÈVE</span>
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
                <dt>Classe</dt>
                <dd>{inscription?.classe.nom || "Non affectée"}</dd>
              </div>
              <div>
                <dt>Section</dt>
                <dd>{inscription?.classe.section.nom || "—"}</dd>
              </div>
              <div>
                <dt>Sexe</dt>
                <dd>{eleve.sexe === "M" ? "Masculin" : "Féminin"}</dd>
              </div>
            </dl>
          </div>

          <div className={c.qrColumn}>
            <div className={c.qrBox}>
              <QRCodeEleve contenu={contenuQr} nomEleve={nomComplet} />
            </div>
            <strong>SCANNER POUR VÉRIFIER</strong>
            <span>{eleve.matricule}</span>
          </div>
        </div>

        <footer>
          <span>{ecole.telephone || "DS School Premium"}</span>
          <b>CARTE OFFICIELLE • NON TRANSFÉRABLE</b>
        </footer>
      </section>
    </main>
  );
}
