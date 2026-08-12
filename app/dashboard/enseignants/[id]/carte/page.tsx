import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Radio, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { obtenirOuCreerEcole } from "@/lib/ecole";
import QRCodeEnseignant from "@/components/enseignants/QRCodeEnseignant";
import BoutonImprimer from "@/components/enseignants/BoutonImprimer";
import PhotoEnseignantCarte from "./PhotoEnseignantCarte";
import styles from "@/components/enseignants/carte.module.css";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CarteEnseignant({ params }: Props) {
  const utilisateur = await obtenirUtilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const ecole = await obtenirOuCreerEcole();
  const { id } = await params;
  const enseignantId = Number(id);

  if (!Number.isInteger(enseignantId) || enseignantId <= 0) {
    redirect("/dashboard/enseignants");
  }

  const e = await prisma.enseignant.findFirst({
    where: {
      id: enseignantId,
      ecoleId: ecole.id,
    },
  });

  if (!e) redirect("/dashboard/enseignants");

  const nomComplet = [e.nom, e.postnom, e.prenom].filter(Boolean).join(" ");
  const initiales = `${e.prenom?.charAt(0) || ""}${e.nom?.charAt(0) || ""}`.toUpperCase();

  const verification = [
    ecole.code,
    "ENSEIGNANT",
    e.id,
    e.matricule,
    nomComplet,
    e.statut,
  ].join("|");

  return (
    <main className={styles.page}>
      <div className={styles.outils}>
        <Link href={`/dashboard/enseignants/${e.id}`} className={styles.retour}>
          <ArrowLeft size={18} /> Retour
        </Link>

        <BoutonImprimer />
      </div>

      <section className={styles.zoneCarte}>
        <article className={styles.carte}>
          <div className={styles.bandeauHaut}>
            <div className={styles.identiteEcole}>
              <div className={styles.logo}>
                {ecole.logo ? (
                  <img src={ecole.logo} alt={`Logo ${ecole.nom}`} />
                ) : (
                  <span>DS</span>
                )}
              </div>

              <div className={styles.ecoleTexte}>
                <strong>{ecole.nom}</strong>
                <span>DS SCHOOL ENTERPRISE</span>
              </div>
            </div>

            <div className={styles.typeCarte}>
              <ShieldCheck size={16} />
              <div>
                <strong>CARTE ENSEIGNANT</strong>
                <small>PROFESSIONNELLE</small>
              </div>
            </div>
          </div>

          <div className={styles.corps}>
            <div className={styles.blocPhoto}>
              <div className={styles.photo}>
                <PhotoEnseignantCarte
                  src={e.photo}
                  alt={`Photo de ${nomComplet}`}
                  initiales={initiales || "EN"}
                />
              </div>

              <div className={styles.badgeStatut}>
                {e.statut === "actif" ? "ACTIF" : e.statut.toUpperCase()}
              </div>
            </div>

            <div className={styles.infos}>
              <span className={styles.libelle}>IDENTITÉ PROFESSIONNELLE</span>

              <h1>{e.nom}</h1>

              {(e.postnom || e.prenom) && (
                <h2>{[e.postnom, e.prenom].filter(Boolean).join(" ")}</h2>
              )}

              <div className={styles.grilleInfos}>
                <div>
                  <small>Matricule</small>
                  <strong>{e.matricule}</strong>
                </div>

                <div>
                  <small>Fonction</small>
                  <strong>{e.fonction || "Enseignant"}</strong>
                </div>

                <div>
                  <small>Spécialité</small>
                  <strong>{e.specialite || "Non précisée"}</strong>
                </div>

                <div>
                  <small>Grade</small>
                  <strong>{e.grade || "—"}</strong>
                </div>
              </div>
            </div>

            <div className={styles.qr}>
              <div className={styles.qrCadre}>
                <QRCodeEnseignant valeur={verification} taille={98} />
              </div>
              <small>SCAN DE VÉRIFICATION</small>
            </div>
          </div>

          <div className={styles.basCarte}>
            <div className={styles.rfid}>
              <Radio size={14} />
              <span>
                RFID/NFC
                {e.numeroCarteRfid
                  ? ` · ${e.numeroCarteRfid}`
                  : " · NON ATTRIBUÉ"}
              </span>
            </div>

            <div className={styles.contactEcole}>
              {ecole.telephone || ecole.email || "DS School Enterprise"}
            </div>
          </div>
        </article>
      </section>

      <p className={styles.note}>
        Format carte PVC. Pour imprimer : Ctrl + P, orientation paysage, échelle 100 %.
      </p>
    </main>
  );
}
