"use client";

import Link from "next/link";
import {
  ArrowRight, BarChart3, Bell, BookOpen, BriefcaseBusiness, Building2,
  CheckCircle2, ChevronDown, Clock3, Cloud, CreditCard, Download, FileCheck2, GraduationCap,
  Headphones, Heart, Laptop, LockKeyhole, Menu, MessageSquareText, Monitor,
  NotebookTabs, PlayCircle, QrCode, School, Send, ShieldCheck, Smartphone,
  Sparkles, Star, Tablet, TrendingDown, TrendingUp, UserRoundCog, Users,
  UsersRound, X
} from "lucide-react";
import { CSSProperties, MouseEvent, useEffect, useState } from "react";

const fonctionnalites = [
  { icon: UsersRound, titre: "Gestion des élèves", texte: "Suivi complet des informations et parcours scolaires", ton: "bleu" },
  { icon: UserRoundCog, titre: "Gestion des enseignants", texte: "Administration du personnel et des affectations", ton: "vert" },
  { icon: BriefcaseBusiness, titre: "Classes & Inscriptions", texte: "Organisation des classes et inscriptions simplifiées", ton: "jaune" },
  { icon: NotebookTabs, titre: "Présences", texte: "Suivi des présences élèves et enseignants", ton: "violet" },
  { icon: Star, titre: "Notes & Bulletins", texte: "Saisie des notes et génération des bulletins", ton: "indigo" },
  { icon: CreditCard, titre: "Paiements", texte: "Gestion des frais scolaires et comptabilité", ton: "emeraude" },
  { icon: BarChart3, titre: "Rapports & Statistiques", texte: "Analyses et rapports détaillés en temps réel", ton: "rose" },
  { icon: MessageSquareText, titre: "Communication", texte: "Échanges avec parents et notifications", ton: "royal" },
  { icon: Users, titre: "Utilisateurs & Rôles", texte: "Gestion des accès et permissions", ton: "corail" },
  { icon: Building2, titre: "Patrimoine", texte: "Gestion des biens et ressources de l'école", ton: "cyan" },
];

const avantages = [
  { icon: Clock3, titre: "Gain de temps", texte: "Automatisez vos tâches et réduisez le travail administratif" },
  { icon: ShieldCheck, titre: "Fiabilité", texte: "Données sécurisées et sauvegardées régulièrement" },
  { icon: Monitor, titre: "Transparence", texte: "Suivi clair des activités et des performances" },
  { icon: BarChart3, titre: "Prise de décision", texte: "Statistiques précises pour prendre les meilleures décisions" },
  { icon: Heart, titre: "Satisfaction", texte: "Améliorez la satisfaction des parents et élèves" },
];

