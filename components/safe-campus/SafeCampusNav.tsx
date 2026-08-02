import Link from "next/link";

export default function SafeCampusNav() {
  const liens = [
    { href: "/dashboard/safe-campus", label: "Vue d'ensemble" },
    { href: "/dashboard/safe-campus/cartes", label: "Cartes RFID" },
    { href: "/dashboard/safe-campus/lecteurs", label: "Lecteurs" },
    { href: "/dashboard/safe-campus/controle", label: "Contrôle d'accès" },
    { href: "/dashboard/safe-campus/passages", label: "Passages" },
  ];

  return (
    <nav className="safe-nav">
      {liens.map((lien) => (
        <Link key={lien.href} href={lien.href} className="safe-nav-link">
          {lien.label}
        </Link>
      ))}
    </nav>
  );
}
