import Sidebar from "@/components/sidebar/Sidebar";

export default function Page() {
  return <div className="dashboard-shell"><Sidebar /><main className="main"><header className="topbar"><div><h2>Enseignants</h2><p style={{ color: "var(--muted)" }}>Module prêt à être développé et connecté à MySQL.</p></div></header><section className="panel"><h3>Module Enseignants</h3><p>Cette page fait partie de l'architecture initiale de DS School Premium.</p></section></main></div>;
}
