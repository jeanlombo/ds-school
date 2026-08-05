import Link from "next/link";
import { exigerPermission } from "@/lib/securite/rbac";
import ScannerMobileClient from "@/components/mobile/ScannerMobileClient";
import styles from "./scanner.module.css";

export const dynamic = "force-dynamic";

export default async function ScannerMobilePage() {
  await exigerPermission("SAFE_CAMPUS_VOIR", "Scanner mobile Safe Campus");

  return (
    <main className={styles.page}>
      <header className={styles.entete}>
        <div>
          <span className={styles.badge}>DS SCHOOL MOBILE</span>
          <h1>Scanner Safe Campus</h1>
          <p>Scannez une carte QR et synchronisez automatiquement le passage.</p>
        </div>
        <Link href="/dashboard/safe-campus" className={styles.retour}>
          Retour Safe Campus
        </Link>
      </header>

      <ScannerMobileClient />
    </main>
  );
}
