"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export default function BoutonDeconnexion() {
  const [chargement, setChargement] = useState(false);

  async function deconnecter() {
    if (chargement) {
      return;
    }

    setChargement(true);

    try {
      const reponse = await fetch("/api/auth/deconnexion", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!reponse.ok) {
        throw new Error(
          `Échec de la déconnexion (${reponse.status})`,
        );
      }

      /*
       * Redirection relative exécutée par le navigateur.
       * Elle conserve automatiquement le vrai domaine public :
       * - localhost en développement ;
       * - Railway en production ;
       * - le domaine personnalisé plus tard.
       */
      window.location.assign("/connexion");
    } catch (erreur) {
      console.error("Erreur de déconnexion :", erreur);

      /*
       * Même si l'appel réseau échoue, on revient vers la page
       * de connexion du domaine actuellement ouvert.
       */
      window.location.assign("/connexion");
    }
  }

  return (
    <button
      type="button"
      onClick={deconnecter}
      disabled={chargement}
      aria-busy={chargement}
    >
      <LogOut size={18} />
      {chargement ? "Déconnexion..." : "Déconnexion"}
    </button>
  );
}