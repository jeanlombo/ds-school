import { prisma } from "@/lib/prisma";
import { changerStatutCarte, creerCarteRfid } from "./actions";

export const dynamic = "force-dynamic";

export default async function CartesRfidPage() {
  const cartes = await (prisma as any).carteRfid.findMany({
    orderBy: { creeLe: "desc" },
    take: 100,
  });

  return (
    <main>
      <section className="page-heading">
        <div><span>IDENTIFICATION</span><h2>Cartes RFID / NFC</h2><p>Attribuez et sécurisez les cartes des élèves et du personnel.</p></div>
      </section>

      <section className="content-grid cards-page">
        <form action={creerCarteRfid} className="panel form-panel">
          <div className="panel-title"><div><span>NOUVELLE CARTE</span><h3>Enrôlement RFID</h3></div></div>

          <label>UID de la carte *</label>
          <input name="uid" required placeholder="Ex. 04A1B2C3D4" />

          <label>Numéro interne</label>
          <input name="numeroInterne" placeholder="Ex. RFID-2026-0001" />

          <label>Type de propriétaire *</label>
          <select name="typeProprietaire" required defaultValue="ELEVE">
            <option value="ELEVE">Élève</option>
            <option value="ENSEIGNANT">Enseignant</option>
            <option value="PERSONNEL">Personnel</option>
            <option value="VISITEUR">Visiteur</option>
          </select>

          <label>ID du propriétaire *</label>
          <input name="proprietaireId" type="number" min="1" required placeholder="ID dans DS School" />

          <label>Nom complet *</label>
          <input name="nomProprietaire" required placeholder="Nom et prénom" />

          <label>Classe ou fonction</label>
          <input name="classeOuFonction" placeholder="Ex. 6e A / Professeur de maths" />

          <label>URL de la photo</label>
          <input name="photoProprietaire" placeholder="/uploads/..." />

          <button className="btn-primary" type="submit">Enregistrer la carte</button>
        </form>

        <section className="panel table-panel">
          <div className="panel-title"><div><span>REGISTRE</span><h3>{cartes.length} carte(s)</h3></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>UID</th><th>Propriétaire</th><th>Type</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {cartes.map((carte: any) => (
                  <tr key={carte.id}>
                    <td><code>{carte.uid}</code><small>{carte.numeroInterne || ""}</small></td>
                    <td><strong>{carte.nomProprietaire}</strong><small>{carte.classeOuFonction || "—"}</small></td>
                    <td>{carte.typeProprietaire}</td>
                    <td><span className={`status ${carte.statut.toLowerCase()}`}>{carte.statut}</span></td>
                    <td>
                      <form action={changerStatutCarte} className="inline-form">
                        <input type="hidden" name="id" value={carte.id} />
                        <select name="statut" defaultValue={carte.statut}>
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDUE">Suspendue</option>
                          <option value="PERDUE">Perdue</option>
                          <option value="EXPIREE">Expirée</option>
                          <option value="ARCHIVEE">Archivée</option>
                        </select>
                        <button type="submit">OK</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {cartes.length === 0 && <tr><td colSpan={5} className="empty">Aucune carte enregistrée.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
