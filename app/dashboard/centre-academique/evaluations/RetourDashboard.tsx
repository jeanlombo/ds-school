import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./evaluations.module.css";

export default function RetourDashboard() {
  return (
    <Link href="/dashboard" className={styles.retourDashboard}>
      <ArrowLeft size={17} /> Retour au Dashboard
    </Link>
  );
}
