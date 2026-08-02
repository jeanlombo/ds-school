import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import BoutonImprimer from "../../releves-notes/BoutonImprimer";
import styles from "../documents.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const libelles: Record<string, string> = {
  DIPLOME_FIN_ETUDES: "Diplôme de fin d’études",
  CERTIFICAT_REUSSITE: "Certificat de réussite",
  ATTESTATION_SCOLARITE: "Attestation de scolarité",
  ATTESTATION_FREQUENTATION: "Attestation de fréquentation",
  ATTESTATION_BONNE_CONDUITE: "Attestation de bonne conduite",
  ATTESTATION_TRANSFERT: "Attestation de transfert",
};

function normaliserLogo(
  source: string | null | undefined
): string | null {
  const valeur = String(source ?? "").trim();

  if (!valeur) {
    return null;
  }

  if (
    valeur.startsWith("http://") ||
    valeur.startsWith("https://") ||
    valeur.startsWith("/") ||
    valeur.startsWith("data:")
  ) {
    return valeur;
  }

  return `/${valeur.replace(/^\.?\//, "")}`;
}

function textePrincipal(
  type: string,
  nomComplet: string
): string {
  switch (type) {
    case "DIPLOME_FIN_ETUDES":
      return `Le présent diplôme est décerné à ${nomComplet}, en reconnaissance de l’accomplissement des exigences académiques prévues par l’établissement.`;

    case "CERTIFICAT_REUSSITE":
      return `Le présent certificat atteste que ${nomComplet} a satisfait aux exigences académiques de l’établissement.`;

    case "ATTESTATION_FREQUENTATION":
      return `La Direction atteste que ${nomComplet} a régulièrement fréquenté l’établissement durant l’année scolaire indiquée.`;

    case "ATTESTATION_BONNE_CONDUITE":
      return `La Direction atteste que ${nomComplet} a fait preuve de bonne conduite durant sa scolarité dans l’établissement.`;

    case "ATTESTATION_TRANSFERT":
      return `La Direction atteste que ${nomComplet} a été régulièrement inscrit(e) dans l’établissement et peut poursuivre sa scolarité conformément aux dispositions applicables.`;

    default:
      return `La Direction atteste officiellement que ${nomComplet} est régulièrement inscrit(e) dans l’établissement.`;
  }
}

