import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import prisma from "@/lib/prisma";
import { obtenirUtilisateurConnecte } from "@/lib/session";
import { traiterDemande } from "./actions";
import styles from "./demandes.module.css";

type D = {
  id: number;
  reference_demande: string;
  type_demande: string;
  nom_etablissement: string;
  type_etablissement: string | null;
  effectif: number | null;
  nom_responsable: string;
  telephone: string;
  email: string | null;
  message: string | null;
  statut: string;
  observation_admin: string | null;
  created_at: Date;
};

function convertible(type: string) {
  const t = String(type || "").toUpperCase();
  return t === "INSCRIPTION" || t === "TARIFICATION";
}

export default async function Page() {
  const u = await obtenirUtilisateurConnecte();

  if (!u) redirect("/connexion");
  if (!u.superAdministrateur) redirect("/dashboard");

  const demandes = await prisma.$queryRaw<D[]>`
    SELECT
      id,
      reference_demande,
      type_demande,
      nom_etablissement,
      type_etablissement,
      effectif,
      nom_responsable,
      telephone,
      email,
      message,
      statut,
      observation_admin,
      created_at
    FROM demandes_vitrine
    ORDER BY
      CASE statut
        WHEN 'NOUVELLE' THEN 0
        WHEN 'EN_COURS' THEN 1
        ELSE 2
      END,
      created_at DESC
    LIMIT 300
  `;

  const nouvelles = demandes.filter((d) => d.statut === "NOUVELLE").length;
  const encours = demandes.filter((d) => d.statut === "EN_COURS").length;

  return (
    <AdminShell
      utilisateur={u}
      titre="Demandes de la vitrine"
      description="Demandes commerciales reçues depuis la vitrine DS School."
    >
      <div className={styles.kpis}>
        <div>
          <span>Total</span>
          <b>{demandes.length}</b>
        </div>
        <div>
          <span>Nouvelles</span>
          <b>{nouvelles}</b>
        </div>
        <div>
          <span>En cours</span>
          <b>{encours}</b>
        </div>
      </div>

      <div className={styles.liste}>
        {demandes.map((d) => (
          <article key={d.id} className={styles.card}>
            <header>
              <div>
                <small>{d.reference_demande}</small>
                <h2>{d.nom_etablissement}</h2>
                <p>
                  {d.type_demande.replaceAll("_", " ")}
                  {" · "}
                  {d.type_etablissement || "Type non précisé"}
                  {d.effectif
                    ? ` · ${d.effectif.toLocaleString("fr-FR")} apprenants`
                    : ""}
                </p>
              </div>

              <span className={styles.badge}>
                {d.statut.replaceAll("_", " ")}
              </span>
            </header>

            <div className={styles.infos}>
              <p>
                <b>Responsable :</b> {d.nom_responsable}
              </p>
              <p>
                <b>Téléphone :</b> {d.telephone}
              </p>
              <p>
                <b>E-mail :</b> {d.email || "—"}
              </p>
              <p>
                <b>Reçue :</b>{" "}
                {new Date(d.created_at).toLocaleString("fr-FR")}
              </p>
            </div>

            {d.message && <blockquote>{d.message}</blockquote>}

            {convertible(d.type_demande) &&
              !["REJETEE", "CLOTUREE"].includes(d.statut) && (
                <div
                  style={{
                    margin: "14px 0",
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Link
                    href={`/dashboard/demandes/${d.id}/conversion`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "11px 15px",
                      borderRadius: 12,
                      background: "#0f766e",
                      color: "#fff",
                      fontWeight: 900,
                      textDecoration: "none",
                    }}
                  >
                    Convertir en abonnement
                  </Link>

                  <small style={{ color: "#64748b" }}>
                    Le montant sera confirmé par DIGIGROUPE avant création.
                  </small>
                </div>
              )}

            <form action={traiterDemande}>
              <input type="hidden" name="id" value={d.id} />

              <select name="statut" defaultValue={d.statut}>
                <option value="NOUVELLE">Nouvelle</option>
                <option value="EN_COURS">En cours</option>
                <option value="TRAITEE">Traitée</option>
                <option value="REJETEE">Rejetée</option>
                <option value="CLOTUREE">Clôturée</option>
              </select>

              <input
                name="observation"
                defaultValue={d.observation_admin || ""}
                placeholder="Observation / suivi commercial"
              />

              <button>Enregistrer</button>
            </form>
          </article>
        ))}
      </div>

      {!demandes.length && (
        <div className={styles.vide}>
          Aucune demande reçue pour le moment.
        </div>
      )}
    </AdminShell>
  );
}
