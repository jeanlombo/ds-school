import Link from "next/link";
import { Ban, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import styles from "./verifier.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ code?: string; numero?: string }>;
};

const libelles: Record<string, string> = {
  DIPLOME_FIN_ETUDES: "Diplôme de fin d’études",
  CERTIFICAT_REUSSITE: "Certificat de réussite",
  ATTESTATION_SCOLARITE: "Attestation de scolarité",
  ATTESTATION_FREQUENTATION: "Attestation de fréquentation",
  ATTESTATION_BONNE_CONDUITE: "Attestation de bonne conduite",
  ATTESTATION_TRANSFERT: "Attestation de transfert",
};

export default async function Page({ searchParams }: Props) {
  const q = await searchParams;
  const code = (q.code ?? "").trim();
  const numero = (q.numero ?? "").trim();
  const rechercheLancee = Boolean(code || numero);

  const document = rechercheLancee
    ? await prisma.documentAcademique.findFirst({
        where: {
          OR: [
            ...(code ? [{ codeVerification: code }] : []),
            ...(numero ? [{ numero }] : []),
          ],
        },
        include: {
          ecole: true,
          eleve: true,
          anneeScolaire: true,
          classe: { include: { section: true } },
        },
      })
    : null;

  return (
    <main className={styles.page}>
      <section className={styles.carte}>
        <div className={styles.marque}>
          <ShieldCheck size={42} />
          <div>
            <span>DS School Enterprise</span>
            <h1>Vérification de document académique</h1>
          </div>
        </div>

        <p className={styles.intro}>
          Saisissez le code de vérification ou le numéro officiel figurant sur
          le diplôme, certificat ou l’attestation.
        </p>

        <form className={styles.formulaire}>
          <label>
            <span>Code de vérification</span>
            <input name="code" defaultValue={code} placeholder="Ex. 9A4F..." />
          </label>
          <div className={styles.ou}>OU</div>
          <label>
            <span>Numéro officiel</span>
            <input name="numero" defaultValue={numero} placeholder="Ex. CER-ECOLE-..." />
          </label>
          <button type="submit"><Search size={18} /> Vérifier</button>
        </form>

        {rechercheLancee && !document && (
          <div className={styles.introuvable}>
            <Ban size={30} />
            <div>
              <strong>Document introuvable</strong>
              <p>
                Aucun document académique ne correspond aux informations saisies.
              </p>
            </div>
          </div>
        )}

        {document && (
          <section className={document.statut === "VALIDE" ? styles.valide : styles.annule}>
            <div className={styles.statut}>
              {document.statut === "VALIDE" ? (
                <CheckCircle2 size={34} />
              ) : (
                <Ban size={34} />
              )}
              <div>
                <small>Résultat de la vérification</small>
                <strong>
                  Document {document.statut === "VALIDE" ? "authentique et valide" : "annulé"}
                </strong>
              </div>
            </div>

            <dl>
              <div><dt>Établissement</dt><dd>{document.ecole.nom}</dd></div>
              <div><dt>Type</dt><dd>{libelles[document.type] ?? document.type}</dd></div>
              <div><dt>Numéro</dt><dd>{document.numero}</dd></div>
              <div>
                <dt>Élève</dt>
                <dd>
                  {document.eleve.nom} {document.eleve.postnom ?? ""}{" "}
                  {document.eleve.prenom}
                </dd>
              </div>
              <div><dt>Matricule</dt><dd>{document.eleve.matricule}</dd></div>
              <div><dt>Année scolaire</dt><dd>{document.anneeScolaire.libelle}</dd></div>
              <div><dt>Classe</dt><dd>{document.classe?.nom ?? "—"}</dd></div>
              <div>
                <dt>Date de délivrance</dt>
                <dd>{document.dateDelivrance.toLocaleDateString("fr-CD")}</dd>
              </div>
            </dl>
          </section>
        )}

        <footer>
          <Link href="/">Retour au site</Link>
          <span>Service public de vérification académique</span>
        </footer>
      </section>
    </main>
  );
}
