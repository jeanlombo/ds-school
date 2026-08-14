"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficher, setAfficher] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setChargement(true);

    try {
      const reponse = await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });
      const resultat = await reponse.json();

      if (!reponse.ok) {
        setMessage(resultat.message ?? "Connexion impossible.");
        return;
      }

      window.location.href = resultat.redirection ?? "/dashboard";
    } catch {
      setMessage("Le serveur ne répond pas. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orbe auth-orbe-1" />
      <div className="auth-orbe auth-orbe-2" />

      <section className="auth-presentation">
        <Link href="/" className="auth-retour"><ArrowLeft size={18} /> Retour à l’accueil</Link>
        <div className="auth-marque"><span><GraduationCap size={28} /></span><div><strong>DS School</strong><small>VERSION 1.0</small></div></div>
        <div className="auth-argument">
          <span className="auth-badge"><ShieldCheck size={16} /> ESPACE SÉCURISÉ</span>
          <h1>Pilotez votre établissement avec sérénité.</h1>
          <p>Retrouvez les élèves, les enseignants, les finances, les présences et les rapports dans un seul environnement intelligent.</p>
        </div>
        <div className="auth-mini-stats">
          <div><strong>100%</strong><span>Données protégées</span></div>
          <div><strong>24/7</strong><span>Accès à la plateforme</span></div>
          <div><strong>10+</strong><span>Modules intégrés</span></div>
        </div>
      </section>

      <section className="auth-zone-formulaire">
        <div className="auth-carte">
          <div className="auth-entete">
            <span className="auth-icone"><LockKeyhole size={24} /></span>
            <h2>Bienvenue</h2>
            <p>Connectez-vous à votre espace de gestion scolaire.</p>
          </div>

          <form onSubmit={soumettre}>
            <label htmlFor="email">Adresse e-mail</label>
            <div className="auth-champ"><Mail size={19} /><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="administrateur@ecole.cd" required /></div>

            <div className="auth-ligne-label"><label htmlFor="motDePasse">Mot de passe</label><a href="#">Mot de passe oublié ?</a></div>
            <div className="auth-champ"><LockKeyhole size={19} /><input id="motDePasse" type={afficher ? "text" : "password"} autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Votre mot de passe" required /><button type="button" className="auth-voir" onClick={() => setAfficher(!afficher)} aria-label="Afficher ou masquer le mot de passe">{afficher ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>

            {message && <div className="auth-erreur">{message}</div>}

            <button className="auth-bouton" type="submit" disabled={chargement}>{chargement ? <><LoaderCircle className="tourne" size={20} /> Connexion...</> : "Se connecter"}</button>
          </form>

          <p className="auth-aide">Besoin d’assistance ? Contactez l’administrateur de votre établissement.</p>
        </div>
      </section>
    </main>
  );
}
