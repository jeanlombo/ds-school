import { prisma } from "@/lib/prisma";
import { creerLecteurRfid } from "./actions";

export const dynamic = "force-dynamic";

export default async function LecteursPage() {
  const lecteurs = await (prisma as any).lecteurRfid.findMany({
    orderBy: { creeLe: "desc" },
  });

  return (
    <main>
      <section className="page-heading">
        <div><span>INFRASTRUCTURE</span><h2>Lecteurs RFID</h2><p>Configurez les portes, entrées et points de contrôle.</p></div>
      </section>

      <section className="content-grid cards-page">
        <form action={creerLecteurRfid} className="panel form-panel">
          <div className="panel-title"><div><span>NOUVEAU LECTEUR</span><h3>Ajouter un point de contrôle</h3></div></div>

          <label>Code *</label>
          <input name="code" required placeholder="PORTAIL-01" />

          <label>Nom *</label>
          <input name="nom" required placeholder="Lecteur portail principal" />

          <label>Emplacement *</label>
          <input name="emplacement" required placeholder="Entrée principale" />

          <label>Type</label>
          <select name="type" defaultValue="USB_HID">
            <option value="USB_HID">USB HID / Clavier</option>
            <option value="NFC">NFC</option>
            <option value="RESEAU">Réseau générique</option>
            <option value="ZKTECO">ZKTeco</option>
            <option value="HID">HID</option>
            <option value="ACS">ACS</option>
            <option value="AUTRE">Autre</option>
          </select>

          <label>Direction par défaut</label>
          <select name="directionDefaut" defaultValue="">
            <option value="">Automatique</option>
            <option value="ENTREE">Entrée</option>
            <option value="SORTIE">Sortie</option>
          </select>

          <div className="form-row">
            <div><label>Adresse IP</label><input name="adresseIp" placeholder="192.168.1.50" /></div>
            <div><label>Port</label><input name="port" type="number" placeholder="4370" /></div>
          </div>

          <button className="btn-primary" type="submit">Ajouter le lecteur</button>
        </form>

        <section className="panel">
          <div className="panel-title"><div><span>ÉQUIPEMENTS</span><h3>{lecteurs.length} lecteur(s)</h3></div></div>
          <div className="device-grid">
            {lecteurs.map((l: any) => (
              <article className="device-card" key={l.id}>
                <div className="device-icon">📟</div>
                <div>
                  <strong>{l.nom}</strong>
                  <span>{l.code}</span>
                </div>
                <p>{l.emplacement}</p>
                <div className="device-info"><span>{l.type}</span><b>{l.statut}</b></div>
                {l.adresseIp && <small>{l.adresseIp}{l.port ? `:${l.port}` : ""}</small>}
              </article>
            ))}
            {lecteurs.length === 0 && <div className="empty">Aucun lecteur configuré.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
