import { prisma } from "@/lib/prisma";
import ScanRfidClient from "@/components/safe-campus/ScanRfidClient";

export const dynamic = "force-dynamic";

export default async function ControleAccesPage() {
  const lecteurs = await (prisma as any).lecteurRfid.findMany({
    where: { statut: "ACTIF" },
    select: { id: true, nom: true, emplacement: true },
    orderBy: { nom: "asc" },
  });

  return (
    <main>
      <section className="page-heading">
        <div><span>POSTE DE SÉCURITÉ</span><h2>Contrôle d’accès RFID</h2><p>Scannez une carte pour enregistrer automatiquement le passage.</p></div>
      </section>
      <ScanRfidClient lecteurs={lecteurs} />
    </main>
  );
}
