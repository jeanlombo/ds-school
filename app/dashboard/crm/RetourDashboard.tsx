import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./crm.module.css";
export default function RetourDashboard(){return <Link className={styles.retour} href="/dashboard"><ArrowLeft size={17}/> Retour au Dashboard</Link>}
