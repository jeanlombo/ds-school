import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PassagesPage({
  searchParams,
}: {
  searchParams: Promise<{ resultat?: string; direction?: string }>;
}) {
  const params = await searchParams;
  const where: any = {};

  if (params.resultat) where.resultat = params.resultat;
  if (params.direction) where.direction = params.direction;

  const passages = await (prisma as any).passageRfid.findMany({
    where,
    include: { lecteur: true },
    orderBy: { dateHeure: "desc" },
    take: 300,
  });

  return (
    <main>
      <section className="page-heading">
        <div><span>TRAÇABILITÉ</span><h2>Journal des passages</h2><p>Historique complet des entrées, sorties et tentatives refusées.</p></div>
      </section>

      <section className="panel table-panel">
        <div className="panel-title">
          <div><span>HISTORIQUE</span><h3>{passages.length} passage(s)</h3></div>
          <form method="get" className="filters">
            <select name="resultat" defaultValue={params.resultat || ""}>
              <option value="">Tous les résultats</option>
              <option value="AUTORISE">Autorisés</option>
              <option value="REFUSE">Refusés</option>
              <option value="CARTE_INCONNUE">Cartes inconnues</option>
              <option value="CARTE_INACTIVE">Cartes inactives</option>
            </select>
            <select name="direction" defaultValue={params.direction || ""}>
              <option value="">Toutes directions</option>
              <option value="ENTREE">Entrées</option>
              <option value="SORTIE">Sorties</option>
            </select>
            <button type="submit">Filtrer</button>
          </form>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Date et heure</th><th>Personne / UID</th><th>Profil</th><th>Direction</th><th>Lecteur</th><th>Résultat</th></tr></thead>
            <tbody>
              {passages.map((p: any) => (
                <tr key={p.id}>
                  <td>{new Date(p.dateHeure).toLocaleString("fr-FR")}</td>
                  <td><strong>{p.nomProprietaire || "Carte inconnue"}</strong><small><code>{p.uidLu}</code></small></td>
                  <td>{p.typeProprietaire || "—"}<small>{p.classeOuFonction || ""}</small></td>
                  <td><span className={`direction ${p.direction.toLowerCase()}`}>{p.direction}</span></td>
                  <td>{p.lecteur?.nom || "Poste manuel"}<small>{p.lecteur?.emplacement || ""}</small></td>
                  <td><span className={`status ${p.resultat === "AUTORISE" ? "active" : "suspendue"}`}>{p.resultat}</span></td>
                </tr>
              ))}
              {passages.length === 0 && <tr><td colSpan={6} className="empty">Aucun passage trouvé.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
