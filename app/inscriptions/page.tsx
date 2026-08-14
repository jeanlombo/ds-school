import Sidebar from "@/components/sidebar/Sidebar";

export default function Page() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <div>
            <h2>Inscriptions scolaires / académiques</h2>
            <p style={{ color: "var(--muted)" }}>
              Les inscriptions sont gérées selon la section : Élève pour le Primaire, le Secondaire et les Humanités ; Étudiant / Étudiante pour l’Université et les Instituts supérieurs.
            </p>
          </div>
        </header>

        <section className="panel">
          <h3>Gestion multi-niveaux</h3>
          <p>
            Utilisez le répertoire des apprenants pour créer et consulter les dossiers.
            La terminologie des fiches et cartes s’adapte automatiquement à la section
            de l’inscription.
          </p>
        </section>
      </main>
    </div>
  );
}
