import Link from "next/link";

const menus = [
  ["Tableau de bord", "/dashboard"], ["Élèves", "/eleves"], ["Enseignants", "/enseignants"],
  ["Classes", "/classes"], ["Inscriptions", "/inscriptions"], ["Présences", "/presences"],
  ["Notes", "/notes"], ["Bulletins", "/bulletins"], ["Paiements", "/paiements"],
  ["Rapports", "/rapports"], ["Utilisateurs", "/utilisateurs"], ["Paramètres", "/parametres"]
];

export default function Sidebar() {
  return <aside className="sidebar"><div className="brand">DS School Premium</div><nav className="nav">{menus.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav></aside>;
}
