import { Camera, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ScanQrClient from "@/components/safe-campus/ScanQrClient";
export const dynamic="force-dynamic";
export default async function ControleAccesPage(){const lecteurs=await (prisma as any).lecteurRfid.findMany({where:{statut:"ACTIF"},select:{id:true,nom:true,emplacement:true},orderBy:{nom:"asc"}});return <main><section className="page-heading"><div><span>POSTE DE SÉCURITÉ</span><h2>Scanner une carte scolaire QR Code</h2><p>Utilisez la caméra du téléphone ou de l’ordinateur.</p></div><div className="heading-icon"><Camera/></div></section><div className="info-banner"><ShieldCheck size={19}/><p>Aucun matériel RFID n’est nécessaire.</p></div><ScanQrClient lecteurs={lecteurs}/></main>}
