import Link from "next/link";
import { Ban, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import styles from "./verifier.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    recherche?: string;
    code?: string;
    numero?: string;
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

function normaliserReference(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

async function trouverDocument(reference: string) {
  const normalisee = normaliserReference(reference);

  if (!normalisee) {
    return null;
  }

  const correspondances = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM documents_academiques
    WHERE
      UPPER(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(TRIM(numero), '-', ''),
              ' ',
              ''
            ),
            '/',
            ''
          ),
          '.',
          ''
        )
      ) = ${normalisee}
      OR UPPER(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(TRIM(code_verification), '-', ''),
              ' ',
              ''
            ),
            '/',
            ''
          ),
          '.',
          ''
        )
      ) = ${normalisee}
    ORDER BY id DESC
    LIMIT 1
  `;

  const id = correspondances[0]?.id;

  if (!id) {
    return null;
  }

  return prisma.documentAcademique.findUnique({
    where: { id },
    include: {
      ecole: true,
      eleve: true,
      anneeScolaire: true,
      classe: { include: { section: true } },
    },
  });
}

export default async function Page({ searchParams }: Props) {
  const q = await searchParams;
  const recherche = (
    q.recherche ??
    q.numero ??
    q.code ??
    ""
  ).trim();
  const rechercheLancee = Boolean(recherche);
  const document = rechercheLancee
    ? await trouverDocument(recherche)
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
          Saisissez le numéro officiel ou le code de vérification figurant sur
          le diplôme, le certificat ou l’attestation. Les espaces, tirets et
          différences entre majuscules et minuscules sont acceptés.
        </p>

        <form className={styles.formulaire}>
          <label>
            <span>Numéro ou code de vérification</span>
            <input
              name="recherche"
              defaultValue={recherche}
              placeholder="Ex. DSS-DIP-2026-0000001"
              autoComplete="off"
              required
            />
          </label>
          <button type="submit">
            <Search size={18} /> Vérifier
          </button>
        </form>

        {rechercheLancee && !document && (
          <div className={styles.introuvable}>
            <Ban size={30} />
            <div>
              <strong>Document introuvable</strong>
              <p>
                Aucun document académique ne correspond à « {recherche} ».
                Vérifiez que ce numéro provient réellement d’un document créé
                dans le Centre académique.
              </p>
            </div>
          </div>
        )}

        {document && (
          <section
            className={
              document.statut === "VALIDE"
                ? styles.valide
                : styles.annule
            }
          >
            <div className={styles.statut}>
              {document.statut === "VALIDE" ? (
                <CheckCircle2 size={34} />
              ) : (
                <Ban size={34} />
              )}
              <div>
                <small>Résultat de la vérification</small>
                <strong>
                  Document {document.statut === "VALIDE"
                    ? "authentique et valide"
                    : document.statut.toLowerCase()}
                </strong>
              </div>
            </div>

            <dl>
              <div><dt>Établissement</dt><dd>{document.ecole.nom}</dd></div>
              <div><dt>Type</dt><dd>{libelles[document.type] ?? document.type.replaceAll("_", " ")}</dd></div>
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
