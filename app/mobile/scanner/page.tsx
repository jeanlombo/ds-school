import Link from "next/link";

import ScannerPwaClient from "@/components/mobile/ScannerPwaClient";
import { prisma } from "@/lib/prisma";
import { exigerPermission } from "@/lib/securite/rbac";

import styles from "./scanner.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DS School Scanner",
  description: "PWA mobile de scan et synchronisation Safe Campus.",
};

export default async function ScannerMobilePage() {
  await exigerPermission("SAFE_CAMPUS_VOIR", "PWA Scanner Safe Campus");

  const lecteurs = await (prisma as any).lecteurRfid.findMany({
    where: { statut: "ACTIF" },
    select: { id: true, nom: true, emplacement: true },
    orderBy: { nom: "asc" },
  });

  return (
    <main className={styles.page}>
      <header className={styles.entete}>
        <div>
          <span className={styles.badge}>DS SCHOOL MOBILE</span>
          <h1>Scanner & synchroniser</h1>
          <p>QR Code, UID RFID/NFC et mode hors connexion.</p>
        </div>
        <Link href="/dashboard/safe-campus" className={styles.retour}>
          Retour Safe Campus
        </Link>
      </header>

      <ScannerPwaClient lecteurs={lecteurs} />
    </main>
  );
}
