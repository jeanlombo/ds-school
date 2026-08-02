"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ScanResult = {
  ok: boolean;
  resultat: string;
  message: string;
  direction?: string;
  personne?: {
    nom: string;
    type: string;
    classeOuFonction?: string | null;
    photo?: string | null;
  };
  dateHeure?: string;
};

export default function ScanRfidClient({
  lecteurs,
}: {
  lecteurs: Array<{ id: number; nom: string; emplacement: string }>;
}) {
  const [uid, setUid] = useState("");
  const [lecteurId, setLecteurId] = useState(
    lecteurs.length ? String(lecteurs[0].id) : ""
  );
  const [direction, setDirection] = useState("AUTO");
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [resultat]);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    const valeur = uid.trim();
    if (!valeur || chargement) return;

    setChargement(true);
    setResultat(null);

    try {
      const response = await fetch("/api/safe-campus/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: valeur,
          lecteurId: lecteurId ? Number(lecteurId) : null,
          direction,
        }),
      });

      const data = await response.json();
      setResultat(data);
    } catch {
      setResultat({
        ok: false,
        resultat: "ERREUR",
        message: "Impossible de contacter le serveur.",
      });
    } finally {
      setUid("");
      setChargement(false);
    }
  }

  return (
    <div className="scan-layout">
      <form onSubmit={envoyer} className="scan-card">
        <div className="scan-symbol">📡</div>
        <h2>Présentez une carte RFID/NFC</h2>
        <p>
          Le lecteur USB peut saisir automatiquement le UID comme un clavier.
        </p>

        <label>Lecteur / point de contrôle</label>
        <select value={lecteurId} onChange={(e) => setLecteurId(e.target.value)}>
          <option value="">Poste manuel sans lecteur enregistré</option>
          {lecteurs.map((lecteur) => (
            <option value={lecteur.id} key={lecteur.id}>
              {lecteur.nom} — {lecteur.emplacement}
            </option>
          ))}
        </select>

        <label>Direction</label>
        <select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="AUTO">Automatique entrée/sortie</option>
          <option value="ENTREE">Forcer l’entrée</option>
          <option value="SORTIE">Forcer la sortie</option>
        </select>

        <label>UID de la carte</label>
        <input
          ref={inputRef}
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Scannez ou saisissez le UID puis Entrée"
          autoComplete="off"
          autoFocus
        />

        <button type="submit" disabled={chargement || !uid.trim()}>
          {chargement ? "Vérification..." : "Valider le passage"}
        </button>
      </form>

      <section
        className={`scan-result ${
          resultat ? (resultat.ok ? "success" : "danger") : "waiting"
        }`}
      >
        {!resultat ? (
          <>
            <div className="result-icon">🛡️</div>
            <h3>Système prêt</h3>
            <p>En attente d’une carte...</p>
          </>
        ) : (
          <>
            <div className="result-icon">{resultat.ok ? "✅" : "⛔"}</div>
            <h3>{resultat.message}</h3>
            {resultat.personne && (
              <div className="person-card">
                <div className="avatar">
                  {resultat.personne.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultat.personne.photo} alt="" />
                  ) : (
                    <span>{resultat.personne.nom.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <strong>{resultat.personne.nom}</strong>
                <span>{resultat.personne.type}</span>
                <span>{resultat.personne.classeOuFonction || "—"}</span>
                {resultat.direction && (
                  <b className="direction-badge">{resultat.direction}</b>
                )}
              </div>
            )}
            {resultat.dateHeure && (
              <small>
                {new Date(resultat.dateHeure).toLocaleString("fr-FR")}
              </small>
            )}
          </>
        )}
      </section>
    </div>
  );
}