export default async function Page({
  params,
}: Props) {
  const utilisateur =
    await obtenirUtilisateurConnecte();

  if (!utilisateur) {
    redirect("/connexion");
  }

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const documentId = Number(id);

  if (
    !Number.isInteger(documentId) ||
    documentId <= 0
  ) {
    notFound();
  }

  const document =
    await prisma.documentAcademique.findFirst({
      where: {
        id: documentId,
        ecoleId: ecole.id,
      },
      include: {
        eleve: true,
        anneeScolaire: true,
        classe: {
          include: {
            section: true,
          },
        },
      },
    });

  if (!document) {
    notFound();
  }

  const origine =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const verificationUrl =
    `${origine}/verifier-document?code=${encodeURIComponent(
      document.codeVerification
    )}`;

  const qr =
    `https://quickchart.io/qr?size=260&margin=1&text=${encodeURIComponent(
      verificationUrl
    )}`;

  const nomComplet = [
    document.eleve.nom,
    document.eleve.postnom,
    document.eleve.prenom,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const logo = normaliserLogo(ecole.logo);

  const initiales = ecole.nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join("");

  const titre =
    libelles[document.type] ??
    document.type.replaceAll("_", " ");

  return (
    <main className={styles.documentPage}>
      <div className={styles.toolbar}>
        <Link href="/dashboard/centre-academique/diplomes-certificats">
          <ArrowLeft size={17} />
          Retour au registre
        </Link>

        <BoutonImprimer />
      </div>

      <article className={styles.documentPremium}>
        <div className={styles.motifSecurite} />

        {document.statut === "ANNULE" && (
          <div className={styles.filigrane}>
            DOCUMENT ANNULÉ
          </div>
        )}

        <header className={styles.entetePremium}>
          <div className={styles.logoPremium}>
            {logo ? (
              <img
                src={logo}
                alt={`Logo ${ecole.nom}`}
              />
            ) : (
              <span>{initiales || "DS"}</span>
            )}
          </div>

          <div className={styles.identiteEcole}>
            <small>
              {ecole.pays ||
                "République Démocratique du Congo"}
            </small>

            <h1>{ecole.nom}</h1>

            <p>
              {ecole.slogan ??
                "Excellence · Discipline · Réussite"}
            </p>
          </div>

          <div className={styles.sceauOfficiel}>
            <Award size={27} />
            <small>Document officiel</small>
          </div>
        </header>

        <section className={styles.titrePremium}>
          <span>DS SCHOOL ENTERPRISE</span>
          <h2>{titre}</h2>
          <p>N° {document.numero}</p>
        </section>

        <section className={styles.certifiePremium}>
          <p className={styles.introduction}>
            {textePrincipal(
              document.type,
              nomComplet
            )}
          </p>

          <h3>{nomComplet}</h3>

          <div className={styles.identiteEleve}>
            <p>
              Né(e) le{" "}
              <strong>
                {document.eleve.dateNaissance.toLocaleDateString(
                  "fr-CD"
                )}
              </strong>
            </p>

            <p>
              À{" "}
              <strong>
                {document.eleve.lieuNaissance ??
                  "—"}
              </strong>
            </p>

            <p>
              Matricule{" "}
              <strong>
                {document.eleve.matricule}
              </strong>
            </p>
          </div>

          <p>
            Classe :{" "}
            <strong>
              {document.classe?.nom ?? "—"}
            </strong>
            {document.classe?.section?.nom
              ? ` — ${document.classe.section.nom}`
              : ""}
            , année scolaire{" "}
            <strong>
              {document.anneeScolaire.libelle}
            </strong>.
          </p>

          {(document.type ===
            "CERTIFICAT_REUSSITE" ||
            document.type ===
              "DIPLOME_FIN_ETUDES") && (
            <p>
              Il/Elle a satisfait aux exigences
              académiques de l’établissement
              {document.mention ? (
                <>
                  {" "}
                  avec la mention{" "}
                  <strong>
                    {document.mention}
                  </strong>
                </>
              ) : null}
              .
            </p>
          )}

          {document.session && (
            <p>
              Session :{" "}
              <strong>{document.session}</strong>.
            </p>
          )}

          {document.motif && (
            <p className={styles.motifDocument}>
              {document.motif}
            </p>
          )}
        </section>

        <section className={styles.metaPremium}>
          <article>
            <small>Date de délivrance</small>
            <strong>
              {document.dateDelivrance.toLocaleDateString(
                "fr-CD"
              )}
            </strong>
          </article>

          <article>
            <small>Année scolaire</small>
            <strong>
              {document.anneeScolaire.libelle}
            </strong>
          </article>

          <article>
            <small>Classe</small>
            <strong>
              {document.classe?.nom ?? "—"}
            </strong>
          </article>

          <article>
            <small>Statut</small>
            <strong>{document.statut}</strong>
          </article>
        </section>

        <section className={styles.basPremium}>
          <div className={styles.signaturePremium}>
            <span>
              Fait à {ecole.ville ?? "—"}, le
            </span>

            <strong>
              {document.dateDelivrance.toLocaleDateString(
                "fr-CD"
              )}
            </strong>

            <div className={styles.espaceSignaturePremium}>
              Signature et cachet
            </div>

            <b>
              {document.signataire ??
                ecole.directeur ??
                "La Direction"}
            </b>
          </div>

          <div className={styles.verificationPremium}>
            <img
              src={qr}
              alt="QR Code de vérification"
            />

            <div>
              <strong>
                <ShieldCheck size={18} />
                Vérification publique
              </strong>

              <p>
                {document.codeVerification}
              </p>

              <small>
                Scannez le QR Code ou saisissez ce
                code sur la page publique de
                vérification. Toute modification rend
                le document non conforme.
              </small>

              <span>
                <CheckCircle2 size={14} />
                Document sécurisé DS School
              </span>
            </div>
          </div>
        </section>

        <footer className={styles.footerPremium}>
          <span>
            {[ecole.adresse, ecole.ville]
              .filter(Boolean)
              .join(" · ")}
          </span>

          <span>
            {[ecole.telephone, ecole.email]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </footer>
      </article>
    </main>
  );
}