export default function Accueil() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [enteteCompacte, setEnteteCompacte] = useState(false);
  const [compteurs, setCompteurs] = useState({ etablissements: 0, modules: 0, espaces: 0, gain: 0 });
  const [parallaxe, setParallaxe] = useState({ x: 0, y: 0 });
  const [effectifTarif, setEffectifTarif] = useState("300");
  const [typeEtablissementTarif, setTypeEtablissementTarif] = useState("École primaire / secondaire");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entrees) => entrees.forEach((entree) => entree.isIntersecting && entree.target.classList.add("ds-visible")),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".ds-reveal").forEach((element) => observer.observe(element));
    const gererScroll = () => setEnteteCompacte(window.scrollY > 20);
    gererScroll();
    window.addEventListener("scroll", gererScroll);
    const debut = performance.now();
    const duree = 1600;
    let animation = 0;
    const animerCompteurs = (maintenant: number) => {
      const progression = Math.min((maintenant - debut) / duree, 1);
      const douce = 1 - Math.pow(1 - progression, 3);
      setCompteurs({
        etablissements: Math.round(500 * douce),
        modules: Math.round(10 * douce),
        espaces: Math.round(4 * douce),
        gain: Math.round(70 * douce),
      });
      if (progression < 1) animation = requestAnimationFrame(animerCompteurs);
    };
    animation = requestAnimationFrame(animerCompteurs);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", gererScroll);
      cancelAnimationFrame(animation);
    };
  }, []);

  const gererParallaxe = (evenement: MouseEvent<HTMLElement>) => {
    const zone = evenement.currentTarget.getBoundingClientRect();
    const x = ((evenement.clientX - zone.left) / zone.width - 0.5) * 2;
    const y = ((evenement.clientY - zone.top) / zone.height - 0.5) * 2;
    setParallaxe({ x, y });
  };

  const styleParallaxe = {
    "--ds-parallax-x": parallaxe.x,
    "--ds-parallax-y": parallaxe.y,
  } as CSSProperties;

  return (
    <main className="ds-vitrine">
      <header className={`ds-entete ${enteteCompacte ? "ds-entete-compacte" : ""}`}>
        <div className="ds-conteneur ds-navigation">
          <Link href="/" className="ds-logo">
            <span className="ds-logo-bouclier"><School size={25}/></span>
            <span><strong>DS School</strong><small>PREMIUM</small></span>
          </Link>

          <nav className={`ds-menu ${menuOuvert ? "ds-menu-ouvert" : ""}`}>
            <a href="#accueil" className="actif" onClick={() => setMenuOuvert(false)}>Accueil</a>
            <a href="#fonctionnalites" onClick={() => setMenuOuvert(false)}>Fonctionnalités</a>
            <a href="#solutions" onClick={() => setMenuOuvert(false)}>Solutions</a>
            <a href="#avantages" onClick={() => setMenuOuvert(false)}>Avantages</a>
            <a href="#tarifs" onClick={() => setMenuOuvert(false)}>Tarifs</a>
            <a href="#ressources" onClick={() => setMenuOuvert(false)}>Ressources <ChevronDown size={13}/></a>
            <Link href="/verifier-document" className="ds-lien-verification-menu" onClick={() => setMenuOuvert(false)}><ShieldCheck size={15}/> Vérifier un document</Link>
            <a href="#contact" onClick={() => setMenuOuvert(false)}>Contact</a>
          </nav>

          <div className="ds-actions-nav">
            <Link href="/verifier-document" className="ds-btn ds-btn-verification"><ShieldCheck size={17}/> Vérification</Link>
            <Link href="/connexion" className="ds-btn ds-btn-connexion">Se connecter</Link>
            <a href="#contact" className="ds-btn ds-btn-jaune">Demander une démo <ArrowRight size={17}/></a>
            <button className="ds-bouton-menu" onClick={() => setMenuOuvert(!menuOuvert)} aria-label="Ouvrir le menu">
              {menuOuvert ? <X/> : <Menu/>}
            </button>
          </div>
        </div>
      </header>

      <section className="ds-hero" id="accueil" onMouseMove={gererParallaxe} onMouseLeave={() => setParallaxe({x:0,y:0})} style={styleParallaxe}>
        <div className="ds-particules" aria-hidden="true">{Array.from({length: 16}).map((_, index) => <i key={index}/>)}</div><div className="ds-bulle ds-bulle-1"/><div className="ds-bulle ds-bulle-2"/><div className="ds-bulle ds-bulle-3"/>
        <div className="ds-papier-avion"><Send size={28}/><i/></div>
        <div className="ds-conteneur ds-hero-grille">
          <div className="ds-hero-texte">
            <span className="ds-etiquette ds-reveal"><Sparkles size={15}/> LA SOLUTION SCOLAIRE TOUT-EN-UN</span>
            <h1 className="ds-reveal ds-delai-1">La gestion scolaire intelligente pour des établissements <em>d’excellence</em></h1>
            <p className="ds-reveal ds-delai-2">DS School Premium centralise élèves, enseignants, notes, paiements, présences et rapports dans une plateforme moderne, sécurisée et accessible partout.</p>
            <div className="ds-hero-actions ds-reveal ds-delai-3">
              <a href="#fonctionnalites" className="ds-btn ds-btn-principal"><Send size={18}/> Découvrir la plateforme <ArrowRight size={17}/></a>
              <Link href="/dashboard" className="ds-btn ds-btn-demo">Voir la démo <PlayCircle size={20}/></Link>
              <a
                href="/documents/Brochure_DS_SCHOOL_ENTERPRISE_DETAILLEE.pdf"
                download="Brochure_DS_SCHOOL_ENTERPRISE.pdf"
                className="ds-btn ds-btn-brochure"
                aria-label="Télécharger la brochure commerciale DS School Enterprise au format PDF"
              >
                <Download size={19}/> Télécharger la brochure PDF
              </a>
            </div>
            <div className="ds-preuve ds-reveal ds-delai-4">
              <div className="ds-avatars"><span>DR</span><span>PR</span><span>CO</span><span>EN</span></div>
              <p>Déjà adopté par plus de <strong>500 établissements</strong></p>
              <div className="ds-etoiles">★★★★★</div>
            </div>
          </div>

          <div className="ds-scene-dashboard ds-reveal ds-delai-2">
            <div className="ds-halo-dashboard"/>
            <div className="ds-tableau">
              <div className="ds-barre-tableau">
                <div className="ds-mini-logo"><School size={16}/> DS School</div>
                <div className="ds-recherche">⌕ &nbsp; Rechercher...</div>
                <div className="ds-profil"><span>JL</span><div><b>Directeur</b><small>Lycée Moderne</small></div></div>
              </div>
              <div className="ds-corps-tableau">
                <aside className="ds-mini-menu">
                  {[
                    [BarChart3,"Tableau de bord"],[UsersRound,"Élèves"],[GraduationCap,"Enseignants"],
                    [School,"Classes"],[BookOpen,"Inscriptions"],[CheckCircle2,"Présences"],
                    [NotebookTabs,"Notes & Bulletins"],[CreditCard,"Paiements"],[BarChart3,"Rapports"],[UserRoundCog,"Paramètres"]
                  ].map(([Icone, libelle], index) => {
                    const I = Icone as typeof BarChart3;
                    return <div className={index === 0 ? "actif" : ""} key={String(libelle)}><I size={13}/><span>{String(libelle)}</span></div>
                  })}
                </aside>
                <div className="ds-zone-tableau">
                  <h3>Tableau de bord</h3>
                  <div className="ds-kpis">
                    <div><span><UsersRound size={14}/> Élèves</span><b>2,543</b><small className="hausse">+12% ce mois</small></div>
                    <div><span><GraduationCap size={14}/> Enseignants</span><b>128</b><small className="hausse">+8% ce mois</small></div>
                    <div><span><School size={14}/> Classes</span><b>86</b><small className="hausse">+5% ce mois</small></div>
                    <div><span><CreditCard size={14}/> Paiements</span><b>15,780,000<sup> FCFA</sup></b><small className="hausse">+18% ce mois</small></div>
                  </div>
                  <div className="ds-panneaux">
                    <div className="ds-graphique">
                      <div className="ds-titre-panneau"><b>Revenus</b><span>15,780,000 FCFA</span></div>
                      <div className="ds-courbe"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
                      <div className="ds-mois"><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span></div>
                    </div>
                    <div className="ds-presence"><b>Taux de présence</b><div className="ds-anneau"><span>92%</span></div><small>Présence globale</small></div>
                    <div className="ds-activites"><b>Activités récentes</b>
                      <p><i className="bleu"/><span>Paiement reçu<small>Il y a 2 min</small></span></p>
                      <p><i className="orange"/><span>Nouvelle inscription<small>Il y a 15 min</small></span></p>
                      <p><i className="vert"/><span>Bulletin généré<small>Il y a 1 h</small></span></p>
                      <p><i className="rouge"/><span>Absence signalée<small>Il y a 2 h</small></span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ds-badges-flottants">
              <div><LockKeyhole/><span><b>Sécurité</b><small>100%</small></span></div>
              <div><Cloud/><span><b>Sauvegarde</b><small>Automatique</small></span></div>
              <div><Headphones/><span><b>Support</b><small>24h/24 • 7j/7</small></span></div>
            </div>
          </div>
        </div>
        <div className="ds-vague-jaune"/><div className="ds-vague-bleue"/>
      </section>

      <section className="ds-chiffres ds-reveal">
        <div className="ds-conteneur ds-chiffres-grille">
          <div><GraduationCap/><p><b>{compteurs.etablissements}+</b><span>Établissements accompagnés</span></p></div>
          <div><Clock3/><p><b>24h/24</b><span>Accessibilité continue</span></p></div>
          <div><Building2/><p><b>{compteurs.modules}+</b><span>Modules intégrés</span></p></div>
          <div><Users/><p><b>{compteurs.espaces}</b><span>Espaces utilisateurs</span></p></div>
          <div><TrendingDown/><p><b>-{compteurs.gain}%</b><span>Temps administratif</span></p></div>
        </div>
      </section>

      <section className="ds-section ds-fonctionnalites" id="fonctionnalites">
        <div className="ds-conteneur ds-fonctionnalites-grille">
          <div className="ds-intro-section ds-reveal">
            <span className="ds-mini-etiquette">TOUTES LES FONCTIONNALITÉS</span>
            <h2>Une suite complète pour une gestion sans limites</h2>
            <p>DS School Premium regroupe tous les outils nécessaires pour gérer efficacement votre établissement scolaire.</p>
            <a href="#solutions" className="ds-lien-modules">Explorer tous les modules <ArrowRight size={17}/></a>
          </div>
          <div className="ds-cartes-modules">
            {fonctionnalites.map(({icon: Icone,titre,texte,ton}, index) => (
              <article className={`ds-carte-module ds-reveal ds-${ton}`} style={{transitionDelay:`${index * 45}ms`}} key={titre}>
                <span><Icone size={21}/></span><h3>{titre}</h3><p>{texte}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ds-section ds-appareils" id="solutions">
        <div className="ds-conteneur ds-appareils-grille">
          <div className="ds-materiels ds-reveal">
            <div className="ds-ordinateur"><div className="ds-ecran"><div className="ds-interface-mini"><span/><span/><span/><span/><i/><i/><i/></div></div><div className="ds-clavier"/></div>
            <div className="ds-tablette"><div><span/><span/><i/><i/></div></div>
            <div className="ds-telephone"><div><span/><i/><i/><i/></div></div>
            <div className="ds-plante">🌿</div>
          </div>
          <div className="ds-texte-appareils ds-reveal">
            <span className="ds-mini-etiquette">ACCESSIBLE PARTOUT</span>
            <h2>Une expérience fluide sur tous vos appareils</h2>
            <p>Accédez à toutes les fonctionnalités de DS School depuis votre ordinateur, tablette ou smartphone.</p>
            <div className="ds-types-appareils">
              <div><Laptop/><span>Ordinateur</span></div><b>›</b><div><Tablet/><span>Tablette</span></div><b>›</b><div><Smartphone/><span>Smartphone</span></div><b>›</b><div><CheckCircle2/><span>100% Responsive</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section ds-avantages" id="avantages">
        <div className="ds-conteneur">
          <span className="ds-mini-etiquette ds-reveal">POURQUOI CHOISIR DS SCHOOL ?</span>
          <div className="ds-avantages-grille">
            <div className="ds-titre-avantages ds-reveal"><h2>Des avantages concrets pour votre établissement</h2></div>
            {avantages.map(({icon: Icone,titre,texte}, index) => <article className="ds-avantage ds-reveal" style={{transitionDelay:`${index*70}ms`}} key={titre}><span><Icone/></span><h3>{titre}</h3><p>{texte}</p></article>)}
          </div>
        </div>
      </section>

      <section className="ds-section ds-tarifs" id="tarifs">
        <div className="ds-conteneur">
          <div className="ds-tarifs-entete ds-reveal">
            <span className="ds-mini-etiquette"><CreditCard size={15}/> TARIFICATION SELON VOTRE EFFECTIF</span>
            <h2>Vous payez selon le nombre réel d’élèves ou d’étudiants</h2>
            <p>DS School Enterprise n’impose pas un prix fixe identique à tous les établissements. Le coût est déterminé selon votre effectif et les paramètres commerciaux définis par DIGIGROUPE dans l’administration.</p>
          </div>

          <div className="ds-tarifs-grille">
            <article className="ds-tarif-carte ds-reveal ds-delai-1">
              <span className="ds-tarif-icone"><School size={25}/></span>
              <small>ÉCOLES</small>
              <h3>Primaire & secondaire</h3>
              <p>Tarification proportionnelle au nombre d’élèves inscrits dans l’établissement.</p>
              <ul>
                <li><CheckCircle2 size={16}/> Tous les modules autorisés par votre licence</li>
                <li><CheckCircle2 size={16}/> Quota d’élèves adapté à votre effectif</li>
                <li><CheckCircle2 size={16}/> Évolution possible lorsque l’école grandit</li>
              </ul>
            </article>

            <article className="ds-tarif-carte ds-tarif-carte-principale ds-reveal ds-delai-2">
              <span className="ds-tarif-badge">MODÈLE DS SCHOOL</span>
              <span className="ds-tarif-icone"><UsersRound size={25}/></span>
              <small>FACTURATION</small>
              <h3>Par élève / étudiant</h3>
              <p>Le nombre d’apprenants est la base commerciale. Le montant final est configuré et validé par DIGIGROUPE dans l’espace administratif déjà existant.</p>
              <div className="ds-tarif-formule">
                <b>Effectif réel</b><span>×</span><b>tarif applicable</b><span>=</span><strong>votre offre</strong>
              </div>
              <small className="ds-tarif-note">Aucun montant fixe n’est imposé depuis la vitrine.</small>
            </article>

            <article className="ds-tarif-carte ds-reveal ds-delai-3">
              <span className="ds-tarif-icone"><GraduationCap size={25}/></span>
              <small>UNIVERSITÉS</small>
              <h3>Universités & instituts</h3>
              <p>Le même principe s’applique selon le nombre d’étudiants, avec une capacité adaptée à la taille de l’institution.</p>
              <ul>
                <li><CheckCircle2 size={16}/> Facultés, filières et promotions</li>
                <li><CheckCircle2 size={16}/> Semestres, UE, cours et crédits</li>
                <li><CheckCircle2 size={16}/> Tarification ajustée à l’effectif étudiant</li>
              </ul>
            </article>
          </div>

          <div className="ds-tarif-demande ds-reveal">
            <div className="ds-tarif-demande-texte">
              <span className="ds-tarif-demande-icone"><BarChart3 size={24}/></span>
              <div>
                <small>PRÉPAREZ VOTRE DEMANDE</small>
                <h3>Indiquez simplement votre effectif</h3>
                <p>La vitrine recueille l’information commerciale. Le calcul et la validation restent gérés dans l’administration DS School.</p>
              </div>
            </div>
            <div className="ds-tarif-champs">
              <label>Type d’établissement
                <select value={typeEtablissementTarif} onChange={(e) => setTypeEtablissementTarif(e.target.value)}>
                  <option>École primaire / secondaire</option>
                  <option>Université / institut supérieur</option>
                  <option>Établissement mixte</option>
                </select>
              </label>
              <label>Nombre d’élèves / étudiants
                <input type="number" min="1" step="1" value={effectifTarif} onChange={(e) => setEffectifTarif(e.target.value)} placeholder="Ex. 500"/>
              </label>
              <a
                className="ds-btn ds-btn-principal ds-tarif-demande-btn"
                href={`/demande?type=TARIFICATION&etablissement=${encodeURIComponent(typeEtablissementTarif)}&effectif=${encodeURIComponent(effectifTarif || "")}`}
              >
                Demander ma tarification <ArrowRight size={18}/>
              </a>

              <Link
                href="/paiement-abonnement"
                className="ds-btn ds-btn-connexion ds-tarif-demande-btn"
              >
                <CreditCard size={18}/>
                Payer mon abonnement
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section ds-documents" id="verification-documents">
        <div className="ds-conteneur">
          <div className="ds-documents-entete ds-reveal">
            <div>
              <span className="ds-mini-etiquette"><ShieldCheck size={15}/> DOCUMENTS ACADÉMIQUES SÉCURISÉS</span>
              <h2>Vérifiez instantanément l’authenticité d’un document</h2>
              <p>Diplômes, certificats et attestations sont protégés par un numéro officiel, un code unique et un QR Code de vérification publique.</p>
            </div>
            <Link href="/verifier-document" className="ds-btn ds-btn-principal"><ShieldCheck size={19}/> Vérifier maintenant <ArrowRight size={18}/></Link>
          </div>

          <div className="ds-scan-demo ds-reveal">
            <div className="ds-document-virtuel">
              <div className="ds-document-entete-mini"><School size={22}/><span>DS SCHOOL PREMIUM</span></div>
              <div className="ds-document-corps-mini"><b>DIPLÔME SÉCURISÉ</b><span>N° DS-2026-00487</span><small>Code : VRF-8K2M-91XQ</small></div>
              <div className="ds-faux-qr"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
              <div className="ds-ligne-scan"/>
            </div>
            <div className="ds-resultat-scan">
              <span className="ds-coche-scan"><CheckCircle2 size={30}/></span>
              <div><small>VÉRIFICATION EN DIRECT</small><strong>Document authentique</strong><p>Référence trouvée dans le registre académique sécurisé.</p></div>
            </div>
          </div>

          <div className="ds-documents-grille">
            <article className="ds-carte-document ds-reveal ds-delai-1">
              <span className="ds-document-icone"><FileCheck2 size={30}/></span>
              <div className="ds-document-numero">01</div>
              <h3>Numéro officiel unique</h3>
              <p>Chaque document reçoit une référence infalsifiable enregistrée dans le registre académique.</p>
              <i className="ds-lueur-carte"/>
            </article>
            <article className="ds-carte-document ds-reveal ds-delai-2">
              <span className="ds-document-icone"><QrCode size={30}/></span>
              <div className="ds-document-numero">02</div>
              <h3>QR Code intelligent</h3>
              <p>Un simple scan ouvre la page publique et affiche immédiatement le statut du document.</p>
              <i className="ds-lueur-carte"/>
            </article>
            <article className="ds-carte-document ds-reveal ds-delai-3">
              <span className="ds-document-icone"><ShieldCheck size={30}/></span>
              <div className="ds-document-numero">03</div>
              <h3>Contrôle public sécurisé</h3>
              <p>Parents, écoles, universités et employeurs peuvent confirmer l’authenticité en quelques secondes.</p>
              <i className="ds-lueur-carte"/>
            </article>
          </div>
        </div>
      </section>

      <section className="ds-cta" id="contact">
        <div className="ds-conteneur ds-cta-contenu ds-reveal">
          <div className="ds-ecole-illustration"><div className="ds-toit">▲</div><div className="ds-batiment"><span>DS</span><i/><i/><i/></div><div className="ds-arbres">🌳 🌳</div></div>
          <div><h2>Prêt à transformer la gestion de votre établissement ?</h2><p>Demandez une démonstration personnalisée et découvrez DS School Premium en action.</p></div>
          <div className="ds-cta-actions">
            <a href="/demande?type=DEMONSTRATION" className="ds-btn ds-btn-principal">Demander une démonstration <ArrowRight size={18}/></a>
            <Link href="/paiement-abonnement" className="ds-btn ds-btn-contact"><CreditCard size={18}/> Payer mon abonnement</Link>
            <a href="/documents/Brochure_DS_SCHOOL_ENTERPRISE_DETAILLEE.pdf" download="Brochure_DS_SCHOOL_ENTERPRISE.pdf" className="ds-btn ds-btn-telechargement-cta"><Download size={18}/> Télécharger le PDF</a>
            <a href="/demande?type=INFORMATION" className="ds-btn ds-btn-contact">Nous contacter ☎</a>
          </div>
          <Send className="ds-avion-cta"/>
        </div>
      </section>

      <footer className="ds-pied" id="ressources">
        <div className="ds-conteneur ds-pied-grille">
          <div><Link href="/" className="ds-logo"><span className="ds-logo-bouclier"><School size={23}/></span><span><strong>DS School</strong><small>PREMIUM</small></span></Link><p>La plateforme tout-en-un pour une gestion scolaire moderne, efficace et sécurisée.</p></div>
          <div><b>Navigation</b><a href="#accueil">Accueil</a><a href="#fonctionnalites">Fonctionnalités</a><a href="#solutions">Solutions</a><Link href="/verifier-document">Vérifier un document</Link><a href="#contact">Contact</a></div>
          <div className="ds-colonne-ressources">
            <b>Ressources</b>
            <a href="/documents/Brochure_DS_SCHOOL_ENTERPRISE_DETAILLEE.pdf" download="Brochure_DS_SCHOOL_ENTERPRISE.pdf" className="ds-lien-brochure-pied"><Download size={15}/> Télécharger la brochure PDF</a>
            <span>Format PDF imprimable</span>
            <span>Présentation commerciale détaillée</span>
          </div>
          <div><b>Fonctionnalités</b><a href="#fonctionnalites">Gestion des élèves</a><a href="#fonctionnalites">Gestion des enseignants</a><a href="#fonctionnalites">Notes & Bulletins</a><Link href="/verifier-document">Diplômes & certificats</Link><a href="#fonctionnalites">Rapports & Statistiques</a></div>
          <div><b>Solutions</b><span>Écoles privées</span><span>Collèges & Lycées</span><span>Centres de formation</span><span>Universités</span></div>
          <div><b>Contact</b><span>✉ contact@dsschool.com</span><span>⌖ +243 00 00 00 00</span><span>⌖ Kinshasa, RDC</span></div>
        </div>
        <div className="ds-conteneur ds-copyright"><span>© 2026 DS School Premium. Tous droits réservés.</span><span>Conditions d’utilisation &nbsp;&nbsp; | &nbsp;&nbsp; Politique de confidentialité</span></div>
      </footer>
    </main>
  );
}