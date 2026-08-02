import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./centre-academique.module.css";
export default function RetourDashboard(){return <Link href="/dashboard" className={styles.retour}><ArrowLeft size={18}/> Retour au Dashboard</Link>}
