"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, MapPin, QrCode, ScanLine } from "lucide-react";
const liens=[
{href:"/dashboard/safe-campus",label:"Vue d’ensemble",icon:LayoutDashboard},
{href:"/dashboard/safe-campus/controle",label:"Scanner un QR Code",icon:ScanLine},
{href:"/dashboard/safe-campus/cartes",label:"Cartes QR élèves",icon:QrCode},
{href:"/dashboard/safe-campus/passages",label:"Journal des passages",icon:History},
{href:"/dashboard/safe-campus/lecteurs",label:"Points de contrôle",icon:MapPin},
];
export default function SafeCampusNav(){const pathname=usePathname();return <nav className="safe-nav">{liens.map(({href,label,icon:Icon})=>{const actif=href==="/dashboard/safe-campus"?pathname===href:pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={`safe-nav-link ${actif?"active":""}`}><Icon size={17}/><span>{label}</span></Link>})}</nav>}
